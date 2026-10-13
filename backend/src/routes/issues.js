const express = require('express');
const router = express.Router();
const multer = require('multer');
const prisma = require('../config/prisma');
const { authenticateToken, authorizeRole, normalizeRole } = require('../middleware/auth');
const optimizeImages = require('../middleware/imageOptimizer');

const upload = multer({ storage: multer.memoryStorage() });

// Helper: cek apakah user berhak mengakses isu ini (sebagai reporter atau kru AMT1/AMT2)
const isUserAuthorizedForHandover = (user, handover) => {
  const effectiveRole = normalizeRole(user.role);
  if (['ADMIN', 'SUPER_ADMIN', 'PENGAWAS'].includes(effectiveRole)) return true;
  if (!handover) return false;
  if (handover.userId === user.id) return true;
  if (user.name && (handover.amt1 === user.name || handover.amt2 === user.name)) return true;
  if (user.username && (handover.amt1 === user.username || handover.amt2 === user.username)) return true;
  return false;
};

// 1. GET Ongoing Issues (Isu Kendaraan yang sedang aktif)
router.get('/ongoing', authenticateToken, async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const effectiveRole = normalizeRole(role);

    if (!['ADMIN', 'SUPER_ADMIN', 'PENGAWAS', 'AMT'].includes(effectiveRole)) {
      return res.status(403).json({ error: 'Akses ditolak' });
    }

    const where = {
      status: { in: ['ONGOING', 'PENDING_APPROVAL'] }
    };

    if (effectiveRole === 'AMT') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, username: true }
      });
      const conditions = [{ userId }];
      if (user?.name) {
        conditions.push({ amt1: user.name });
        conditions.push({ amt2: user.name });
      }
      if (user?.username) {
        conditions.push({ amt1: user.username });
        conditions.push({ amt2: user.username });
      }
      where.handover = {
        OR: conditions
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

// 2. GET All Issues (Admin & Pengawas, dengan filter status & pencarian)
router.get('/', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN', 'PENGAWAS']), async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search && search.trim()) {
      const cleanSearch = search.trim();
      where.OR = [
        { id: { contains: cleanSearch } },
        { handover: { noPolisi: { contains: cleanSearch } } },
        { handover: { handoverNo: { contains: cleanSearch } } }
      ];
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

// 2b. GET All AMT Compliance Findings (Temuan Kepatuhan / Isu Perlengkapan AMT)
router.get('/amt-compliance', authenticateToken, async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const effectiveRole = normalizeRole(role);
    const { status, search } = req.query;
    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search && search.trim()) {
      where.OR = [
        { itemName: { contains: search.trim() } },
        { amtName: { contains: search.trim() } },
        { handover: { noPolisi: { contains: search.trim() } } }
      ];
    }

    if (effectiveRole === 'AMT') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, username: true }
      });
      const amtConditions = [{ amtUserId: userId }];
      if (user?.name) amtConditions.push({ amtName: user.name });
      where.OR = amtConditions;
    }

    const findings = await prisma.amtComplianceFinding.findMany({
      where,
      include: {
        handover: {
          select: { id: true, handoverNo: true, noPolisi: true, shift: true, createdAt: true, amt1: true, amt2: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, findings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2c. PUT Resolve AMT Compliance Finding (Admin & Pengawas)
router.put('/amt-compliance/:id/resolve', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN', 'PENGAWAS']), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const finding = await prisma.amtComplianceFinding.findUnique({
      where: { id },
      include: { handover: true }
    });

    if (!finding) {
      return res.status(404).json({ error: 'Temuan kepatuhan AMT tidak ditemukan' });
    }

    const updated = await prisma.amtComplianceFinding.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: req.user ? req.user.name : 'PENGAWAS',
        resolutionNotes: notes || 'Telah diverifikasi dan dilengkapi oleh AMT'
      }
    });

    // Kirim notifikasi konfirmasi ke AMT jika ada targetUserId
    if (finding.amtUserId) {
      await prisma.notification.create({
        data: {
          title: 'Temuan Kepatuhan Selesai',
          message: `Temuan kepatuhan untuk '${finding.itemName}' telah diverifikasi dan diselesaikan.`,
          type: 'SUCCESS',
          targetRole: 'AMT',
          targetUserId: finding.amtUserId,
          actionType: 'VIEW_HANDOVER',
          actionId: finding.handoverId,
          noPolisi: finding.handover?.noPolisi || null
        }
      });
    }

    res.json({ success: true, finding: updated });
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
          include: { user: true, items: true, photos: true, amtComplianceFindings: true }
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
              include: { user: true, items: true, photos: true, amtComplianceFindings: true }
            }
          }
        });
      }
    }

    if (!issue) {
      return res.status(404).json({ error: 'Isu tidak ditemukan' });
    }

    if (!isUserAuthorizedForHandover(req.user, issue.handover)) {
      return res.status(403).json({ error: 'Tidak ada akses untuk isu ini' });
    }

    res.json(issue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. PUT Resolve Issue (Admin / Pengawas only)
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

    const updatedIssue = await prisma.$transaction(async (tx) => {
      const issue = await tx.issue.update({
        where: { id: target.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolvedBy: req.user ? req.user.name : 'ADMIN'
        }
      });

      if (target.handover?.noPolisi) {
        const otherOngoing = await tx.issue.findFirst({
          where: {
            id: { not: target.id },
            status: { in: ['ONGOING', 'PENDING_APPROVAL'] },
            handover: { noPolisi: target.handover.noPolisi }
          }
        });
        if (!otherOngoing) {
          const vehicle = await tx.vehicle.findUnique({
            where: { noPolisi: target.handover.noPolisi },
            select: { status: true }
          });
          if (vehicle && vehicle.status === 'Maintenance') {
            await tx.vehicle.update({
              where: { noPolisi: target.handover.noPolisi },
              data: { status: 'READY_TO_START' }
            });
          }
        }
      }

      return issue;
    });

    res.json({ success: true, issue: updatedIssue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. POST Verify Repair (AMT mengirim bukti perbaikan kendaraan Kategori A)
router.post('/:id/verify-repair', authenticateToken, upload.any(), optimizeImages, async (req, res) => {
  try {
    const target = await prisma.issue.findFirst({
      where: {
        OR: [
          { id: req.params.id },
          { handoverId: req.params.id }
        ]
      },
      include: { handover: { include: { items: true } } }
    });
    if (!target) return res.status(404).json({ error: 'Issue tidak ditemukan' });

    // Verifikasi kewenangan AMT (reporter awal atau partner AMT 1 / AMT 2)
    if (!isUserAuthorizedForHandover(req.user, target.handover)) {
      return res.status(403).json({ error: 'Akses ditolak: Anda bukan kru atau pelapor yang berwenang untuk serah terima ini' });
    }

    const issueId = target.id;
    const { itemsData } = req.body;
    let items = [];
    try {
      items = JSON.parse(itemsData || '[]');
    } catch (e) {
      return res.status(400).json({ error: 'Format JSON data perbaikan tidak valid' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Daftar item perbaikan wajib disertakan' });
    }

    // Validasi bahwa seluruh item benar-benar bagian dari handover ini dan bertipe Kategori A
    const validHandoverItemIds = (target.handover?.items || []).map(i => i.id);
    for (const item of items) {
      if (!validHandoverItemIds.includes(item.id)) {
        return res.status(400).json({ error: `Item ${item.id} bukan bagian dari serah terima ini` });
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const file = (req.files || []).find(f => f.fieldname === 'photo_' + item.id);
        let photoUrl = null;
        if (file) {
          photoUrl = (file.path || '').replace(/\\/g, '/');
        }

        const updatePayload = {
          repairNote: item.repairNote || 'Perbaikan telah dilakukan oleh AMT',
          isRepaired: true,
          adminRejectionNote: null
        };
        if (photoUrl) {
          updatePayload.repairPhotoUrl = photoUrl;
        }

        await tx.handoverItem.update({
          where: { id: item.id },
          data: updatePayload
        });
      }

      await tx.issue.update({
        where: { id: issueId },
        data: {
          status: 'PENDING_APPROVAL',
          repairRequestedAt: new Date()
        }
      });
    });

    const updatedIssue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { handover: { include: { items: true } } }
    });

    const vehicleNoPolisi = updatedIssue.handover?.noPolisi || '';
    try {
      await prisma.notification.createMany({
        data: [
          {
            title: `Verifikasi Perbaikan: ${vehicleNoPolisi}`,
            message: `AMT telah mengirim bukti perbaikan untuk truk ${vehicleNoPolisi}. Silakan periksa dan lakukan evaluasi.`,
            type: 'INFO',
            targetRole: 'ADMIN',
            actionType: 'VIEW_ISSUE',
            actionId: issueId,
            noPolisi: vehicleNoPolisi
          },
          {
            title: `Verifikasi Perbaikan: ${vehicleNoPolisi}`,
            message: `AMT telah mengirim bukti perbaikan untuk truk ${vehicleNoPolisi}. Silakan periksa dan lakukan evaluasi.`,
            type: 'INFO',
            targetRole: 'PENGAWAS',
            actionType: 'VIEW_ISSUE',
            actionId: issueId,
            noPolisi: vehicleNoPolisi
          }
        ]
      });
    } catch (notifErr) {
      console.error('Notification creation error:', notifErr);
    }

    res.json({ success: true, issue: updatedIssue });
  } catch (error) {
    console.error('Verify repair error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. POST Evaluate Repair (Evaluasi Perbaikan oleh Admin, Super Admin & Pengawas)
router.post('/:id/evaluate-repair', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN', 'PENGAWAS']), async (req, res) => {
  try {
    const target = await prisma.issue.findFirst({
      where: {
        OR: [
          { id: req.params.id },
          { handoverId: req.params.id }
        ]
      },
      include: { handover: { include: { items: true } } }
    });
    if (!target) return res.status(404).json({ error: 'Issue tidak ditemukan' });

    // Validasi status issue: hanya issue PENDING_APPROVAL atau ONGOING dengan repairRequestedAt yang dapat dievaluasi
    if (target.status === 'RESOLVED') {
      return res.status(400).json({ error: 'Isu ini sudah diselesaikan sebelumnya' });
    }

    const issueId = target.id;
    const { evaluations } = req.body; // Array of { itemId, approved, reason }

    // VALIDASI WAJIB: Evaluasi kosong atau parsial DILARANG dianggap sebagai persetujuan
    if (!Array.isArray(evaluations) || evaluations.length === 0) {
      return res.status(400).json({ error: 'Daftar evaluasi item perbaikan wajib disertakan dan tidak boleh kosong' });
    }

    // Validasi item: jika ditolak, alasan penolakan wajib disertakan
    for (const evalItem of evaluations) {
      if (!evalItem.itemId) {
        return res.status(400).json({ error: 'Setiap evaluasi wajib menyertakan itemId' });
      }
      if (!evalItem.approved && (!evalItem.reason || !evalItem.reason.trim())) {
        return res.status(400).json({ error: 'Alasan penolakan wajib diisi untuk setiap item yang ditolak' });
      }
    }

    let allApproved = true;

    await prisma.$transaction(async (tx) => {
      for (const evalItem of evaluations) {
        if (evalItem.approved) {
          await tx.handoverItem.update({
            where: { id: evalItem.itemId },
            data: {
              isRepaired: true,
              adminRejectionNote: null
            }
          });
        } else {
          allApproved = false;
          await tx.handoverItem.update({
            where: { id: evalItem.itemId },
            data: {
              isRepaired: false,
              adminRejectionNote: evalItem.reason || 'Ditolak oleh Pengawas/Admin'
            }
          });
        }
      }

      if (allApproved) {
        await tx.issue.update({
          where: { id: issueId },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
            resolvedBy: req.user ? req.user.name : 'PENGAWAS'
          }
        });

        // Kembalikan kendaraan ke READY_TO_START jika tidak ada issue lain yang aktif
        const otherOngoing = await tx.issue.findFirst({
          where: {
            id: { not: issueId },
            status: { in: ['ONGOING', 'PENDING_APPROVAL'] },
            handover: { noPolisi: target.handover.noPolisi }
          }
        });

        if (!otherOngoing) {
          await tx.vehicle.update({
            where: { noPolisi: target.handover.noPolisi },
            data: { status: 'READY_TO_START' }
          });
        }
      } else {
        await tx.issue.update({
          where: { id: issueId },
          data: { status: 'ONGOING' }
        });
      }
    });

    const updatedIssue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { handover: true }
    });

    if (allApproved) {
      await prisma.notification.create({
        data: {
          title: 'Perbaikan Disetujui',
          message: `Perbaikan untuk truk ${target.handover.noPolisi} telah disetujui. Kendaraan kembali siap beroperasi.`,
          type: 'SUCCESS',
          targetRole: 'AMT',
          targetUserId: target.handover.userId,
          actionType: 'VIEW_HANDOVER',
          actionId: target.handoverId,
          noPolisi: target.handover.noPolisi,
          isRead: false
        }
      });
      res.json({ success: true, issue: updatedIssue, status: 'RESOLVED' });
    } else {
      const rejectReasons = evaluations.filter(e => !e.approved).map(e => e.reason).filter(Boolean).join('; ');
      await prisma.notification.create({
        data: {
          title: 'Perbaikan Ditolak',
          message: `Perbaikan truk ${target.handover.noPolisi} ditolak. Alasan: ${rejectReasons || 'Periksa catatan evaluator'}. Silakan perbaiki kembali.`,
          type: 'WARNING',
          targetRole: 'AMT',
          targetUserId: target.handover.userId,
          actionType: 'SCAN_REPAIR',
          actionId: issueId,
          noPolisi: target.handover.noPolisi,
          isRead: false
        }
      });
      res.json({ success: true, issue: updatedIssue, status: 'ONGOING' });
    }
  } catch (error) {
    console.error('Evaluate repair error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
