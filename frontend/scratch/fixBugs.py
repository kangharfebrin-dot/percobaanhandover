import os
path = r'd:\UKSW\Pertamina\HandoverApp\backend\index.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target1 = """// GET Ongoing Issues
app.get('/api/issues/ongoing', async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      where: { status: 'ONGOING' },"""
replacement1 = """// GET Ongoing Issues
app.get('/api/issues/ongoing', async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      where: { status: { in: ['ONGOING', 'PENDING_APPROVAL'] } },"""

target2 = """    res.json({ success: true, issue: updatedIssue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;"""
replacement2 = """    res.json({ success: true, issue: updatedIssue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST Verify Repair
app.post('/api/issues/:id/verify-repair', upload.any(), async (req, res) => {
  try {
    const issueId = req.params.id;
    const { itemsData } = req.body; 
    const items = JSON.parse(itemsData || '[]');
    
    // Update each item
    for (const item of items) {
      const file = req.files.find(f => f.fieldname === 'photo_' + item.id);
      let photoUrl = null;
      if (file) {
        photoUrl = file.path.replace(/\\\\/g, '/');
      }
      
      await prisma.handoverItem.update({
        where: { id: item.id },
        data: {
          repairNote: item.repairNote,
          repairPhotoUrl: photoUrl,
          isRepaired: true
        }
      });
    }

    // Update Issue status to PENDING_APPROVAL
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;"""

content = content.replace(target1, replacement1)
content = content.replace(target2, replacement2)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Replaced')
