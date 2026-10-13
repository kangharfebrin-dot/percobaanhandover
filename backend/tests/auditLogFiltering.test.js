const request = require('supertest');
const app = require('../index');
const TokenManager = require('../src/utils/TokenManager');
const prisma = require('../src/config/prisma');

describe('Audit Log Endpoint Enhanced Filtering & Validation Tests', () => {
  const superAdminUser = { id: 'TEST-SA-AUDIT-01', username: 'sa_audit_test', role: 'SUPER_ADMIN', name: 'Super Admin Audit' };
  const adminUser = { id: 'TEST-AD-AUDIT-01', username: 'ad_audit_test', role: 'ADMIN', name: 'Admin Audit' };

  const superAdminToken = TokenManager.generateAccessToken(superAdminUser);
  const adminToken = TokenManager.generateAccessToken(adminUser);

  beforeAll(async () => {
    // Buat data user dan audit log sample untuk pengujian filter
    try {
      await prisma.user.upsert({
        where: { id: superAdminUser.id },
        update: {},
        create: {
          id: superAdminUser.id,
          username: superAdminUser.username,
          password: 'hashed_dummy_password',
          name: superAdminUser.name,
          role: 'SUPER_ADMIN'
        }
      });

      await prisma.user.upsert({
        where: { id: adminUser.id },
        update: {},
        create: {
          id: adminUser.id,
          username: adminUser.username,
          password: 'hashed_dummy_password',
          name: adminUser.name,
          role: 'ADMIN'
        }
      });

      // Sample audit log 1: USER_MANAGEMENT oleh Super Admin
      await prisma.auditLog.create({
        data: {
          id: 'LOG-TEST-001',
          userId: superAdminUser.id,
          action: 'USER_CHANGE_ROLE',
          actionType: 'USER_MANAGEMENT',
          actionId: 'TARGET-01',
          details: JSON.stringify({ actorRole: 'SUPER_ADMIN', targetUsername: 'sample_amt' }),
          createdAt: new Date('2026-05-10T10:00:00Z')
        }
      });

      // Sample audit log 2: FORCE_RELEASE oleh Admin
      await prisma.auditLog.create({
        data: {
          id: 'LOG-TEST-002',
          userId: adminUser.id,
          action: 'FORCE_RELEASE_SHIFT',
          actionType: 'FORCE_RELEASE',
          noPolisi: 'B 9999 PER',
          details: 'Shift gantung kendaraan B 9999 PER ditutup paksa oleh Admin Audit.',
          createdAt: new Date('2026-05-15T14:30:00Z')
        }
      });
    } catch (e) {
      console.warn('Setup sample audit log error (non-fatal):', e.message);
    }
  });

  afterAll(async () => {
    try {
      await prisma.auditLog.deleteMany({
        where: { id: { in: ['LOG-TEST-001', 'LOG-TEST-002'] } }
      });
      await prisma.user.deleteMany({
        where: { id: { in: [superAdminUser.id, adminUser.id] } }
      });
    } catch (e) {}
  });

  describe('1. Validasi Parameter Query', () => {
    it('harus menolak page bernilai 0 atau negatif (400 Bad Request)', async () => {
      const res = await request(app)
        .get('/api/admins/audit-logs?page=0')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('page');
    });

    it('harus menolak limit bernilai 0 atau negatif (400 Bad Request)', async () => {
      const res = await request(app)
        .get('/api/admins/audit-logs?limit=0')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('limit');
    });

    it('harus menolak format startDate yang tidak valid (400 Bad Request)', async () => {
      const res = await request(app)
        .get('/api/admins/audit-logs?startDate=invalid-date')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('startDate');
    });

    it('harus menolak format endDate yang tidak valid (400 Bad Request)', async () => {
      const res = await request(app)
        .get('/api/admins/audit-logs?endDate=2026-99-99')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('endDate');
    });

    it('harus menolak startDate yang lebih besar daripada endDate (400 Bad Request)', async () => {
      const res = await request(app)
        .get('/api/admins/audit-logs?startDate=2026-06-01&endDate=2026-05-01')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('startDate tidak boleh lebih besar daripada endDate');
    });

    it('harus menolak role yang tidak dikenal (400 Bad Request)', async () => {
      const res = await request(app)
        .get('/api/admins/audit-logs?role=HACKER_ROLE')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('role tidak valid');
    });

    it('harus menolak search query yang melebihi 100 karakter (400 Bad Request)', async () => {
      const longQuery = 'A'.repeat(105);
      const res = await request(app)
        .get(`/api/admins/audit-logs?search=${longQuery}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('100 karakter');
    });
  });

  describe('2. Filter Kategori, Role, dan Pencarian Terintegrasi', () => {
    it('harus memfilter berdasarkan actionType FORCE_RELEASE', async () => {
      const res = await request(app)
        .get('/api/admins/audit-logs?actionType=FORCE_RELEASE')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const found = res.body.logs.find(l => l.id === 'LOG-TEST-002');
      if (found) {
        expect(found.actionType).toBe('FORCE_RELEASE');
        expect(found.noPolisi).toBe('B 9999 PER');
      }
    });

    it('harus memfilter berdasarkan role aktor SUPER_ADMIN', async () => {
      const res = await request(app)
        .get('/api/admins/audit-logs?role=SUPER_ADMIN')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Semua log yang dikembalikan harus memiliki aktor dengan role SUPER_ADMIN
      res.body.logs.forEach(log => {
        expect(log.actor.role).toBe('SUPER_ADMIN');
      });
    });

    it('harus menemukan log berdasarkan pencarian nama aktor', async () => {
      const res = await request(app)
        .get('/api/admins/audit-logs?search=Super Admin Audit')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const matched = res.body.logs.some(l => l.actor.name.includes('Super Admin Audit'));
      expect(matched).toBe(true);
    });

    it('harus menemukan log berdasarkan nomor polisi', async () => {
      const res = await request(app)
        .get('/api/admins/audit-logs?search=B 9999 PER')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const matched = res.body.logs.some(l => l.noPolisi === 'B 9999 PER');
      expect(matched).toBe(true);
    });

    it('harus menggabungkan filter tanggal, kategori, dan kata kunci (AND Kombinasi)', async () => {
      const res = await request(app)
        .get('/api/admins/audit-logs?startDate=2026-05-01&endDate=2026-05-31&actionType=FORCE_RELEASE&search=B 9999 PER')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.logs.length).toBeGreaterThanOrEqual(1);
      const sample = res.body.logs.find(l => l.id === 'LOG-TEST-002');
      expect(sample).toBeDefined();
    });
  });
});
