const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit-table');
const prisma = require('../config/prisma');

const exportExcel = async (req, res) => {
  try {
    const { status, shift, startDate, endDate } = req.query;

    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ error: 'Akses ditolak: Hanya Admin yang dapat mengekspor laporan' });
    }

    let where = {};
    if (status && status !== 'Semua') {
      where.status = status;
    }
    if (shift && shift !== 'Semua') {
      where.shift = shift;
    }
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.timestamp = {
        gte: start,
        lte: end
      };
    }

    const handovers = await prisma.handover.findMany({
      where: where,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { name: true, jabatan: true } },
        items: true,
        issue: true
      }
    });
    const workbook = new ExcelJS.Workbook();
    
    // ============================================
    // SHEET 1: Handover Report
    // ============================================
    const reportSheet = workbook.addWorksheet('Handover Report');
    
    // Add title row
    reportSheet.mergeCells('A1:J2');
    const titleCell = reportSheet.getCell('A1');
    titleCell.value = 'DIGIHANDOVER – HANDOVER REPORT';
    titleCell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } }; // Dark blue
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    
    // Spacer row
    reportSheet.addRow([]);

    reportSheet.getRow(4).values = [
      'Tipe Handover', 'Shift', 'Lokasi', 'Status Kendaraan', 'Komponen/Area', 
      'Kategori Temuan', 'Detail Temuan', 'Status Follow Up', 'Diverifikasi Oleh', 'Waktu Verifikasi'
    ];
    
    reportSheet.columns = [
      { key: 'tipe', width: 20 },
      { key: 'shift', width: 10 },
      { key: 'lokasi', width: 25 },
      { key: 'statusKendaraan', width: 20 },
      { key: 'komponen', width: 25 },
      { key: 'kategori', width: 18 },
      { key: 'detailTemuan', width: 30 },
      { key: 'statusFollowUp', width: 20 },
      { key: 'diverifikasiOleh', width: 20 },
      { key: 'waktuVerifikasi', width: 20 }
    ];

    // Style Header Row 4
    reportSheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    reportSheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004080' } };
    reportSheet.getRow(4).alignment = { vertical: 'middle', horizontal: 'center' };
    
    let totalHandover = handovers.length;
    let kendaraanAdaTemuan = 0;
    let temuanMajor = 0;
    let temuanMinor = 0;
    let followUpOpen = 0;
    let followUpClosed = 0;

    const detailTemuanData = []; // To collect data for Sheet 2

    handovers.forEach(h => {
      const isMulai = h.type === 'mulai';
      const tipeStr = isMulai ? 'Mulai Pekerjaan' : 'Akhiri Pekerjaan';
      const shiftStr = h.shift || '-';
      const lokasiStr = h.locationLat && h.locationLng ? `Fuel Terminal Maos (${h.locationLat}, ${h.locationLng})` : 'Fuel Terminal Maos';
      
      const badItems = h.items.filter(i => !i.isGood);
      const hasIssue = badItems.length > 0;
      
      if (hasIssue) kendaraanAdaTemuan++;
      
      const statusKendaraan = hasIssue ? 'Ada Temuan' : 'Normal';
      
      const komponenArr = badItems.map(i => i.name.replace(/\[MAJOR\]|\[MINOR\]/g, '').trim());
      const komponenStr = komponenArr.length > 0 ? komponenArr.join(', ') : '-';
      
      let kategoriStr = '-';
      let majorCount = 0;
      let minorCount = 0;
      badItems.forEach(i => {
        if (i.name.includes('[MAJOR]')) {
          majorCount++;
          temuanMajor++;
        }
        else if (i.name.includes('[MINOR]')) {
          minorCount++;
          temuanMinor++;
        }
      });
      
      if (majorCount > 0 && minorCount > 0) kategoriStr = 'Major & Minor';
      else if (majorCount > 0) kategoriStr = 'Major';
      else if (minorCount > 0) kategoriStr = 'Minor';

      // For 'Detail Temuan' sheet, we need one row per bad item
      if (hasIssue) {
        badItems.forEach(item => {
          const isMajor = item.name.includes('[MAJOR]');
          const itemName = item.name.replace(/\[MAJOR\]|\[MINOR\]/g, '').trim();
          
          let statusFollowUpItem = 'Open';
          let diverifikasiOlehItem = '-';
          let waktuVerifItem = '-';
          
          if (h.issue) {
             if (h.issue.status === 'RESOLVED') {
               statusFollowUpItem = 'Closed';
             }
             if (h.issue.resolvedBy) diverifikasiOlehItem = h.issue.resolvedBy;
             if (h.issue.resolvedAt) waktuVerifItem = h.issue.resolvedAt.toISOString().replace('T', ' ').substring(0, 16).replace('T', ' ');
          }
          
          detailTemuanData.push({
            handoverId: h.id,
            waktu: h.timestamp.toISOString().replace('T', ' ').substring(0, 16).replace('T', ' '),
            nopol: h.noPolisi,
            amt: h.user ? h.user.name : 'Unknown',
            komponen: itemName,
            kategori: isMajor ? 'Major' : 'Minor',
            detail: item.description || `Catatan kondisi ${itemName.toLowerCase()}`,
            tindakan: h.issue && h.issue.status === 'RESOLVED' ? 'Telah diperbaiki' : 'Dilaporkan ke supervisor',
            status: statusFollowUpItem
          });
        });
      }

      let statusFollowUp = '-';
      if (h.issue) {
        if (h.issue.status === 'RESOLVED') {
          statusFollowUp = 'Closed';
          followUpClosed++;
        } else {
          statusFollowUp = 'Open';
          followUpOpen++;
        }
      }
      
      const diverifikasiOleh = h.issue && h.issue.resolvedBy ? h.issue.resolvedBy : '-';
      const waktuVerifikasi = h.issue && h.issue.resolvedAt ? h.issue.resolvedAt.toISOString().replace('T', ' ').substring(0, 16).replace('T', ' ') : '-';

      const row = reportSheet.addRow({
        tipe: tipeStr,
        shift: shiftStr,
        lokasi: lokasiStr,
        statusKendaraan: statusKendaraan,
        komponen: komponenStr,
        kategori: kategoriStr,
        detailTemuan: badItems.map(i => i.description || '-').join(', ') || '-',
        statusFollowUp: statusFollowUp,
        diverifikasiOleh: diverifikasiOleh,
        waktuVerifikasi: waktuVerifikasi
      });

      if (hasIssue) {
        row.getCell('statusKendaraan').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } }; // Warning yellow
      } else {
        row.getCell('statusKendaraan').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } }; // Light green
      }
    });

    // ============================================
    // SHEET 2: Detail Temuan
    // ============================================
    const detailSheet = workbook.addWorksheet('Detail Temuan');
    
    // Add title row
    detailSheet.mergeCells('A1:I2');
    const titleCell2 = detailSheet.getCell('A1');
    titleCell2.value = 'DETAIL TEMUAN KENDARAAN';
    titleCell2.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
    titleCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } };
    titleCell2.alignment = { vertical: 'middle', horizontal: 'center' };
    
    detailSheet.addRow([]);

    detailSheet.getRow(4).values = [
      'Handover ID', 'Waktu Temuan', 'Nopol Truk', 'AMT', 'Komponen/Area', 
      'Kategori', 'Detail Temuan', 'Tindakan', 'Status'
    ];
    
    detailSheet.columns = [
      { key: 'handoverId', width: 25 },
      { key: 'waktu', width: 20 },
      { key: 'nopol', width: 15 },
      { key: 'amt', width: 25 },
      { key: 'komponen', width: 20 },
      { key: 'kategori', width: 15 },
      { key: 'detail', width: 35 },
      { key: 'tindakan', width: 30 },
      { key: 'status', width: 15 }
    ];

    detailSheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    detailSheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004080' } };
    detailSheet.getRow(4).alignment = { vertical: 'middle', horizontal: 'center' };

    detailTemuanData.forEach(dt => {
      detailSheet.addRow(dt);
    });

    // ============================================
    // SHEET 3: Rekap
    // ============================================
    const summarySheet = workbook.addWorksheet('Rekap');
    summarySheet.mergeCells('A1:F2');
    const titleCell3 = summarySheet.getCell('A1');
    titleCell3.value = 'REKAP HANDOVER';
    titleCell3.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
    titleCell3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002060' } };
    titleCell3.alignment = { vertical: 'middle', horizontal: 'center' };
    
    summarySheet.columns = [
      { key: 'label', width: 30 },
      { key: 'value', width: 15 },
      { key: 'space', width: 5 },
      { key: 'note1', width: 60 }
    ];

    const fillBlue = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    
    const summaryData = [
      { label: 'Total Handover', value: totalHandover, note: 'Catatan' },
      { label: 'Kendaraan Ada Temuan', value: kendaraanAdaTemuan, note: 'Sheet Handover Report = data utama/export.' },
      { label: 'Temuan Major', value: temuanMajor, note: 'Detail Temuan = rincian jika satu handover punya beberapa temuan.' },
      { label: 'Temuan Minor', value: temuanMinor, note: 'Rekap = ringkasan otomatis.' },
      { label: 'Follow Up Open', value: followUpOpen, note: '' },
      { label: 'Follow Up Closed', value: followUpClosed, note: '' }
    ];

    summaryData.forEach((row, i) => {
       const r = summarySheet.addRow({
         label: row.label,
         value: row.value,
         note1: row.note
       });
       r.getCell('label').font = { bold: true };
       r.getCell('label').fill = fillBlue;
       r.getCell('value').alignment = { horizontal: 'center' };
       r.getCell('value').font = { bold: true };
       if (i === 0) r.getCell('note1').font = { bold: true };
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
    const { status, shift, startDate, endDate } = req.query;

    if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
      return res.status(403).json({ error: 'Akses ditolak: Hanya Admin yang dapat mengekspor laporan' });
    }

    let where = {};
    if (status && status !== 'Semua') {
      where.status = status;
    }
    if (shift && shift !== 'Semua') {
      where.shift = shift;
    }
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.timestamp = {
        gte: start,
        lte: end
      };
    }

    const handovers = await prisma.handover.findMany({
      where: where,
      orderBy: { timestamp: 'desc' },
      include: { user: true, items: true, issue: true }
    });

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=' + 'Handover_Report.pdf');
    doc.pipe(res);

    const drawTopBar = () => {
      doc.rect(0, 0, doc.page.width, 25).fill('#3498DB');
      doc.y = 50;
    };

    // Calculate stats
    let totalHandover = handovers.length;
    let adaTemuan = 0;
    let temuanMajor = 0;
    let followUpOpen = 0;

    handovers.forEach(h => {
        const badItems = h.items.filter(i => !i.isGood);
        if (badItems.length > 0) {
            adaTemuan++;
            if (badItems.some(i => i.name.includes('[MAJOR]'))) {
                temuanMajor++;
            }
            if (!h.issue || h.issue.status !== 'RESOLVED') {
                followUpOpen++;
            }
        }
    });

    const handoverSelesai = totalHandover - followUpOpen;

    // ============================================
    // PAGE 1: SUMMARY
    // ============================================
    drawTopBar();
    doc.fillColor('#002060').font('Helvetica-Bold').fontSize(24).text('DIGIHANDOVER', 30, 60);
    doc.fillColor('gray').font('Helvetica').fontSize(12).text('HANDOVER REPORT', 30, 85);
    doc.moveDown(2);

    let periodStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    if (startDate && endDate) {
      periodStr = `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`;
    }

    const tableHeader = {
        headers: [
            { label: "PERIODE", property: 'periode', width: 250 },
            { label: "LOKASI", property: 'lokasi', width: 250 },
            { label: "STATUS DOKUMEN", property: 'status', width: 250 }
        ],
        datas: [
            { 
                periode: periodStr,
                lokasi: 'Fuel Terminal Maos',
                status: 'Digital • Terverifikasi'
            }
        ]
    };
    
    await doc.table(tableHeader, {
        prepareHeader: () => doc.font("Helvetica").fontSize(8).fillColor('gray'),
        prepareRow: () => doc.font("Helvetica").fontSize(10).fillColor('black'),
    });

    doc.moveDown(2);
    doc.fillColor('#002060').font('Helvetica-Bold').fontSize(16).text('Ringkasan Handover', 30, doc.y);
    doc.moveDown(1);

    const boxY = doc.y;
    const boxW = 180;
    const boxH = 60;
    
    const boxes = [
        { title: 'TOTAL HANDOVER', value: totalHandover.toString(), color: '#2980B9', bg: '#f0f8ff' },
        { title: 'ADA TEMUAN', value: adaTemuan.toString(), color: '#F39C12', bg: '#fef5e7' },
        { title: 'TEMUAN MAJOR', value: temuanMajor.toString(), color: '#C0392B', bg: '#fdedec' },
        { title: 'FOLLOW UP OPEN', value: followUpOpen.toString(), color: '#E74C3C', bg: '#fadbd8' }
    ];

    boxes.forEach((box, i) => {
        const bx = 30 + (boxW + 15) * i;
        doc.rect(bx, boxY, boxW, boxH).fill(box.bg);
        doc.rect(bx, boxY, 5, boxH).fill(box.color);
        doc.fillColor(box.color).font('Helvetica-Bold').fontSize(24).text(box.value, bx + 15, boxY + 15);
        doc.fillColor('gray').font('Helvetica-Bold').fontSize(8).text(box.title, bx + 15, boxY + 45);
    });

    doc.y = boxY + boxH + 30;

    doc.fillColor('#002060').font('Helvetica-Bold').fontSize(16).text('Ikhtisar Status', 30, doc.y);
    doc.moveDown(1);

    const tableIkhtisar = {
        headers: [
            { label: "INDIKATOR", property: 'indikator', width: 250 },
            { label: "JUMLAH", property: 'jumlah', width: 100 },
            { label: "PROPORSI", property: 'proporsi', width: 100 },
            { label: "KETERANGAN", property: 'keterangan', width: 300 }
        ],
        datas: [
            { indikator: 'Handover selesai', jumlah: handoverSelesai.toString(), proporsi: totalHandover ? Math.round((handoverSelesai/totalHandover)*100) + '%' : '0%', keterangan: 'Follow up berstatus Closed' },
            { indikator: 'Follow up terbuka', jumlah: followUpOpen.toString(), proporsi: totalHandover ? Math.round((followUpOpen/totalHandover)*100) + '%' : '0%', keterangan: 'Perlu pemantauan / tindakan lanjutan' },
            { indikator: 'Kendaraan ada temuan', jumlah: adaTemuan.toString(), proporsi: totalHandover ? Math.round((adaTemuan/totalHandover)*100) + '%' : '0%', keterangan: 'Terdapat catatan kondisi kendaraan' }
        ]
    };
    
    await doc.table(tableIkhtisar, {
        prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8).fillColor('#002060'),
        prepareRow: () => doc.font("Helvetica").fontSize(9).fillColor('black'),
    });

    doc.moveDown(1);
    const catY = doc.y;
    doc.rect(30, catY, 750, 30).fill('#f0f8ff');
    doc.rect(30, catY, 5, 30).fill('#2980B9');
    doc.fillColor('black').font('Helvetica-Bold').fontSize(9).text('Catatan: ', 45, catY + 10, { continued: true });
    doc.font('Helvetica').text('Laporan merangkum proses serah terima kendaraan, kondisi unit, detail temuan, dan status tindak lanjut. Seluruh data dapat ditelusuri melalui Handover ID.');

    // ============================================
    // PAGE 2: Daftar Handover & Verifikasi
    // ============================================
    doc.addPage();
    drawTopBar();
    doc.fontSize(20).fillColor('#002060').font('Helvetica-Bold').text('Daftar Handover', 30, 60);
    doc.fontSize(10).fillColor('gray').font('Helvetica').text('Rekaman utama proses serah terima kendaraan dan kondisi operasional.');
    doc.moveDown(1);

    const table1 = {
      headers: [
        { label: "ID", property: 'id', width: 70 },
        { label: "WAKTU", property: 'waktu', width: 75 },
        { label: "AMT / JABATAN", property: 'amt', width: 90 },
        { label: "NOPOL", property: 'nopol', width: 50 },
        { label: "TIPE", property: 'tipe', width: 65 },
        { label: "SHIFT", property: 'shift', width: 40 },
        { label: "LOKASI", property: 'lokasi', width: 90 },
        { label: "KONDISI", property: 'kondisi', width: 60 },
        { label: "AREA", property: 'area', width: 90 },
        { label: "KATEGORI", property: 'kategori', width: 60 },
        { label: "FOLLOW UP", property: 'followup', width: 60 }
      ],
      datas: []
    };

    const table2 = {
      headers: [
        { label: "HANDOVER ID", property: 'id', width: 120 },
        { label: "DIVERIFIKASI OLEH", property: 'admin', width: 160 },
        { label: "WAKTU VERIFIKASI", property: 'waktu', width: 140 },
        { label: "KETERANGAN", property: 'ket', width: 280 }
      ],
      datas: []
    };

    const table3 = {
      headers: [
        { label: "ID", property: 'id', width: 80 },
        { label: "NOPOL", property: 'nopol', width: 50 },
        { label: "WAKTU", property: 'waktu', width: 75 },
        { label: "AREA", property: 'area', width: 80 },
        { label: "KATEGORI", property: 'kategori', width: 50 },
        { label: "SEVERITY", property: 'severity', width: 55 },
        { label: "DESKRIPSI", property: 'desc', width: 120 },
        { label: "TINDAKAN", property: 'tindakan', width: 110 },
        { label: "STATUS", property: 'status', width: 60 },
        { label: "KETERANGAN", property: 'ket', width: 60 }
      ],
      datas: []
    };

    handovers.forEach(h => {
      const typeStr = h.type === 'mulai' ? 'Mulai Pekerjaan' : 'Akhiri Pekerjaan';
      const userName = h.user ? h.user.name : 'Unknown User';
      const jabatan = h.user ? h.user.jabatan : '-';
      
      const badItems = h.items.filter(i => !i.isGood);
      const isNormal = badItems.length === 0;
      const kondisiStr = isNormal ? 'Normal' : 'Ada Temuan';
      
      const areaStr = badItems.map(i => i.name.replace(/\[MAJOR\]|\[MINOR\]/g, '').trim()).join(', ') || '-';
      
      let katStr = '-';
      let hasMajor = false;
      let hasMinor = false;
      badItems.forEach(i => {
        if (i.name.includes('[MAJOR]')) hasMajor = true;
        if (i.name.includes('[MINOR]')) hasMinor = true;
      });
      if (hasMajor && hasMinor) katStr = 'Major & Minor';
      else if (hasMajor) katStr = 'Major';
      else if (hasMinor) katStr = 'Minor';

      let followUpStr = 'Closed';
      if (!isNormal) {
        followUpStr = (h.issue && h.issue.status === 'RESOLVED') ? 'Closed' : 'Open';
      }

      table1.datas.push({
        id: h.id.substring(0, 15), 
        waktu: h.timestamp.toISOString().replace('T', ' ').substring(0, 16),
        amt: `${userName}\n${jabatan}`,
        nopol: h.noPolisi,
        tipe: typeStr,
        shift: h.shift || '-',
        lokasi: h.locationLat && h.locationLng ? `Fuel Terminal Maos` : 'Fuel Terminal Maos',
        kondisi: kondisiStr,
        area: areaStr,
        kategori: katStr,
        followup: followUpStr
      });

      const verifiedBy = h.issue && h.issue.resolvedBy ? h.issue.resolvedBy : 'Supervisor';
      const verifiedTime = h.issue && h.issue.resolvedAt ? h.issue.resolvedAt.toISOString().replace('T', ' ').substring(0, 16) : h.timestamp.toISOString().replace('T', ' ').substring(0, 16);
      
      table2.datas.push({
        id: h.id.substring(0, 15),
        admin: isNormal ? 'Sistem' : verifiedBy,
        waktu: isNormal ? '-' : verifiedTime,
        ket: 'Data handover tercatat pada sistem'
      });

      if (!isNormal) {
        badItems.forEach(item => {
          const isItemMajor = item.name.includes('[MAJOR]');
          const itemName = item.name.replace(/\[MAJOR\]|\[MINOR\]/g, '').trim();
          table3.datas.push({
            id: h.id.substring(0, 15),
            nopol: h.noPolisi,
            waktu: h.timestamp.toISOString().replace('T', ' ').substring(0, 16),
            area: itemName,
            kategori: 'Rem/Mesin/Kabin',
            severity: isItemMajor ? 'Major' : 'Minor',
            desc: item.description || `Catatan kondisi ${itemName.toLowerCase()}`,
            tindakan: h.issue && h.issue.status === 'RESOLVED' ? 'Telah diperbaiki' : 'Dilaporkan ke supervisor',
            status: (h.issue && h.issue.status === 'RESOLVED') ? 'Closed' : 'Open',
            ket: '-'
          });
        });
      }
    });

    await doc.table(table1, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8).fillColor('#002060'),
      prepareRow: () => doc.font("Helvetica").fontSize(8).fillColor('black'),
    });

    doc.moveDown(2);
    doc.fontSize(18).fillColor('#002060').font('Helvetica-Bold').text('Verifikasi');
    doc.moveDown(1);
    
    await doc.table(table2, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8).fillColor('#002060'),
      prepareRow: () => doc.font("Helvetica").fontSize(8).fillColor('black'),
    });

    // ============================================
    // PAGE 3: Detail Temuan
    // ============================================
    doc.addPage();
    drawTopBar();
    doc.fontSize(20).fillColor('#002060').font('Helvetica-Bold').text('Detail Temuan Kendaraan', 30, 60);
    doc.fontSize(10).fillColor('gray').font('Helvetica').text('Rincian temuan yang membutuhkan pencatatan dan tindak lanjut.');
    doc.moveDown(1);

    await doc.table(table3, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8).fillColor('#002060'),
      prepareRow: () => doc.font("Helvetica").fontSize(8).fillColor('black'),
    });

    doc.moveDown(2);
    doc.fontSize(16).fillColor('#002060').font('Helvetica-Bold').text('Alur Tindak Lanjut');
    doc.moveDown(1);
    
    const yPos = doc.y;
    const alurBoxW = 180;
    const alurBoxH = 60;
    const gap = 15;
    
    const steps = [
      { num: '01', title: 'TEMUAN DICATAT', desc: 'Kondisi kendaraan dan area temuan dicatat.' },
      { num: '02', title: 'DILAPORKAN', desc: 'Temuan diteruskan kepada pihak terkait.' },
      { num: '03', title: 'TINDAKAN', desc: 'Perbaikan atau pemeriksaan dilakukan.' },
      { num: '04', title: 'VERIFIKASI', desc: 'Status diperbarui setelah tindak lanjut.' }
    ];

    steps.forEach((step, idx) => {
       const x = 30 + (alurBoxW + gap) * idx;
       doc.rect(x, yPos, alurBoxW, alurBoxH).stroke('#3498DB');
       doc.rect(x, yPos, 4, alurBoxH).fill('#3498DB');
       
       doc.fillColor('#002060').font('Helvetica-Bold').fontSize(14).text(step.num, x + 10, yPos + 10);
       doc.fontSize(8).text(step.title, x + 10, yPos + 25);
       doc.fillColor('gray').font('Helvetica').fontSize(8).text(step.desc, x + 10, yPos + 40, { width: 160 });
    });

    doc.y = yPos + alurBoxH + 30;

    const table4 = {
      headers: [
        { label: "DIBUAT OLEH", property: 'dibuat', width: 250 },
        { label: "DIVERIFIKASI OLEH", property: 'diverifikasi', width: 250 },
        { label: "STATUS", property: 'status', width: 250 }
      ],
      datas: [
        { dibuat: 'AMT / Petugas Handover\n\n\n__________________', diverifikasi: 'Supervisor\n\n\n__________________', status: 'Digital Verified\n\n\n__________________' }
      ]
    };
    
    await doc.table(table4, {
      prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8).fillColor('#002060'),
      prepareRow: () => doc.font("Helvetica").fontSize(8).fillColor('black'),
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
