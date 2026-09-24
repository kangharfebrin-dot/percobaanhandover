const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit-table');
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

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'Handover_Report.pdf');
    doc.pipe(res);

    // Title
    doc.fontSize(20).text('Rekapitulasi Laporan Handover Kendaraan', { align: 'center' });
    doc.moveDown(1.5);

    // Prepare table structure
    const table = {
      headers: [
        { label: "Waktu Kejadian", property: 'waktu', width: 90, renderer: null },
        { label: "Nama dan Jabatan", property: 'nama', width: 140, renderer: null },
        { label: "Nopol Truk", property: 'nopol', width: 70, renderer: null },
        { label: "Tipe", property: 'tipe', width: 80, renderer: null },
        { label: "Titik Lokasi", property: 'lokasi', width: 150, renderer: null },
        { label: "Komponen Rusak", property: 'rusak', width: 180, renderer: null }
      ],
      datas: handovers.map(h => {
        const typeStr = h.type === 'mulai' ? 'Mulai Pekerjaan' : 'Akhiri Pekerjaan';
        const userName = h.user ? h.user.name : 'Unknown User';
        const jabatan = h.user ? h.user.jabatan : '-';
        const itemRusak = h.items.filter(i => !i.isGood).map(i => i.name).join(', ');
        const lokasi = h.locationLat && h.locationLng ? `${h.locationLat}, ${h.locationLng}` : '-';

        return {
          waktu: h.timestamp.toISOString().replace('T', ' ').substring(0, 19),
          nama: `${userName} - ${jabatan}`,
          nopol: h.noPolisi,
          tipe: typeStr,
          lokasi: lokasi,
          rusak: itemRusak || '-',
          options: {
            // Apply red color for damaged component row text if exists
            waktu: { columnColor: 'white' },
            rusak: itemRusak ? { columnColor: 'white' } : { columnColor: 'white' }
          }
        };
      })
    };

    // Before drawing table, we need a custom hook to render red text for broken components
    // We will do it simple by passing it directly to table
    await doc.table(table, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
      prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
        doc.font("Helvetica").fontSize(9);
        // If column is 'rusak' and it's not '-', make it red
        if (indexColumn === 5 && row.rusak !== '-') {
          doc.fillColor('red');
        } else {
          doc.fillColor('black');
        }
      },
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
