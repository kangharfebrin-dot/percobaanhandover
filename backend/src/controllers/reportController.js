const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const exportExcel = async (req, res) => {
  try {
    const handovers = await prisma.handover.findMany({
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { name: true, jabatan: true } },
        items: true,
        issue: true
      }
    });

    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Summary
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Total Handovers', key: 'total', width: 20 },
      { header: 'Ada Masalah', key: 'issues', width: 20 },
      { header: 'Siap Operasi', key: 'ok', width: 20 }
    ];
    summarySheet.addRow({
      total: handovers.length,
      issues: handovers.filter(h => h.status === 'Ada Masalah').length,
      ok: handovers.filter(h => h.status === 'Siap Operasi (Normal)').length
    });

    // Sheet 2: Detail Handover
    const detailSheet = workbook.addWorksheet('Detail Handover');
    detailSheet.columns = [
      { header: 'Waktu', key: 'waktu', width: 20 },
      { header: 'Nama Pekerja', key: 'nama', width: 20 },
      { header: 'No Polisi', key: 'nopol', width: 15 },
      { header: 'Shift', key: 'shift', width: 10 },
      { header: 'Status', key: 'status', width: 20 }
    ];
    
    // Sheet 3: Issues Tracking
    const issuesSheet = workbook.addWorksheet('Issues Tracking');
    issuesSheet.columns = [
      { header: 'Handover ID', key: 'id', width: 30 },
      { header: 'No Polisi', key: 'nopol', width: 15 },
      { header: 'Issue Status', key: 'status', width: 20 },
      { header: 'Detail Item', key: 'detail', width: 40 }
    ];

    handovers.forEach(h => {
      detailSheet.addRow({
        waktu: h.timestamp.toISOString().replace('T', ' ').substring(0, 19),
        nama: h.user.name,
        nopol: h.noPolisi,
        shift: h.shift,
        status: h.status
      });

      if (h.status === 'Ada Masalah') {
        const issueItems = h.items.filter(i => !i.isGood).map(i => i.name).join(', ');
        issuesSheet.addRow({
          id: h.id,
          nopol: h.noPolisi,
          status: h.issue ? h.issue.status : 'UNKNOWN',
          detail: issueItems
        });
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'Handover_Report.xlsx');
    
    if (req.user && req.user.id) {
      await prisma.auditLog.create({
        data: {
          action: 'EXPORT_EXCEL',
          entity: 'Report',
          userId: req.user.id,
          details: 'User exported handover reports to Excel'
        }
      });
    }

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const exportPdf = async (req, res) => {
  try {
    const handovers = await prisma.handover.findMany({
      orderBy: { timestamp: 'desc' },
      include: { user: true, items: true, issue: true }
    });

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'Handover_Report.pdf');
    doc.pipe(res);

    doc.fontSize(20).text('Handover Report', { align: 'center' });
    doc.moveDown();

    const issuesCount = handovers.filter(h => h.status === 'Ada Masalah').length;
    doc.fontSize(12).text(`Total Handovers: ${handovers.length}`);
    doc.text(`Siap Operasi: ${handovers.length - issuesCount}`);
    doc.text(`Ada Masalah: ${issuesCount}`);
    doc.moveDown();

    doc.fontSize(14).text('Recent Issues:', { underline: true });
    doc.moveDown(0.5);

    handovers.filter(h => h.status === 'Ada Masalah').slice(0, 20).forEach(h => {
      const issueItems = h.items.filter(i => !i.isGood).map(i => i.name).join(', ');
      doc.fontSize(10).text(`- [${h.noPolisi}] ${h.timestamp.toISOString().split('T')[0]} : ${issueItems} (${h.issue ? h.issue.status : 'UNKNOWN'})`);
    });

    if (req.user && req.user.id) {
      await prisma.auditLog.create({
        data: {
          action: 'EXPORT_PDF',
          entity: 'Report',
          userId: req.user.id,
          details: 'User exported handover reports to PDF'
        }
      });
    }

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { exportExcel, exportPdf };
