const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const prisma = require('../src/config/prisma');
const { normalizeRole } = require('../src/middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'pertamina_handover_jwt_secure_key_2026_a8f9c2d1e4b7';

describe('Regression Audit & Business Rule Verification (Phase 13)', () => {
  let adminToken, pengawasToken, amtToken, legacyUserToken, legacySuperAdminToken;
  let testAdminUser, testPengawasUser, testAmtUser;
  let testVehicle;

  beforeAll(async () => {
    // Siapkan user uji
    testAdminUser = await prisma.user.upsert({
      where: { username: 'test_admin_regression' },
      update: { role: 'ADMIN', deletedAt: null },
      create: {
        username: 'test_admin_regression',
        password: 'hashedpassword',
        name: 'Admin Regression',
        role: 'ADMIN'
      }
    });

    testPengawasUser = await prisma.user.upsert({
      where: { username: 'test_pengawas_regression' },
      update: { role: 'PENGAWAS', deletedAt: null },
      create: {
        username: 'test_pengawas_regression',
        password: 'hashedpassword',
        name: 'Pengawas Regression',
        role: 'PENGAWAS'
      }
    });

    testAmtUser = await prisma.user.upsert({
      where: { username: 'test_amt_regression' },
      update: { role: 'AMT', deletedAt: null },
      create: {
        username: 'test_amt_regression',
        password: 'hashedpassword',
        name: 'AMT Regression Crew',
        role: 'AMT'
      }
    });

    // Siapkan kendaraan uji khusus
    testVehicle = await prisma.vehicle.upsert({
      where: { noPolisi: 'B9999XYZ' },
      update: { status: 'READY_TO_START' },
      create: {
        id: 'VH-999',
        noPolisi: 'B9999XYZ',
        barcode: 'BC9999XYZ',
        status: 'READY_TO_START',
        jenisKendaraan: 'Mobil Tangki',
        kapasitas: 16000
      }
    });

    // Generate tokens
    adminToken = jwt.sign({ id: testAdminUser.id, username: testAdminUser.username, role: 'ADMIN' }, JWT_SECRET);
    pengawasToken = jwt.sign({ id: testPengawasUser.id, username: testPengawasUser.username, role: 'PENGAWAS' }, JWT_SECRET);
    amtToken = jwt.sign({ id: testAmtUser.id, username: testAmtUser.username, role: 'AMT' }, JWT_SECRET);
    legacyUserToken = jwt.sign({ id: testAmtUser.id, username: testAmtUser.username, role: 'USER' }, JWT_SECRET);
    legacySuperAdminToken = jwt.sign({ id: testAdminUser.id, username: testAdminUser.username, role: 'SUPER_ADMIN' }, JWT_SECRET);
  });

  afterAll(async () => {
    // Cleanup data uji
    await prisma.amtComplianceFinding.deleteMany({
      where: { handover: { noPolisi: 'B9999XYZ' } }
    });
    await prisma.issue.deleteMany({
      where: { handover: { noPolisi: 'B9999XYZ' } }
    });
    await prisma.handoverItem.deleteMany({
      where: { handover: { noPolisi: 'B9999XYZ' } }
    });
    await prisma.photo.deleteMany({
      where: { handover: { noPolisi: 'B9999XYZ' } }
    });
    await prisma.handover.deleteMany({
      where: { noPolisi: 'B9999XYZ' }
    });
    await prisma.vehicle.deleteMany({
      where: { noPolisi: 'B9999XYZ' }
    });
  });

  describe('1. Normalisasi Role & Hak Akses', () => {
    test('Fungsi normalizeRole mempertahankan 4 role resmi dan hanya memetakan legacy USER -> AMT', () => {
      expect(normalizeRole('SUPER_ADMIN')).toBe('SUPER_ADMIN');
      expect(normalizeRole('ADMIN')).toBe('ADMIN');
      expect(normalizeRole('USER')).toBe('AMT');
      expect(normalizeRole('AMT')).toBe('AMT');
      expect(normalizeRole('PENGAWAS')).toBe('PENGAWAS');
    });

    test('Akun legacy dengan role SUPER_ADMIN tetap dapat mengakses rute ADMIN', async () => {
      const res = await request(app)
        .get('/api/checklists')
        .set('Authorization', `Bearer ${legacySuperAdminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('Akun legacy dengan role USER tetap dapat mengakses rute AMT (my-active)', async () => {
      const res = await request(app)
        .get('/api/handovers/my-active')
        .set('Authorization', `Bearer ${legacyUserToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('2. Pemisahan Kategori A & B serta Model Data Independen', () => {
    test('Kategori B tidak boleh memicu status Maintenance pada kendaraan', async () => {
      // Pastikan kendaraan READY_TO_START
      await prisma.vehicle.update({ where: { noPolisi: 'B9999XYZ' }, data: { status: 'READY_TO_START' } });

      const items = [
        { category: 'A', name: 'Kondisi Rem', isGood: true, severity: 'Major' },
        { category: 'B', name: 'Membawa SIM Sesuai Kendaraan', isGood: false, severity: '-' } // Kategori B tidak lengkap
      ];

      const res = await request(app)
        .post('/api/handovers')
        .set('Authorization', `Bearer ${amtToken}`)
        .field('noPolisi', 'B9999XYZ')
        .field('shift', '1')
        .field('type', 'mulai')
        .field('locationLat', '-6.200000')
        .field('locationLng', '106.816666')
        .field('amt1', 'AMT Regression Crew')
        .field('odometer', '150000')
        .field('items', JSON.stringify(items));

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Verifikasi status kendaraan: harus Active, BUKAN Maintenance!
      const veh = await prisma.vehicle.findUnique({ where: { noPolisi: 'B9999XYZ' } });
      expect(veh.status).toBe('Active');

      // Verifikasi bahwa temuan Kategori B tercatat di amt_compliance_finding
      const findings = await prisma.amtComplianceFinding.findMany({
        where: { handoverId: res.body.handover.id }
      });
      expect(findings.length).toBe(1);
      expect(findings[0].itemName).toBe('Membawa SIM Sesuai Kendaraan');
      expect(findings[0].status).toBe('OPEN');

      // Verifikasi bahwa TIDAK ada issue kendaraan (Kategori A) yang dibuat
      const vehIssue = await prisma.issue.findFirst({
        where: { handoverId: res.body.handover.id }
      });
      expect(vehIssue).toBeNull();
    });

    test('Penyelesaian temuan kepatuhan AMT tidak memengaruhi status operasional kendaraan', async () => {
      const finding = await prisma.amtComplianceFinding.findFirst({
        where: { handover: { noPolisi: 'B9999XYZ' }, status: 'OPEN' }
      });
      expect(finding).not.toBeNull();

      const res = await request(app)
        .put(`/api/issues/amt-compliance/${finding.id}/resolve`)
        .set('Authorization', `Bearer ${pengawasToken}`)
        .send({ notes: 'SIM telah ditunjukkan secara fisik' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.finding.status).toBe('RESOLVED');

      // Status kendaraan tetap Active (tidak berubah sembarangan)
      const veh = await prisma.vehicle.findUnique({ where: { noPolisi: 'B9999XYZ' } });
      expect(veh.status).toBe('Active');
    });
  });

  describe('3. Siklus State Machine & Validasi Konkurensi Kendaraan', () => {
    test('Tolak Scan Mulai ganda ketika kendaraan masih Active', async () => {
      const items = [{ category: 'A', name: 'Kondisi Rem', isGood: true }];

      const res = await request(app)
        .post('/api/handovers')
        .set('Authorization', `Bearer ${amtToken}`)
        .field('noPolisi', 'B9999XYZ')
        .field('shift', '1')
        .field('type', 'mulai')
        .field('locationLat', '-6.200000')
        .field('locationLng', '106.816666')
        .field('items', JSON.stringify(items));

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('pekerjaan aktif');
    });

    test('Validasi Odometer Akhir tidak boleh lebih kecil dari Odometer Awal', async () => {
      const items = [{ category: 'A', name: 'Kondisi Rem', isGood: true }];

      const res = await request(app)
        .post('/api/handovers')
        .set('Authorization', `Bearer ${amtToken}`)
        .field('noPolisi', 'B9999XYZ')
        .field('shift', '1')
        .field('type', 'akhiri')
        .field('locationLat', '-6.200000')
        .field('locationLng', '106.816666')
        .field('odometer', '140000') // 140000 < 150000 (Awal)
        .field('items', JSON.stringify(items));

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('tidak boleh lebih kecil');
    });

    test('Akhiri Pekerjaan sah berhasil mengembalikan status ke READY_TO_START', async () => {
      const items = [{ category: 'A', name: 'Kondisi Rem', isGood: true }];

      const res = await request(app)
        .post('/api/handovers')
        .set('Authorization', `Bearer ${amtToken}`)
        .field('noPolisi', 'B9999XYZ')
        .field('shift', '1')
        .field('type', 'akhiri')
        .field('locationLat', '-6.200000')
        .field('locationLng', '106.816666')
        .field('odometer', '150120') // 150120 > 150000
        .field('items', JSON.stringify(items));

      expect(res.status).toBe(201);
      const veh = await prisma.vehicle.findUnique({ where: { noPolisi: 'B9999XYZ' } });
      expect(veh.status).toBe('READY_TO_START');
    });

    test('Tolak Akhiri Pekerjaan ketika belum ada sesi Mulai aktif', async () => {
      const items = [{ category: 'A', name: 'Kondisi Rem', isGood: true }];

      const res = await request(app)
        .post('/api/handovers')
        .set('Authorization', `Bearer ${amtToken}`)
        .field('noPolisi', 'B9999XYZ')
        .field('shift', '1')
        .field('type', 'akhiri')
        .field('locationLat', '-6.200000')
        .field('locationLng', '106.816666')
        .field('items', JSON.stringify(items));

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('belum memiliki pekerjaan aktif');
    });
  });

  describe('4. Isu Kendaraan Major & Alur Verifikasi Perbaikan', () => {
    let createdIssueId;

    test('Isu Kategori A Major mengubah kendaraan menjadi Maintenance dan membuat Issue ONGOING', async () => {
      const items = [
        { category: 'A', name: 'Kondisi Rem [MAJOR]', isGood: false, severity: 'Major' }
      ];

      const res = await request(app)
        .post('/api/handovers')
        .set('Authorization', `Bearer ${amtToken}`)
        .field('noPolisi', 'B9999XYZ')
        .field('shift', '1')
        .field('type', 'mulai')
        .field('locationLat', '-6.200000')
        .field('locationLng', '106.816666')
        .field('items', JSON.stringify(items));

      expect(res.status).toBe(201);
      const veh = await prisma.vehicle.findUnique({ where: { noPolisi: 'B9999XYZ' } });
      expect(veh.status).toBe('Maintenance');

      const issue = await prisma.issue.findFirst({
        where: { handoverId: res.body.handover.id }
      });
      expect(issue).not.toBeNull();
      expect(issue.status).toBe('ONGOING');
      createdIssueId = issue.id;
    });

    test('Force release ditolak jika terdapat Isu Kendaraan Major yang belum diselesaikan', async () => {
      const res = await request(app)
        .post('/api/handovers/force-release')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          noPolisi: 'B9999XYZ',
          reason: 'Mencoba force release pada mobil rusak'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Isu Kendaraan Major');
    });

    test('AMT berwenang dapat mengirim bukti perbaikan dan mengubah status menjadi PENDING_APPROVAL', async () => {
      const issue = await prisma.issue.findUnique({
        where: { id: createdIssueId },
        include: { handover: { include: { items: true } } }
      });

      const damagedItem = issue.handover.items.find(i => !i.isGood);
      expect(damagedItem).toBeDefined();

      const itemsData = JSON.stringify([
        { id: damagedItem.id, repairNote: 'Kampas rem telah diganti dengan part baru' }
      ]);

      const res = await request(app)
        .post(`/api/issues/${createdIssueId}/verify-repair`)
        .set('Authorization', `Bearer ${amtToken}`)
        .field('itemsData', itemsData);

      expect(res.status).toBe(200);
      expect(res.body.issue.status).toBe('PENDING_APPROVAL');
    });

    test('Evaluasi perbaikan kosong ditolak oleh backend', async () => {
      const res = await request(app)
        .post(`/api/issues/${createdIssueId}/evaluate-repair`)
        .set('Authorization', `Bearer ${pengawasToken}`)
        .send({ evaluations: [] });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('tidak boleh kosong');
    });

    test('Evaluasi penolakan wajib menyertakan alasan penolakan', async () => {
      const issue = await prisma.issue.findUnique({
        where: { id: createdIssueId },
        include: { handover: { include: { items: true } } }
      });
      const damagedItem = issue.handover.items.find(i => !i.isGood);

      const res = await request(app)
        .post(`/api/issues/${createdIssueId}/evaluate-repair`)
        .set('Authorization', `Bearer ${pengawasToken}`)
        .send({
          evaluations: [{ itemId: damagedItem.id, approved: false, reason: '' }]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Alasan penolakan wajib diisi');
    });

    test('Evaluasi persetujuan berhasil mengubah Issue menjadi RESOLVED dan kendaraan kembali READY_TO_START', async () => {
      const issue = await prisma.issue.findUnique({
        where: { id: createdIssueId },
        include: { handover: { include: { items: true } } }
      });
      const damagedItem = issue.handover.items.find(i => !i.isGood);

      const res = await request(app)
        .post(`/api/issues/${createdIssueId}/evaluate-repair`)
        .set('Authorization', `Bearer ${pengawasToken}`)
        .send({
          evaluations: [{ itemId: damagedItem.id, approved: true }]
        });

      expect(res.status).toBe(200);
      expect(res.body.issue.status).toBe('RESOLVED');

      // Kendaraan kembali ke READY_TO_START
      const veh = await prisma.vehicle.findUnique({ where: { noPolisi: 'B9999XYZ' } });
      expect(veh.status).toBe('READY_TO_START');
    });
  });

  describe('5. Notifikasi & Endpoint Unread Count', () => {
    test('Endpoint /api/notifications/unread-count mengembalikan hitungan yang valid', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${amtToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.count).toBe('number');
    });
  });
});
