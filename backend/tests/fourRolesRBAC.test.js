const request = require('supertest');
const app = require('../index');
const TokenManager = require('../src/utils/TokenManager');
const { normalizeRole } = require('../src/middleware/auth');

describe('Empat Role Resmi & RBAC Super Admin Verification', () => {
  // Pengguna representatif untuk 4 role resmi
  const superAdminUser = { id: 'TEST-SA-01', username: 'superadmin_test', role: 'SUPER_ADMIN', name: 'Super Admin Test' };
  const adminUser = { id: 'TEST-AD-01', username: 'admin_test', role: 'ADMIN', name: 'Admin Test' };
  const pengawasUser = { id: 'TEST-PG-01', username: 'pengawas_test', role: 'PENGAWAS', name: 'Pengawas Test' };
  const amtUser = { id: 'TEST-AMT-01', username: 'amt_test', role: 'AMT', name: 'AMT Test' };

  const superAdminToken = TokenManager.generateAccessToken(superAdminUser);
  const adminToken = TokenManager.generateAccessToken(adminUser);
  const pengawasToken = TokenManager.generateAccessToken(pengawasUser);
  const amtToken = TokenManager.generateAccessToken(amtUser);

  describe('1. Normalisasi Role Kanonis', () => {
    it('harus menormalisasi role resmi dengan format uppercase', () => {
      expect(normalizeRole('super_admin')).toBe('SUPER_ADMIN');
      expect(normalizeRole('admin')).toBe('ADMIN');
      expect(normalizeRole('pengawas')).toBe('PENGAWAS');
      expect(normalizeRole('amt')).toBe('AMT');
    });

    it('harus menormalisasi legacy role USER menjadi AMT', () => {
      expect(normalizeRole('USER')).toBe('AMT');
      expect(normalizeRole('user')).toBe('AMT');
    });

    it('tidak boleh menormalisasi SUPER_ADMIN menjadi ADMIN', () => {
      expect(normalizeRole('SUPER_ADMIN')).toBe('SUPER_ADMIN');
      expect(normalizeRole('SUPER_ADMIN')).not.toBe('ADMIN');
    });
  });

  describe('2. Endpoint Ringkasan Sistem (/api/admins/system-summary)', () => {
    it('SUPER_ADMIN berhak mengakses ringkasan sistem (200 OK)', async () => {
      const res = await request(app)
        .get('/api/admins/system-summary')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.users).toBeDefined();
      expect(res.body.data.vehicles).toBeDefined();
      expect(res.body.data.handovers).toBeDefined();
      expect(res.body.data.issues).toBeDefined();
      expect(res.body.data.auditLogs).toBeDefined();
    });

    it('ADMIN berhak mengakses ringkasan sistem operasional (200 OK)', async () => {
      const res = await request(app)
        .get('/api/admins/system-summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('PENGAWAS dilarang mengakses ringkasan sistem (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admins/system-summary')
        .set('Authorization', `Bearer ${pengawasToken}`);

      expect(res.status).toBe(403);
    });

    it('AMT dilarang mengakses ringkasan sistem (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admins/system-summary')
        .set('Authorization', `Bearer ${amtToken}`);

      expect(res.status).toBe(403);
    });

    it('Permintaan tanpa token ditolak (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/admins/system-summary');
      expect(res.status).toBe(401);
    });
  });

  describe('3. Endpoint Audit Log (/api/admins/audit-logs)', () => {
    it('SUPER_ADMIN berhak melihat catatan audit log dengan pagination (200 OK)', async () => {
      const res = await request(app)
        .get('/api/admins/audit-logs?page=1&limit=5')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('ADMIN berhak melihat catatan audit log sistem (200 OK)', async () => {
      const res = await request(app)
        .get('/api/admins/audit-logs?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it('PENGAWAS & AMT dilarang melihat audit log (403 Forbidden)', async () => {
      const resPengawas = await request(app)
        .get('/api/admins/audit-logs')
        .set('Authorization', `Bearer ${pengawasToken}`);
      expect(resPengawas.status).toBe(403);

      const resAmt = await request(app)
        .get('/api/admins/audit-logs')
        .set('Authorization', `Bearer ${amtToken}`);
      expect(resAmt.status).toBe(403);
    });
  });

  describe('4. Pembatasan Manajemen Akun Admin & Pengawas', () => {
    it('SUPER_ADMIN berhak melihat daftar akun Admin (/api/admins) (200 OK)', async () => {
      const res = await request(app)
        .get('/api/admins')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('ADMIN dilarang membaca daftar akun Admin (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admins')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });

    it('SUPER_ADMIN berhak melihat daftar akun Pengawas (/api/pengawas) (200 OK)', async () => {
      const res = await request(app)
        .get('/api/pengawas')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('ADMIN dilarang membaca daftar akun Pengawas (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/pengawas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });

    it('SUPER_ADMIN berhak melihat seluruh pengguna lintas role (/api/admins/all-users) (200 OK)', async () => {
      const res = await request(app)
        .get('/api/admins/all-users?page=1&limit=10')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.pagination).toBeDefined();

      // Pastikan password dan refreshToken tidak pernah diekspos
      if (res.body.users.length > 0) {
        const sample = res.body.users[0];
        expect(sample.password).toBeUndefined();
        expect(sample.refreshToken).toBeUndefined();
      }
    });

    it('ADMIN dilarang mengakses all-users (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admins/all-users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('5. Pencegahan Privilege Escalation & Modifikasi Akun', () => {
    it('ADMIN dilarang membuat akun Admin atau Super Admin (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/admins')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Hacker Admin',
          username: 'hacker_admin',
          password: 'password123',
          role: 'ADMIN',
          jabatan: 'Admin'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Admin tidak diizinkan membuat akun Admin atau Super Admin');
    });

    it('ADMIN dilarang membuat akun Pengawas (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/pengawas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Fake Pengawas',
          username: 'fake_pengawas',
          password: 'password123',
          jabatan: 'Pengawas'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Admin tidak diizinkan membuat akun Pengawas');
    });

    it('ADMIN dilarang menaikkan role AMT menjadi ADMIN atau SUPER_ADMIN (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/workers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Escalated User',
          username: 'escalated_user',
          password: 'password123',
          role: 'ADMIN',
          jabatan: 'AMT'
        });

      expect(res.status).toBe(403);
    });
  });
});
