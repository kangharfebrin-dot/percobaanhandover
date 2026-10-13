const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { checklistItemSchema } = require('../validators/schemas');

// 1. GET All Checklists
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await prisma.checklistItem.findMany({ orderBy: { createdAt: 'asc' } });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. POST New Checklist Item (A4: Admin only)
router.post('/', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { error, value } = checklistItemSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    const { name, category, severity } = value;

    // Auto-generate sequential ID CHK-xx
    const lastItem = await prisma.checklistItem.findFirst({
      where: { id: { startsWith: 'CHK-' } },
      orderBy: { id: 'desc' }
    });
    let nextNum = 1;
    if (lastItem && lastItem.id) {
      const match = lastItem.id.match(/CHK-(\d+)/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    const id = `CHK-${String(nextNum).padStart(2, '0')}`;

    const newItem = await prisma.checklistItem.create({
      data: { id, name, category, severity: category === 'B' ? '-' : (severity || 'Minor') }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CHECKLIST_ITEM_CREATE',
        actionType: 'CHECKLIST',
        actionId: newItem.id,
        details: JSON.stringify({ name: newItem.name, category: newItem.category, severity: newItem.severity })
      }
    }).catch(() => {});

    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. PUT Update Checklist Item (A4: Admin only)
router.put('/:id', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { name, category, severity } = req.body;
    const updated = await prisma.checklistItem.update({
      where: { id: req.params.id },
      data: { name, category, severity: category === 'B' ? '-' : (severity || 'Minor') }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CHECKLIST_ITEM_UPDATE',
        actionType: 'CHECKLIST',
        actionId: updated.id,
        details: JSON.stringify({ name: updated.name, category: updated.category, severity: updated.severity })
      }
    }).catch(() => {});

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. DELETE Checklist Item (A4: Admin only)
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const existing = await prisma.checklistItem.findUnique({ where: { id: req.params.id } });
    await prisma.checklistItem.delete({ where: { id: req.params.id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CHECKLIST_ITEM_DELETE',
        actionType: 'CHECKLIST',
        actionId: req.params.id,
        details: JSON.stringify({ name: existing?.name || req.params.id })
      }
    }).catch(() => {});

    res.json({ success: true, message: 'Item checklist berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
