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
    
    // Sheet 1: Rekap Data AMT
    const rekapSheet = workbook.addWorksheet('Rekap Handover');
    rekapSheet.columns = [
      { header: 'Waktu Kejadian', key: 'waktu', width: 22 },
      { header: 'Nama dan Jabatan', key: 'namaJabatan', width: 35 },
      { header: 'Nopol Truk', key: 'nopol', width: 18 },
      { header: 'Tipe Handover', key: 'tipe', width: 20 },
      { header: 'Titik Lokasi', key: 'lokasi', width: 40 },
      { header: 'Komponen Rusak', key: 'komponenRusak', width: 50 }
    ];
    
    // Style Header
    rekapSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    rekapSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0055A5' } };
    rekapSheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    
    handovers.forEach(h => {
      const itemRusak = h.items.filter(i => !i.isGood).map(i => i.name).join(', ');
      
      const userName = h.user ? h.user.name : 'Unknown User';
      const userJabatan = h.user ? h.user.jabatan : '-';
      
      const row = rekapSheet.addRow({
        waktu: h.timestamp.toISOString().replace('T', ' ').substring(0, 19),
        namaJabatan: `${userName} - ${userJabatan}`,
        nopol: h.noPolisi,
        tipe: h.type === 'mulai' ? 'Mulai Pekerjaan' : 'Akhiri Pekerjaan',
        lokasi: h.locationLat && h.locationLng ? `${h.locationLat}, ${h.locationLng}` : '-',
        komponenRusak: itemRusak || '-'
      });

      // Teks merah khusus untuk komponen rusak
      if (itemRusak) {
        row.getCell('komponenRusak').font = { bold: true, color: { argb: 'FFFF0000' } };
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
