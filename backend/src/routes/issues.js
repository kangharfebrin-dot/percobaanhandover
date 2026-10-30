const express = require('express');
const router = express.Router();
const multer = require('multer');
const prisma = require('../config/prisma');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const optimizeImages = require('../middleware/imageOptimizer');
const { reconcileVehicleOperationalStatus } = require('../services/vehicleStatusService');

const upload = multer({ storage: multer.memoryStorage() });

// 1. GET Ongoing Issues
router.get('/ongoing', authenticateToken, async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    if (!['ADMIN', 'SUPER_ADMIN', 'PENGAWAS', 'AMT'].includes(role)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }

    const where = {
      status: { in: ['ONGOING', 'PENDING_APPROVAL'] }
    };

    if (req.query.noPolisi) {
      where.handover = {
        noPolisi: req.query.noPolisi
      };
    }

    const issues = await prisma.issue.findMany({
      where,
      include: {
        handover: {
          include: { user: true, items: true, photos: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET All Issues (Hanya untuk Admin & Pengawas)
router.get('/', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN', 'PENGAWAS']), async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      include: {
        handover: {
          include: { user: true, items: true, photos: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. GET Single Issue Detail by Issue ID, Handover ID, or No Polisi
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    let issue = await prisma.issue.findFirst({
      where: {
        OR: [
          { id: id },
          { handoverId: id }
        ]
      },
      include: {
        handover: {
          include: { user: true, items: true, photos: true }
        }
      }
    });

    if (!issue) {
      const cleanPlate = id.replace(/\s+/g, '').toUpperCase();
      const allVehicles = await prisma.vehicle.findMany();
      const matchedVeh = allVehicles.find(v => v.noPolisi.replace(/\s+/g, '').toUpperCase() === cleanPlate);
      if (matchedVeh) {
        issue = await prisma.issue.findFirst({
          where: {
            handover: {
              noPolisi: matchedVeh.noPolisi
            }
          },
          orderBy: { createdAt: 'desc' },
          include: {
            handover: {
              include: { user: true, items: true, photos: true }
            }
          }
        });
      }
    }

    if (!issue) {
      return res.status(404).json({ error: 'Isu tidak ditemukan' });
    }

    if (['USER', 'AMT'].includes(req.user.role)) {
      if (issue.handover?.userId !== req.user.id) {
        return res.status(403).json({ error: 'Tidak ada akses untuk isu ini' });
      }
    }

    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. PUT Resolve Issue (A4: Admin / Pengawas only)
router.put('/:id/resolve', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN', 'PENGAWAS']), async (req, res) => {
  try {
    const target = await prisma.issue.findFirst({
      where: {
        OR: [
          { id: req.params.id },
          { handoverId: req.params.id }
        ]
      },
      include: { handover: true }
    });
    if (!target) return res.status(404).json({ error: 'Issue tidak ditemukan' });

    const updatedIssue = await prisma.issue.update({
      where: { id: target.id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: req.user ? req.user.name : 'ADMIN'
      }
    });

    if (target.handover?.noPolisi) {
      const vNopol = target.handover.noPolisi;
      // Sinkronkan status handover, item, dan issue kendaraan
      await prisma.handoverItem.updateMany({
        where: { handoverId: target.handoverId, isGood: false },
        data: { isRepaired: true }
      });
      await prisma.handover.update({
        where: { id: target.handoverId },
        data: { status: 'Siap Operasi (Normal)' }
      });
      await prisma.issue.updateMany({
        where: {
          handover: { noPolisi: vNopol },
          status: { in: ['ONGOING', 'PENDING_APPROVAL'] }
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolvedBy: req.user ? req.user.name : 'ADMIN'
        }
      });
      await reconcileVehicleOperationalStatus(vNopol);
    }

    res.json({ success: true, issue: updatedIssue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. POST Verify Repair (AMT mengirim bukti perbaikan)
router.post('/:id/verify-repair', authenticateToken, upload.any(), optimizeImages, async (req, res) => {
  try {
    const target = await prisma.issue.findFirst({
      where: {
        OR: [
          { id: req.params.id },
          { handoverId: req.params.id }
        ]
      },
      include: { handover: true }
    });
    if (!target) return res.status(404).json({ error: 'Issue tidak ditemukan' });

    const issueId = target.id;
    const { itemsData } = req.body;
    const items = JSON.parse(itemsData || '[]');
    const verifyingAmtName = req.user?.name || 'Petugas AMT';

    for (const item of items) {
      const file = (req.files || []).find(f => f.fieldname === 'photo_' + item.id);
      let photoUrl = null;
      if (file) {
        photoUrl = (file.path || '').replace(/\\/g, '/');
      }

      const cleanNote = item.repairNote ? item.repairNote.trim() : '';
      const formattedNote = cleanNote.startsWith('[Diverifikasi oleh:')
        ? cleanNote
        : `[Diverifikasi oleh: ${verifyingAmtName}] ${cleanNote}`;

      const updatePayload = {
        repairNote: formattedNote,
        isRepaired: true
      };
      if (photoUrl) {
        updatePayload.repairPhotoUrl = photoUrl;
      }

      await prisma.handoverItem.update({
        where: { id: item.id },
        data: updatePayload
      });
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        status: 'PENDING_APPROVAL',
        repairRequestedAt: new Date()
      },
      include: {
        handover: { include: { items: true } }
      }
    });

    res.json({ success: true, issue: updatedIssue });

    const vehicleNoPolisi = updatedIssue.handover?.noPolisi || '';
    try {
      const notifData = [
        {
          title: `Verifikasi Perbaikan: ${vehicleNoPolisi}`,
          message: `AMT ${verifyingAmtName} telah mengirim bukti verifikasi perbaikan untuk truk ${vehicleNoPolisi}. Silakan periksa dan setujui/tolak.`,
          type: 'INFO',
          targetRole: 'ADMIN',
          actionType: 'VIEW_ISSUE',
          actionId: issueId,
          noPolisi: vehicleNoPolisi
        },
        {
          title: `Verifikasi Perbaikan: ${vehicleNoPolisi}`,
          message: `AMT ${verifyingAmtName} telah mengirim bukti verifikasi perbaikan untuk truk ${vehicleNoPolisi}. Silakan periksa dan setujui/tolak.`,
          type: 'INFO',
          targetRole: 'PENGAWAS',
          actionType: 'VIEW_ISSUE',
          actionId: issueId,
          noPolisi: vehicleNoPolisi
        }
      ];

      // Konfirmasi privat untuk AMT yang mengirim bukti perbaikan
      if (req.user && req.user.id) {
        notifData.push({
          title: `Bukti Perbaikan Terkirim: ${vehicleNoPolisi}`,
          message: `Bukti perbaikan untuk truk ${vehicleNoPolisi} telah berhasil dikirim. Menunggu verifikasi dari Pengawas atau Admin.`,
          type: 'INFO',
          targetRole: 'USER',
          targetUserId: req.user.id,
          actionType: 'SCAN_REPAIR',
          actionId: issueId,
          noPolisi: vehicleNoPolisi
        });
      }

      await prisma.notification.createMany({
        data: notifData
      });
    } catch (notifErr) {
      console.error('Notification creation error:', notifErr);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 6. POST Evaluate Repair (A4: Admin & Pengawas only)
router.post('/:id/evaluate-repair', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN', 'PENGAWAS']), async (req, res) => {
  try {
    const target = await prisma.issue.findFirst({
      where: {
        OR: [
          { id: req.params.id },
          { handoverId: req.params.id }
        ]
      },
      include: { handover: true }
    });
    if (!target) return res.status(404).json({ error: 'Issue tidak ditemukan' });
    const issueId = target.id;
    const { evaluations } = req.body; // Array of { itemId, approved, reason }

    let allApproved = true;

    for (const evalItem of (evaluations || [])) {
      if (evalItem.approved) {
        await prisma.handoverItem.update({
          where: { id: evalItem.itemId },
          data: {
            isRepaired: true,
            adminRejectionNote: null
          }
        });
      } else {
        allApproved = false;
        await prisma.handoverItem.update({
          where: { id: evalItem.itemId },
          data: {
            isRepaired: false,
            adminRejectionNote: evalItem.reason || 'Ditolak oleh Admin'
          }
        });
      }
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { handover: true }
    });

    if (allApproved) {
      const updatedIssue = await prisma.issue.update({
        where: { id: issueId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolvedBy: req.user ? req.user.name : null
        }
      });

      const vehicleNoPolisi = issue.handover.noPolisi;

      // Update status kendaraan siap jalan
      await prisma.vehicle.update({
        where: { noPolisi: vehicleNoPolisi },
        data: { 
          status: 'READY_TO_START',
          maintenanceReason: null
        }
      });

      // Update status handover ini menjadi 'Siap Operasi (Normal)'
      await prisma.handover.update({
        where: { id: issue.handoverId },
        data: { status: 'Siap Operasi (Normal)' }
      });

      // Selesaikan SELURUH issue lama pada kendaraan yang sama yang masih ONGOING / PENDING_APPROVAL
      // Karena verifikasi perbaikan kendaraan telah resmi disetujui oleh Admin/Pengawas
      await prisma.issue.updateMany({
        where: {
          handover: { noPolisi: vehicleNoPolisi },
          status: { in: ['ONGOING', 'PENDING_APPROVAL'] }
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolvedBy: req.user ? req.user.name : 'ADMIN'
        }
      });

      // Tandai seluruh item kendaraan lama yang rusak pada kendaraan ini menjadi isRepaired: true
      await prisma.handoverItem.updateMany({
        where: {
          handover: { noPolisi: vehicleNoPolisi },
          isGood: false,
          isRepaired: false,
          category: { in: ['A', 'Kendaraan'] }
        },
        data: {
          isRepaired: true
        }
      });

      // Update seluruh status handover lama pada kendaraan ini yang masih 'Ada Masalah' menjadi 'Siap Operasi (Normal)'
      await prisma.handover.updateMany({
        where: {
          noPolisi: vehicleNoPolisi,
          status: 'Ada Masalah'
        },
        data: {
          status: 'Siap Operasi (Normal)'
        }
      });

      // Target AMT specifically (driver dan co-driver pada handover)
      const targetUserIds = [issue.handover.userId];
      if (issue.handover.amt2) {
        try {
          const amt2User = await prisma.user.findFirst({
            where: { name: issue.handover.amt2, deletedAt: null }
          });
          if (amt2User && !targetUserIds.includes(amt2User.id)) {
            targetUserIds.push(amt2User.id);
          }
        } catch (e) { }
      }

      for (const tId of targetUserIds) {
        if (tId) {
          await prisma.notification.create({
            data: {
              title: 'Perbaikan Disetujui',
              message: `Perbaikan untuk truk ${issue.handover.noPolisi} telah disetujui. Kendaraan siap jalan.`,
              type: 'SUCCESS',
              targetRole: 'USER',
              targetUserId: tId,
              actionType: 'VIEW_HANDOVER',
              actionId: issue.handoverId,
              noPolisi: issue.handover.noPolisi,
              isRead: false
            }
          });
        }
      }
      res.json({ success: true, issue: updatedIssue, status: 'RESOLVED' });
    } else {
      const updatedIssue = await prisma.issue.update({
        where: { id: issueId },
        data: { status: 'ONGOING' }
      });

      // Target AMT specifically (driver dan co-driver pada handover)
      const targetUserIds = [issue.handover.userId];
      if (issue.handover.amt2) {
        try {
          const amt2User = await prisma.user.findFirst({
            where: { name: issue.handover.amt2, deletedAt: null }
          });
          if (amt2User && !targetUserIds.includes(amt2User.id)) {
            targetUserIds.push(amt2User.id);
          }
        } catch (e) { }
      }

      for (const tId of targetUserIds) {
        if (tId) {
          await prisma.notification.create({
            data: {
              title: 'Perbaikan Ditolak',
              message: `Beberapa perbaikan untuk truk ${issue.handover.noPolisi} ditolak. Silakan periksa catatan Admin dan perbaiki kembali.`,
              type: 'WARNING',
              targetRole: 'USER',
              targetUserId: tId,
              actionType: 'SCAN_REPAIR',
              actionId: issueId,
              noPolisi: issue.handover.noPolisi,
              isRead: false
            }
          });
        }
      }
      res.json({ success: true, issue: updatedIssue, status: 'ONGOING' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
