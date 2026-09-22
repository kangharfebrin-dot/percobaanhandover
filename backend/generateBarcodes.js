const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

async function main() {
  const barcodesDir = path.join(__dirname, 'barcodes');
  
  if (!fs.existsSync(barcodesDir)) {
    fs.mkdirSync(barcodesDir);
  }

  // Hardcoded dari seed.js
  const vehicles = [
    { noPolisi: 'B 1234 CD', barcode: 'TRK-001', jenisKendaraan: 'Truk Tangki 8KL' },
    { noPolisi: 'B 5678 EF', barcode: 'TRK-002', jenisKendaraan: 'Truk Tangki 16KL' },
    { noPolisi: 'B 9101 GH', barcode: 'TRK-003', jenisKendaraan: 'Truk Tangki 24KL' },
    { noPolisi: 'B 1121 IJ', barcode: 'TRK-004', jenisKendaraan: 'Truk Tangki 8KL' },
    { noPolisi: 'B 3141 KL', barcode: 'TRK-005', jenisKendaraan: 'Truk Tangki 16KL' }
  ];

  console.log(`Ditemukan ${vehicles.length} kendaraan. Membuat QR codes...`);

  for (const vehicle of vehicles) {
    const qrData = vehicle.barcode; 
    const filePath = path.join(barcodesDir, `${qrData}.png`);
    
    try {
      await QRCode.toFile(filePath, qrData, {
        color: { dark: '#000000', light: '#FFFFFF' },
        width: 300,
        margin: 2
      });
      console.log(`✅ Berhasil membuat QR code untuk: ${qrData} (Plat: ${vehicle.noPolisi})`);
    } catch (err) {
      console.error(`❌ Gagal membuat QR code untuk ${qrData}:`, err);
    }
  }
}

main().catch(console.error);
