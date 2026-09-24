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
      { header: 'Total Handovers', key: 'total', width: 25 },
      { header: 'Ada Masalah', key: 'issues', width: 25 },
      { header: 'Siap Operasi', key: 'ok', width: 25 }
    ];
    
    // Style Summary Header
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0055A5' } };
    summarySheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    summarySheet.addRow({
      total: handovers.length,
      issues: handovers.filter(h => h.status === 'Ada Masalah').length,
      ok: handovers.filter(h => h.status === 'Siap Operasi (Normal)').length
    });

    // Sheet 2: Detail Handover
    const detailSheet = workbook.addWorksheet('Detail Handover');
    detailSheet.columns = [
      { header: 'Waktu', key: 'waktu', width: 22 },
      { header: 'Nama Pekerja (AMT)', key: 'nama', width: 30 },
      { header: 'Jabatan', key: 'jabatan', width: 20 },
      { header: 'No Polisi', key: 'nopol', width: 18 },
      { header: 'Shift', key: 'shift', width: 15 },
      { header: 'Tipe Handover', key: 'tipe', width: 25 },
      { header: 'Status Handover', key: 'status', width: 25 },
      { header: 'Lokasi (Lat, Lng)', key: 'lokasi', width: 35 },
      { header: 'Item Baik', key: 'itemBaik', width: 45 },
      { header: 'Item Rusak', key: 'itemRusak', width: 45 },
      { header: 'Status Perbaikan', key: 'issueStatus', width: 25 },
      { header: 'Catatan Perbaikan', key: 'issueNote', width: 40 }
    ];
    
    // Style Detail Header
    detailSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    detailSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0055A5' } };
    detailSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Sheet 3: Issues Tracking
    const issuesSheet = workbook.addWorksheet('Issues Tracking');
    issuesSheet.columns = [
      { header: 'Handover ID', key: 'id', width: 35 },
      { header: 'No Polisi', key: 'nopol', width: 18 },
      { header: 'Issue Status', key: 'status', width: 25 },
      { header: 'Detail Item', key: 'detail', width: 50 }
    ];
    
    // Style Issues Header
    issuesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    issuesSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFED1C24' } };
    issuesSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

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
