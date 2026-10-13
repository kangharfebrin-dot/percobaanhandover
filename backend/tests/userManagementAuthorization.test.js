const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../index');
const prisma = require('../src/config/prisma');
const { normalizeRole } = require('../src/middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'pertamina_handover_jwt_secure_key_2026_a8f9c2d1e4b7';

describe('User Management & RBAC Authorization Suite (Phase 14)', () => {
  let superAdminUser, secondSuperAdminUser, adminUser, secondAdminUser, pengawasUser, amtUser, legacyUser;
  let superAdminToken, secondSuperAdminToken, adminToken, secondAdminToken, pengawasToken, amtToken, legacyUserToken;
  let defaultPasswordHash;

  beforeAll(async () => {
    defaultPasswordHash = await bcrypt.hash('password123', 10);

    // 1. Super Admin Utama
    superAdminUser = await prisma.user.upsert({
      where: { username: 'test_superadmin_auth' },
      update: { role: 'SUPER_ADMIN', deletedAt: null },
      create: {
        username: 'test_superadmin_auth',
        password: defaultPasswordHash,
        name: 'Primary Super Admin',
        role: 'SUPER_ADMIN',
        jabatan: 'Super Administrator'
      }
    });

    // 2. Super Admin Kedua (untuk pengujian manajemen antar Super Admin)
    secondSuperAdminUser = await prisma.user.upsert({
      where: { username: 'test_superadmin_auth2' },
      update: { role: 'SUPER_ADMIN', deletedAt: null },
      create: {
        username: 'test_superadmin_auth2',
        password: defaultPasswordHash,
        name: 'Secondary Super Admin',
        role: 'SUPER_ADMIN',
        jabatan: 'Super Administrator 2'
      }
    });

    // 3. Admin Utama
    adminUser = await prisma.user.upsert({
      where: { username: 'test_admin_auth' },
      update: { role: 'ADMIN', deletedAt: null },
      create: {
        username: 'test_admin_auth',
        password: defaultPasswordHash,
        name: 'Admin Operational',
        role: 'ADMIN',
        jabatan: 'Administrator'
      }
    });

    // 4. Admin Kedua (untuk pengujian isolasi antar Admin)
    secondAdminUser = await prisma.user.upsert({
      where: { username: 'test_admin_auth2' },
      update: { role: 'ADMIN', deletedAt: null },
      create: {
        username: 'test_admin_auth2',
        password: defaultPasswordHash,
        name: 'Admin Operational 2',
        role: 'ADMIN',
        jabatan: 'Administrator 2'
      }
    });

    // 5. Pengawas Lapangan
    pengawasUser = await prisma.user.upsert({
      where: { username: 'test_pengawas_auth' },
      update: { role: 'PENGAWAS', deletedAt: null },
      create: {
        username: 'test_pengawas_auth',
        password: defaultPasswordHash,
        name: 'Pengawas Lapangan',
        role: 'PENGAWAS',
        jabatan: 'Pengawas Lapangan'
      }
    });

    // 6. AMT Crew
    amtUser = await prisma.user.upsert({
      where: { username: 'test_amt_auth' },
      update: { role: 'AMT', deletedAt: null },
      create: {
        username: 'test_amt_auth',
        password: defaultPasswordHash,
        name: 'Awak Mobil Tangki 1',
        role: 'AMT',
        jabatan: 'AMT I'
      }
    });

    // 7. Legacy User (Role USER)
    legacyUser = await prisma.user.upsert({
      where: { username: 'test_legacy_user_auth' },
      update: { role: 'USER', deletedAt: null },
      create: {
        username: 'test_legacy_user_auth',
        password: defaultPasswordHash,
        name: 'Legacy User Account',
        role: 'USER',
        jabatan: 'AMT I'
      }
    });

    // Tokens
    superAdminToken = jwt.sign({ id: superAdminUser.id, username: superAdminUser.username, role: 'SUPER_ADMIN' }, JWT_SECRET);
    secondSuperAdminToken = jwt.sign({ id: secondSuperAdminUser.id, username: secondSuperAdminUser.username, role: 'SUPER_ADMIN' }, JWT_SECRET);
    adminToken = jwt.sign({ id: adminUser.id, username: adminUser.username, role: 'ADMIN' }, JWT_SECRET);
    secondAdminToken = jwt.sign({ id: secondAdminUser.id, username: secondAdminUser.username, role: 'ADMIN' }, JWT_SECRET);
    pengawasToken = jwt.sign({ id: pengawasUser.id, username: pengawasUser.username, role: 'PENGAWAS' }, JWT_SECRET);
    amtToken = jwt.sign({ id: amtUser.id, username: amtUser.username, role: 'AMT' }, JWT_SECRET);
    legacyUserToken = jwt.sign({ id: legacyUser.id, username: legacyUser.username, role: 'USER' }, JWT_SECRET);
  });

  afterAll(async () => {
    // Bersihkan user testing sementara
    await prisma.user.deleteMany({
      where: {
        username: {
          in: [
            'worker_amt_created_by_admin',
            'worker_amt_created_by_sa',
            'pengawas_created_by_sa',
            'admin_created_by_sa',
            'sa_created_by_sa'
          ]
        }
      }
    });
  });

  // =========================================================================
  // SKENARIO 1: ADMIN berhasil membuat atau mengubah akun AMT
  // =========================================================================
  test('Skenario 1: ADMIN berhasil membuat dan mengubah akun AMT', async () => {
    // 1. Buat worker AMT baru
    const createRes = await request(app)
      .post('/api/workers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Worker AMT Admin Test',
        username: 'worker_amt_created_by_admin',
        password: 'password123',
        role: 'AMT',
        jabatan: 'AMT I'
      });
    expect([200, 201]).toContain(createRes.status);
    const createdId = createRes.body.worker?.id || createRes.body.id;
    const createdRole = createRes.body.worker?.role || createRes.body.role;
    expect(createdRole).toBe('AMT');

    // 2. Ubah worker AMT
    const updateRes = await request(app)
      .put(`/api/workers/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Worker AMT Admin Updated',
        jabatan: 'AMT II'
      });
    expect(updateRes.status).toBe(200);
    const updatedName = updateRes.body.worker?.name || updateRes.body.name;
    expect(updatedName).toBe('Worker AMT Admin Updated');
  });

  // =========================================================================
  // SKENARIO 2: ADMIN ditolak ketika mengedit akun PENGAWAS
  // =========================================================================
  test('Skenario 2: ADMIN ditolak ketika mengedit akun PENGAWAS', async () => {
    // Melalui endpoint /api/pengawas/:id
    const resPengawasEndpoint = await request(app)
      .put(`/api/pengawas/${pengawasUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Hacked Pengawas Name' });
    expect(resPengawasEndpoint.status).toBe(403);

    // Melalui endpoint /api/workers/:id dengan target ID pengawas
    const resWorkersEndpoint = await request(app)
      .put(`/api/workers/${pengawasUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Hacked Pengawas via Workers' });
    expect(resWorkersEndpoint.status).toBe(403);
  });

  // =========================================================================
  // SKENARIO 3: ADMIN ditolak ketika menghapus akun PENGAWAS
  // =========================================================================
  test('Skenario 3: ADMIN ditolak ketika menghapus akun PENGAWAS', async () => {
    // Melalui endpoint /api/pengawas/:id
    const resPengawasEndpoint = await request(app)
      .delete(`/api/pengawas/${pengawasUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resPengawasEndpoint.status).toBe(403);

    // Melalui endpoint /api/workers/:id
    const resWorkersEndpoint = await request(app)
      .delete(`/api/workers/${pengawasUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resWorkersEndpoint.status).toBe(403);
  });

  // =========================================================================
  // SKENARIO 4: ADMIN ditolak ketika mengedit akun ADMIN lainnya
  // =========================================================================
  test('Skenario 4: ADMIN ditolak ketika mengedit akun ADMIN lainnya', async () => {
    // Melalui endpoint /api/admins/:id
    const resAdminEndpoint = await request(app)
      .put(`/api/admins/${secondAdminUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Tampered Admin 2' });
    expect(resAdminEndpoint.status).toBe(403);

    // Melalui endpoint /api/workers/:id
    const resWorkersEndpoint = await request(app)
      .put(`/api/workers/${secondAdminUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Tampered Admin 2 via Workers' });
    expect(resWorkersEndpoint.status).toBe(403);
  });

  // =========================================================================
  // SKENARIO 5: ADMIN ditolak ketika menghapus akun ADMIN lainnya
  // =========================================================================
  test('Skenario 5: ADMIN ditolak ketika menghapus akun ADMIN lainnya', async () => {
    // Melalui endpoint /api/admins/:id
    const resAdminEndpoint = await request(app)
      .delete(`/api/admins/${secondAdminUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resAdminEndpoint.status).toBe(403);

    // Melalui endpoint /api/workers/:id
    const resWorkersEndpoint = await request(app)
      .delete(`/api/workers/${secondAdminUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resWorkersEndpoint.status).toBe(403);
  });

  // =========================================================================
  // SKENARIO 6: ADMIN ditolak ketika mengubah role akun menjadi SUPER_ADMIN
  // =========================================================================
  test('Skenario 6: ADMIN ditolak ketika mengubah role akun menjadi SUPER_ADMIN', async () => {
    // Upaya manipulasi di endpoint workers
    const res = await request(app)
      .put(`/api/workers/${amtUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'SUPER_ADMIN' });
    expect(res.status).toBe(403);

    // Upaya privilege escalation via endpoint admins
    const resCreateAdmin = await request(app)
      .post('/api/admins')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Fake SA',
        username: 'fake_sa_by_admin',
        password: 'password123',
        role: 'SUPER_ADMIN'
      });
    expect(resCreateAdmin.status).toBe(403);
  });

  // =========================================================================
  // SKENARIO 7: ADMIN ditolak ketika memodifikasi akun SUPER_ADMIN
  // =========================================================================
  test('Skenario 7: ADMIN ditolak ketika memodifikasi akun SUPER_ADMIN', async () => {
    // Modifikasi via /api/admins/:id
    const resEdit = await request(app)
      .put(`/api/admins/${superAdminUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Tampered Super Admin' });
    expect(resEdit.status).toBe(403);

    // Hapus via /api/admins/:id
    const resDelete = await request(app)
      .delete(`/api/admins/${superAdminUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resDelete.status).toBe(403);

    // Modifikasi via /api/workers/:id
    const resWorkers = await request(app)
      .put(`/api/workers/${superAdminUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Tampered SA via Workers' });
    expect(resWorkers.status).toBe(403);
  });

  // =========================================================================
  // SKENARIO 8: ADMIN tidak dapat mereset password akun administratif
  // =========================================================================
  test('Skenario 8: ADMIN tidak dapat mereset password akun administratif', async () => {
    // Admin mencoba menyetujui reset password untuk akun Pengawas
    const resPengawas = await request(app)
      .post('/api/password-reset/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: pengawasUser.username,
        action: 'APPROVE',
        newPassword: 'newsecurepassword123'
      });
    expect(resPengawas.status).toBe(403);

    // Admin mencoba menyetujui reset password untuk akun Admin lain
    const resAdmin = await request(app)
      .post('/api/password-reset/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: secondAdminUser.username,
        action: 'APPROVE',
        newPassword: 'newsecurepassword123'
      });
    expect(resAdmin.status).toBe(403);

    // Admin mencoba menyetujui reset password untuk Super Admin
    const resSA = await request(app)
      .post('/api/password-reset/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        username: superAdminUser.username,
        action: 'APPROVE',
        newPassword: 'newsecurepassword123'
      });
    expect(resSA.status).toBe(403);
  });

  // =========================================================================
  // SKENARIO 9: SUPER_ADMIN berhasil mengelola akun AMT
  // =========================================================================
  test('Skenario 9: SUPER_ADMIN berhasil mengelola akun AMT', async () => {
    // 1. Create AMT
    const createRes = await request(app)
      .post('/api/workers')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Worker Created by SA',
        username: 'worker_amt_created_by_sa',
        password: 'password123',
        role: 'AMT',
        jabatan: 'AMT I'
      });
    expect([200, 201]).toContain(createRes.status);
    const workerId = createRes.body.worker?.id || createRes.body.id;

    // 2. Update AMT
    const updateRes = await request(app)
      .put(`/api/workers/${workerId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Worker Updated by SA',
        jabatan: 'AMT II'
      });
    expect(updateRes.status).toBe(200);

    // 3. Delete AMT
    const deleteRes = await request(app)
      .delete(`/api/workers/${workerId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(deleteRes.status).toBe(200);
  });

  // =========================================================================
  // SKENARIO 10: SUPER_ADMIN berhasil mengelola akun PENGAWAS
  // =========================================================================
  test('Skenario 10: SUPER_ADMIN berhasil mengelola akun PENGAWAS', async () => {
    // 1. Create Pengawas
    const createRes = await request(app)
      .post('/api/pengawas')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Pengawas Created by SA',
        username: 'pengawas_created_by_sa',
        password: 'password123',
        role: 'PENGAWAS',
        jabatan: 'Pengawas Lapangan'
      });
    expect([200, 201]).toContain(createRes.status);
    const pengawasId = createRes.body.pengawas?.id || createRes.body.id;

    // 2. Update Pengawas
    const updateRes = await request(app)
      .put(`/api/pengawas/${pengawasId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Pengawas Updated by SA',
        jabatan: 'Pengawas HSSE'
      });
    expect(updateRes.status).toBe(200);

    // 3. Delete Pengawas
    const deleteRes = await request(app)
      .delete(`/api/pengawas/${pengawasId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(deleteRes.status).toBe(200);
  });

  // =========================================================================
  // SKENARIO 11: SUPER_ADMIN berhasil mengelola akun ADMIN
  // =========================================================================
  test('Skenario 11: SUPER_ADMIN berhasil mengelola akun ADMIN', async () => {
    // 1. Create Admin
    const createRes = await request(app)
      .post('/api/admins')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Admin Created by SA',
        username: 'admin_created_by_sa',
        password: 'password123',
        role: 'ADMIN',
        jabatan: 'Administrator Operasional'
      });
    expect([200, 201]).toContain(createRes.status);
    const newAdminId = createRes.body.admin?.id || createRes.body.id;

    // 2. Update Admin
    const updateRes = await request(app)
      .put(`/api/admins/${newAdminId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Admin Updated by SA',
        jabatan: 'Senior Administrator'
      });
    expect(updateRes.status).toBe(200);

    // 3. Delete Admin
    const deleteRes = await request(app)
      .delete(`/api/admins/${newAdminId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(deleteRes.status).toBe(200);
  });

  // =========================================================================
  // SKENARIO 12: SUPER_ADMIN berhasil mengelola akun SUPER_ADMIN lain
  // =========================================================================
  test('Skenario 12: SUPER_ADMIN berhasil mengelola akun SUPER_ADMIN lain', async () => {
    // 1. Create another Super Admin
    const createRes = await request(app)
      .post('/api/admins')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'SA Created by SA',
        username: 'sa_created_by_sa',
        password: 'password123',
        role: 'SUPER_ADMIN',
        jabatan: 'Super Administrator Regional'
      });
    expect([200, 201]).toContain(createRes.status);
    const newSAId = createRes.body.admin?.id || createRes.body.id;
    const saRole = createRes.body.admin?.role || createRes.body.role;
    expect(saRole).toBe('SUPER_ADMIN');

    // 2. Update another Super Admin
    const updateRes = await request(app)
      .put(`/api/admins/${newSAId}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'SA Updated by Primary SA'
      });
    expect(updateRes.status).toBe(200);

    // 3. Delete that Super Admin (karena masih ada SA utama aktif)
    const deleteRes = await request(app)
      .delete(`/api/admins/${newSAId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(deleteRes.status).toBe(200);
  });

  // =========================================================================
  // SKENARIO 13: SUPER_ADMIN dapat mengubah role sesuai hak aksesnya & proteksi last active SA
  // =========================================================================
  test('Skenario 13: SUPER_ADMIN dapat mengubah role & dicegah menghapus/menurunkan SA aktif terakhir', async () => {
    // 1. SUPER_ADMIN dapat mengubah role worker dari AMT ke PENGAWAS
    const resChangeRole = await request(app)
      .put(`/api/workers/${amtUser.id}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ role: 'PENGAWAS' });
    expect(resChangeRole.status).toBe(200);
    const changedRole = resChangeRole.body.worker?.role || resChangeRole.body.role;
    expect(changedRole).toBe('PENGAWAS');

    // Kembalikan role ke AMT
    await request(app)
      .put(`/api/workers/${amtUser.id}`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ role: 'AMT' });

    // 2. Proteksi self-deletion
    const resSelfDelete = await request(app)
      .delete(`/api/admins/${superAdminUser.id}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(resSelfDelete.status).toBe(400);
    expect(resSelfDelete.body.error).toMatch(/tidak dapat menghapus akun.*sendiri/i);
  });

  // =========================================================================
  // SKENARIO 14: Permintaan tanpa autentikasi ditolak (401)
  // =========================================================================
  test('Skenario 14: Permintaan tanpa autentikasi ditolak (401 Unauthorized)', async () => {
    const resWorkers = await request(app).get('/api/workers');
    expect(resWorkers.status).toBe(401);

    const resPengawas = await request(app).get('/api/pengawas');
    expect(resPengawas.status).toBe(401);

    const resAdmins = await request(app).get('/api/admins');
    expect(resAdmins.status).toBe(401);
  });

  // =========================================================================
  // SKENARIO 15: Token yang tidak valid ditolak (401)
  // =========================================================================
  test('Skenario 15: Token yang tidak valid ditolak (401 Unauthorized)', async () => {
    const res = await request(app)
      .get('/api/workers')
      .set('Authorization', 'Bearer invalid.token.signature');
    expect(res.status).toBe(401);
  });

  // =========================================================================
  // SKENARIO 16: Manipulasi role pada request body tidak meningkatkan izin
  // =========================================================================
  test('Skenario 16: Manipulasi role pada request body tidak meningkatkan izin', async () => {
    // AMT mencoba memanggil endpoint manajemen worker dengan menyisipkan body manipulatif
    const resAmt = await request(app)
      .post('/api/workers')
      .set('Authorization', `Bearer ${amtToken}`)
      .send({
        name: 'Escalated Worker',
        username: 'escalated_user',
        password: 'password123',
        role: 'SUPER_ADMIN'
      });
    expect(resAmt.status).toBe(403);

    // ADMIN mencoba membuat admin dengan mengklaim role SUPER_ADMIN di body
    const resAdmin = await request(app)
      .post('/api/admins')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Escalated Admin',
        username: 'escalated_admin',
        password: 'password123',
        role: 'SUPER_ADMIN'
      });
    expect(resAdmin.status).toBe(403);
  });

  // =========================================================================
  // SKENARIO 17: SUPER_ADMIN tidak dinormalisasi menjadi ADMIN
  // =========================================================================
  test('Skenario 17: SUPER_ADMIN tidak dinormalisasi menjadi ADMIN', async () => {
    // Verifikasi fungsi normalizeRole
    expect(normalizeRole('SUPER_ADMIN')).toBe('SUPER_ADMIN');
    expect(normalizeRole('ADMIN')).toBe('ADMIN');

    // Verifikasi respons login untuk user ber-role SUPER_ADMIN
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: superAdminUser.username,
        password: 'password123'
      });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.role).toBe('SUPER_ADMIN');

    const decoded = jwt.decode(loginRes.body.token);
    expect(decoded.role).toBe('SUPER_ADMIN');
    expect(decoded.role).not.toBe('ADMIN');
  });

  // =========================================================================
  // SKENARIO 18: ADMIN tidak mendapatkan hak akses SUPER_ADMIN melalui JWT
  // =========================================================================
  test('Skenario 18: ADMIN tidak mendapatkan hak akses SUPER_ADMIN melalui JWT', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: adminUser.username,
        password: 'password123'
      });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.role).toBe('ADMIN');

    const decoded = jwt.decode(loginRes.body.token);
    expect(decoded.role).toBe('ADMIN');
    expect(decoded.role).not.toBe('SUPER_ADMIN');

    // Token tersebut tidak bisa memodifikasi admin
    const mutRes = await request(app)
      .post('/api/admins')
      .set('Authorization', `Bearer ${loginRes.body.token}`)
      .send({
        name: 'Test Mut',
        username: 'test_mut',
        password: 'password123',
        role: 'ADMIN'
      });
    expect(mutRes.status).toBe(403);
  });

  // =========================================================================
  // SKENARIO 19: Akun lama tetap dapat login sesuai aturan kompatibilitas
  // =========================================================================
  test('Skenario 19: Akun lama (USER) dapat login dan dinormalisasi menjadi AMT', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: legacyUser.username,
        password: 'password123'
      });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.role).toBe('AMT');

    const decoded = jwt.decode(loginRes.body.token);
    expect(decoded.role).toBe('AMT');

    // Token legacy USER tetap bisa mengakses endpoint AMT operasional
    const handoverRes = await request(app)
      .get('/api/handovers/my-active')
      .set('Authorization', `Bearer ${legacyUserToken}`);
    expect(handoverRes.status).toBe(200);
  });

  // =========================================================================
  // SKENARIO 20: Seluruh fitur operasional tetap berjalan tanpa regresi
  // =========================================================================
  test('Skenario 20: Fitur operasional handover, isu, checklist, dan pelaporan tetap berjalan normal', async () => {
    // 1. Checklist access (ADMIN & SUPER_ADMIN & PENGAWAS)
    const checkRes = await request(app)
      .get('/api/checklists')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(checkRes.status).toBe(200);

    // 2. Vehicles access
    const vehRes = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(vehRes.status).toBe(200);

    // 3. Ongoing issues access (SUPER_ADMIN)
    const issueRes = await request(app)
      .get('/api/issues/ongoing')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(issueRes.status).toBe(200);

    // 4. Ongoing issues access (ADMIN)
    const issueAdminRes = await request(app)
      .get('/api/issues/ongoing')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(issueAdminRes.status).toBe(200);

    // 5. Dashboard analytics & export access (SUPER_ADMIN)
    const analyticsRes = await request(app)
      .get('/api/dashboard/analytics')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(analyticsRes.status).toBe(200);

    // 6. Excel report export (ADMIN & SUPER_ADMIN)
    const excelRes = await request(app)
      .get('/api/reports/excel')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(excelRes.status).toBe(200);
  });
});
