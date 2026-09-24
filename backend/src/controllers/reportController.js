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
      { header: 'Nama Pekerja (AMT)', key: 'nama', width: 25 },
      { header: 'Jabatan', key: 'jabatan', width: 15 },
      { header: 'No Polisi', key: 'nopol', width: 15 },
      { header: 'Shift', key: 'shift', width: 10 },
      { header: 'Tipe Handover', key: 'tipe', width: 20 },
      { header: 'Status Handover', key: 'status', width: 25 },
      { header: 'Lokasi (Lat, Lng)', key: 'lokasi', width: 30 },
      { header: 'Item Baik', key: 'itemBaik', width: 40 },
      { header: 'Item Rusak', key: 'itemRusak', width: 40 },
      { header: 'Status Perbaikan', key: 'issueStatus', width: 20 },
      { header: 'Catatan Perbaikan', key: 'issueNote', width: 30 }
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
      const itemBaik = h.items.filter(i => i.isGood).map(i => i.name).join(', ');
      const itemRusak = h.items.filter(i => !i.isGood).map(i => i.name).join(', ');
      const issueNote = h.issue ? (h.issue.notes || 'Tidak ada catatan') : '-';
      const issueStatus = h.issue ? h.issue.status : '-';

      detailSheet.addRow({
        waktu: h.timestamp.toISOString().replace('T', ' ').substring(0, 19),
        nama: h.user ? h.user.name : 'Unknown User',
        jabatan: h.user ? h.user.jabatan : '-',
        nopol: h.noPolisi,
        shift: h.shift,
        tipe: h.type === 'mulai' ? 'Mulai Pekerjaan' : 'Akhiri Pekerjaan',
        status: h.status,
        lokasi: h.locationLat && h.locationLng ? `${h.locationLat}, ${h.locationLng}` : '-',
        itemBaik: itemBaik || '-',
        itemRusak: itemRusak || '-',
        issueStatus: issueStatus,
        issueNote: issueNote
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

    doc.fontSize(14).text('Laporan Detail Kendala:', { underline: true });
    doc.moveDown(0.5);

    handovers.filter(h => h.status === 'Ada Masalah').slice(0, 20).forEach(h => {
      const issueItems = h.items.filter(i => !i.isGood).map(i => i.name).join(', ');
      doc.fontSize(10).text(`- [${h.noPolisi}] ${h.timestamp.toISOString().split('T')[0]} : ${issueItems} (${h.issue ? h.issue.status : 'UNKNOWN'})`);
    });
    doc.moveDown(1);

    doc.fontSize(14).text('Semua Data Handover (Detail AMT):', { underline: true });
    doc.moveDown(0.5);

    handovers.forEach(h => {
      const typeStr = h.type === 'mulai' ? 'Mulai Pekerjaan' : 'Akhiri Pekerjaan';
      const userName = h.user ? h.user.name : 'Unknown User';
      const jabatan = h.user ? h.user.jabatan : '-';
      const itemRusak = h.items.filter(i => !i.isGood).map(i => i.name).join(', ');
      const lokasi = h.locationLat && h.locationLng ? `${h.locationLat}, ${h.locationLng}` : '-';

      doc.fontSize(10).text(`[${h.timestamp.toISOString().replace('T', ' ').substring(0, 19)}] ${userName} (${jabatan}) - Nopol: ${h.noPolisi}`);
      doc.fontSize(9).fillColor('gray').text(`  Tipe: ${typeStr} | Shift: ${h.shift} | Status: ${h.status} | Lokasi: ${lokasi}`);
      if (h.status === 'Ada Masalah') {
         doc.fillColor('red').text(`  Kerusakan: ${itemRusak || '-'}`);
      }
      doc.fillColor('black');
      doc.moveDown(0.5);
    });

    if (req.user && req.user.id) {
      await prisma.auditLog.create({
        data: {
          action: 'EXPORT_PDF',
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
