const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticateToken, authorizeRole, normalizeRole } = require('../middleware/auth');
const optimizeImages = require('../middleware/imageOptimizer');
const upload = require('../middleware/upload');


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
          include: {
            user: {
              select: { id: true, name: true, username: true, role: true, jabatan: true }
            },
            items: true,
            photos: true
          }
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
          include: {
            user: {
              select: { id: true, name: true, username: true, role: true, jabatan: true }
            },
            items: true,
            photos: true
          }
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
    const andConditions = [];

    if (status && status !== 'ALL') {
      andConditions.push({ status });
    }

    if (search && search.trim()) {
      andConditions.push({
        OR: [
          { itemName: { contains: search.trim() } },
          { amtName: { contains: search.trim() } },
          { handover: { noPolisi: { contains: search.trim() } } }
        ]
      });
    }

    if (effectiveRole === 'AMT') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, username: true }
      });
      const amtConditions = [{ amtUserId: userId }];
      if (user?.name) amtConditions.push({ amtName: user.name });
      andConditions.push({ OR: amtConditions });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

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

// 2b-1. GET Single AMT Compliance Finding Detail
router.get('/amt-compliance/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;
    const effectiveRole = normalizeRole(role);

    const finding = await prisma.amtComplianceFinding.findUnique({
      where: { id },
      include: {
        handover: {
          select: {
            id: true,
            handoverNo: true,
            noPolisi: true,
            shift: true,
            createdAt: true,
            amt1: true,
            amt2: true,
            userId: true
          }
        }
      }
    });

    if (!finding) {
      return res.status(404).json({ error: 'Temuan kepatuhan AMT tidak ditemukan' });
    }

    if (effectiveRole === 'AMT') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, username: true }
      });
      const isOwner = finding.amtUserId === userId || (user?.name && finding.amtName === user.name);
      if (!isOwner) {
        return res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki hak melihat temuan kepatuhan AMT ini' });
      }
    }

    res.json({ success: true, finding });
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
          include: {
            user: {
              select: { id: true, name: true, username: true, role: true, jabatan: true }
            },
            items: true,
            photos: true,
            amtComplianceFindings: true
          }
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
              include: {
                user: {
                  select: { id: true, name: true, username: true, role: true, jabatan: true }
                },
                items: true,
                photos: true,
                amtComplianceFindings: true
              }
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

// 4. PUT Resolve Issue (Manual Resolve Pengecualian dengan Alasan Wajib & Audit Trail)
router.put('/:id/resolve', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN', 'PENGAWAS']), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Alasan penyelesaian manual wajib disertakan' });
    }

    const target = await prisma.issue.findFirst({
      where: {
        OR: [
          { id: req.params.id },
          { handoverId: req.params.id }
        ]
      },
      include: {
        handover: {
          include: { items: true }
        }
      }
    });
    if (!target) return res.status(404).json({ error: 'Issue tidak ditemukan' });

    if (target.status === 'RESOLVED') {
      return res.status(400).json({ error: 'Isu ini sudah diselesaikan sebelumnya' });
    }

    // Kerusakan Major dilarang dibypass secara manual tanpa alur verifikasi & evaluasi
    const hasUnresolvedMajor = (target.handover?.items || []).some(i =>
      (i.category || 'A') === 'A' && !i.isGood && !i.isRepaired &&
      (i.name.includes('[MAJOR]') || (i.severity && String(i.severity).toLowerCase() === 'major'))
    );

    if (hasUnresolvedMajor) {
      return res.status(403).json({
        error: 'Kerusakan Major tidak dapat diselesaikan secara manual tanpa melalui alur verifikasi dan evaluasi perbaikan.'
      });
    }

    const actorName = req.user?.name || req.user?.username || 'ADMIN';

    const updatedIssue = await prisma.$transaction(async (tx) => {
      // Tandai semua item kerusakan terkait sebagai isRepaired: true
      await tx.handoverItem.updateMany({
        where: {
          handoverId: target.handoverId,
          category: 'A',
          isGood: false
        },
        data: {
          isRepaired: true,
          adminRejectionNote: null
        }
      });

      const issue = await tx.issue.update({
        where: { id: target.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolvedBy: actorName
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

        // Hanya jika tidak ada isu lain DAN status kendaraan sedang Maintenance, kembalikan ke READY_TO_START
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

      // Catat ke AuditLog
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'ISSUE_RESOLVED_MANUAL',
          actionType: 'RESOLVE_ISSUE',
          actionId: target.id,
          details: JSON.stringify({
            noPolisi: target.handover?.noPolisi,
            actorName,
            actorRole: req.user.role,
            reason: reason.trim()
          })
        }
      }).catch(() => {});

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

    // Tolak jika issue sudah berstatus RESOLVED
    if (target.status === 'RESOLVED') {
      return res.status(400).json({ error: 'Isu ini sudah diselesaikan sebelumnya dan tidak dapat dilaporkan perbaikan kembali' });
    }

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

    // Hanya terima item kerusakan kendaraan Kategori A yang memang tidak baik (!isGood) pada handover ini
    const damagedCatAItems = (target.handover?.items || []).filter(i => (i.category || 'A') === 'A' && !i.isGood);
    const damagedItemIds = damagedCatAItems.map(i => i.id);

    for (const item of items) {
      if (!damagedItemIds.includes(item.id)) {
        return res.status(400).json({ error: `Item ${item.id} bukan item kerusakan kendaraan (Kategori A) yang valid untuk serah terima ini` });
      }
    }

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const file = (req.files || []).find(f => f.fieldname === 'photo_' + item.id);
        let photoUrl = null;
        if (file) {
          photoUrl = (file.path || '').replace(/\\/g, '/');
        }

        // isRepaired TETAP false sampai dievaluasi dan disetujui oleh Admin/Pengawas
        const updatePayload = {
          repairNote: item.repairNote || 'Perbaikan telah dilakukan oleh AMT',
          isRepaired: false,
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

    // Validasi status issue: hanya issue PENDING_APPROVAL yang dapat dievaluasi
    if (target.status === 'RESOLVED') {
      return res.status(400).json({ error: 'Isu ini sudah diselesaikan sebelumnya' });
    }
    if (target.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ error: 'Hanya isu dengan perbaikan menunggu persetujuan (PENDING_APPROVAL) yang dapat dievaluasi' });
    }

    const issueId = target.id;
    const { evaluations } = req.body; // Array of { itemId, approved, reason }

    // VALIDASI WAJIB: Evaluasi tidak boleh kosong
    if (!Array.isArray(evaluations) || evaluations.length === 0) {
      return res.status(400).json({ error: 'Daftar evaluasi item perbaikan wajib disertakan dan tidak boleh kosong' });
    }

    // Seluruh item kerusakan kendaraan Kategori A pada isu ini
    const damagedCatAItems = (target.handover?.items || []).filter(i => (i.category || 'A') === 'A' && !i.isGood);
    const damagedItemIds = damagedCatAItems.map(i => i.id);

    const evalItemIds = evaluations.map(e => e.itemId);
    const uniqueEvalItemIds = new Set(evalItemIds);

    // Cek duplikasi item
    if (uniqueEvalItemIds.size !== evalItemIds.length) {
      return res.status(400).json({ error: 'Daftar evaluasi mengandung item duplikat' });
    }

    // Validasi item: harus termasuk item kerusakan isu ini
    for (const id of evalItemIds) {
      if (!damagedItemIds.includes(id)) {
        return res.status(400).json({ error: `Item ${id} bukan item kerusakan dari isu ini` });
      }
    }

    // Cegah evaluasi parsial: seluruh item kerusakan wajib dievaluasi
    for (const id of damagedItemIds) {
      if (!uniqueEvalItemIds.has(id)) {
        return res.status(400).json({ error: `Evaluasi parsial ditolak: Seluruh item kerusakan wajib dievaluasi sebelum isu dapat diproses` });
      }
    }

    // Validasi alasan untuk setiap item yang ditolak
    for (const evalItem of evaluations) {
      if (evalItem.approved !== true && (!evalItem.reason || !evalItem.reason.trim())) {
        return res.status(400).json({ error: 'Alasan penolakan wajib diisi untuk setiap item yang ditolak' });
      }
    }

    const allApproved = evaluations.every(e => e.approved === true);
    const actorName = req.user?.name || req.user?.username || 'PENGAWAS';

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
            resolvedBy: actorName
          }
        });

        // Kembalikan kendaraan ke READY_TO_START HANYA jika kendaraan sebelumnya berstatus Maintenance
        // dan tidak ada isu lain yang masih aktif
        const otherOngoing = await tx.issue.findFirst({
          where: {
            id: { not: issueId },
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
      } else {
        await tx.issue.update({
          where: { id: issueId },
          data: { status: 'ONGOING' }
        });
      }

      // Catat ke AuditLog
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: allApproved ? 'ISSUE_REPAIR_APPROVED' : 'ISSUE_REPAIR_REJECTED',
          actionType: 'EVALUATE_REPAIR',
          actionId: issueId,
          details: JSON.stringify({
            noPolisi: target.handover?.noPolisi,
            allApproved,
            evaluatorName: actorName,
            evaluatorRole: req.user.role,
            evaluations: evaluations.map(e => ({
              itemId: e.itemId,
              approved: e.approved,
              reason: e.reason || null
            }))
          })
        }
      }).catch(() => {});
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
