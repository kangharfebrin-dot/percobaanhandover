const request = require('supertest');
const app = require('../index');
const prisma = require('../src/config/prisma');
const bcrypt = require('bcrypt');
const LoginAttemptService = require('../src/services/loginAttemptService');

describe('Autentikasi & Reset Password - Verifikasi 3 Percobaan & Tanpa Lockout 15 Menit', () => {
  const testUser = {
    username: 'test_user_auth_flow',
    password: 'password_benar_123',
    name: 'Test Auth User',
    role: 'USER',
    jabatan: 'Operator'
  };

  const adminUser = {
    username: 'test_admin_auth_flow',
    password: 'admin_password_123',
    name: 'Test Admin User',
    role: 'ADMIN',
    jabatan: 'Administrator'
  };

  let testUserId;
  let adminUserId;
  let adminToken;

  beforeAll(async () => {
    // Bersihkan test data jika sudah ada
    await prisma.passwordResetRequest.deleteMany({
      where: { email: { in: [testUser.username, adminUser.username] } }
    });
    await prisma.notification.deleteMany({
      where: { message: { contains: testUser.username } }
    });
    await LoginAttemptService.resetFailedAttempts(testUser.username);
    await LoginAttemptService.resetFailedAttempts('user_lain_test');

    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    const user = await prisma.user.upsert({
      where: { username: testUser.username },
      update: { password: hashedPassword, role: testUser.role, deletedAt: null },
      create: {
        username: testUser.username,
        password: hashedPassword,
        name: testUser.name,
        role: testUser.role,
        jabatan: testUser.jabatan
      }
    });
    testUserId = user.id;

    const hashedAdminPassword = await bcrypt.hash(adminUser.password, 10);
    const admin = await prisma.user.upsert({
      where: { username: adminUser.username },
      update: { password: hashedAdminPassword, role: adminUser.role, deletedAt: null },
      create: {
        username: adminUser.username,
        password: hashedAdminPassword,
        name: adminUser.name,
        role: adminUser.role,
        jabatan: adminUser.jabatan
      }
    });
    adminUserId = admin.id;

    // Login admin untuk mendapatkan token
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: adminUser.username, password: adminUser.password });
    adminToken = adminLoginRes.body.token;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.passwordResetRequest.deleteMany({
      where: { email: { in: [testUser.username, adminUser.username] } }
    });
    await prisma.notification.deleteMany({
      where: { message: { contains: testUser.username } }
    });
    await LoginAttemptService.resetFailedAttempts(testUser.username);
    await LoginAttemptService.resetFailedAttempts('user_lain_test');
    await prisma.user.deleteMany({
      where: { username: { in: [testUser.username, adminUser.username] } }
    });
  });

  describe('Skenario A & B: Percobaan 1, 2, dan 3 Gagal Berturut-turut', () => {
    it('Skenario A: Percobaan pertama dan kedua gagal menampilkan pesan salah tanpa countdown', async () => {
      await LoginAttemptService.resetFailedAttempts(testUser.username);

      // Percobaan 1
      const res1 = await request(app)
        .post('/api/auth/login')
        .send({ username: testUser.username, password: 'password_salah_1' });

      expect(res1.status).toBe(401);
      expect(res1.body.error).toBe('Username atau password salah');
      expect(res1.body.failedAttempts).toBe(1);
      expect(res1.body.showForgotPasswordPrompt).toBe(false);

      // Percobaan 2
      const res2 = await request(app)
        .post('/api/auth/login')
        .send({ username: testUser.username, password: 'password_salah_2' });

      expect(res2.status).toBe(401);
      expect(res2.body.error).toBe('Username atau password salah');
      expect(res2.body.failedAttempts).toBe(2);
      expect(res2.body.showForgotPasswordPrompt).toBe(false);
    });

    it('Skenario B: Percobaan ketiga berturut-turut gagal memicu showForgotPasswordPrompt', async () => {
      // Percobaan 3
      const res3 = await request(app)
        .post('/api/auth/login')
        .send({ username: testUser.username, password: 'password_salah_3' });

      expect(res3.status).toBe(401);
      expect(res3.body.error).toBe('Username atau password salah');
      expect(res3.body.failedAttempts).toBe(3);
      expect(res3.body.showForgotPasswordPrompt).toBe(true);
    });
  });

  describe('Skenario C: Percobaan Keempat Tetap Diizinkan Tanpa Menunggu 15 Menit', () => {
    it('Skenario C: Percobaan keempat tidak dikunci atau diblokir 15 menit', async () => {
      const res4 = await request(app)
        .post('/api/auth/login')
        .send({ username: testUser.username, password: 'password_salah_4' });

      // Tetap 401 Unauthorized (bukan 429 Too Many Requests atau Account Locked)
      expect(res4.status).toBe(401);
      expect(res4.body.error).toBe('Username atau password salah');
      expect(res4.body.failedAttempts).toBe(4);
      expect(res4.body.showForgotPasswordPrompt).toBe(true);
    });
  });

  describe('Skenario D: Login Berhasil Mereset Penghitung Kegagalan', () => {
    it('Skenario D: Login sukses mereset penghitung ke 0', async () => {
      const resSuccess = await request(app)
        .post('/api/auth/login')
        .send({ username: testUser.username, password: testUser.password });

      expect(resSuccess.status).toBe(200);
      expect(resSuccess.body.token).toBeDefined();

      const failedCount = await LoginAttemptService.getFailedAttempts(testUser.username);
      expect(failedCount).toBe(0);
    });
  });

  describe('Skenario E: Input Kosong Tidak Meningkatkan Penghitung', () => {
    it('Skenario E: Input password atau username kosong ditolak 400 dan tidak menambah counter', async () => {
      await LoginAttemptService.resetFailedAttempts(testUser.username);

      const resEmptyPass = await request(app)
        .post('/api/auth/login')
        .send({ username: testUser.username, password: '' });

      expect(resEmptyPass.status).toBe(400);

      const resEmptyUser = await request(app)
        .post('/api/auth/login')
        .send({ username: '', password: 'somepassword' });

      expect(resEmptyUser.status).toBe(400);

      const failedCount = await LoginAttemptService.getFailedAttempts(testUser.username);
      expect(failedCount).toBe(0);
    });
  });

  describe('Skenario F: Mengganti Username Tidak Menimbulkan Penghitung Lintas Akun', () => {
    it('Skenario F: Kesalahan pada user B tidak mempengaruhi counter user A', async () => {
      await LoginAttemptService.resetFailedAttempts(testUser.username);
      await LoginAttemptService.resetFailedAttempts('user_lain_test');

      // Gagal 2x di user A
      await request(app).post('/api/auth/login').send({ username: testUser.username, password: 'bad' });
      await request(app).post('/api/auth/login').send({ username: testUser.username, password: 'bad' });

      // Coba akun user B
      const resB = await request(app).post('/api/auth/login').send({ username: 'user_lain_test', password: 'bad' });
      expect(resB.body.failedAttempts).toBe(1);
      expect(resB.body.showForgotPasswordPrompt).toBe(false);

      const countA = await LoginAttemptService.getFailedAttempts(testUser.username);
      const countB = await LoginAttemptService.getFailedAttempts('user_lain_test');
      expect(countA).toBe(2);
      expect(countB).toBe(1);
    });
  });

  describe('Skenario H, I, J, K, L: Alur Permohonan Reset Password & Notifikasi Admin', () => {
    let createdRequestId;

    it('Skenario K: Permintaan reset dengan username tidak terdaftar mengembalikan 404', async () => {
      const resNotFound = await request(app)
        .post('/api/password-reset/request')
        .send({ username: 'user_pasti_tidak_ada_xyz', reason: 'Lupa' });

      expect(resNotFound.status).toBe(404);
      expect(resNotFound.body.success).toBe(false);
      expect(resNotFound.body.message).toContain('tidak terdaftar');
    });

    it('Skenario I: Permintaan reset berhasil membuat 1 entri dan 1 notifikasi AUTH untuk Admin', async () => {
      // Bersihkan permohonan lama test user
      await prisma.passwordResetRequest.deleteMany({ where: { userId: testUserId } });

      const resRequest = await request(app)
        .post('/api/password-reset/request')
        .send({ username: testUser.username, reason: 'Lupa kata sandi saya' });

      expect(resRequest.status).toBe(200);
      expect(resRequest.body.success).toBe(true);
      expect(resRequest.body.requestId).toBeDefined();
      createdRequestId = resRequest.body.requestId;

      // Verifikasi entri database
      const savedRequest = await prisma.passwordResetRequest.findUnique({
        where: { id: createdRequestId }
      });
      expect(savedRequest).toBeDefined();
      expect(savedRequest.status).toBe('PENDING');
      expect(savedRequest.userId).toBe(testUserId);

      // Verifikasi notifikasi untuk Admin
      const adminNotif = await prisma.notification.findFirst({
        where: {
          type: 'AUTH',
          targetRole: 'ADMIN',
          actionId: createdRequestId
        }
      });
      expect(adminNotif).toBeDefined();
      expect(adminNotif.title).toContain('Permintaan Reset Password');
      expect(adminNotif.message).toContain(testUser.username);
    });

    it('Skenario J: Permintaan kedua saat masih PENDING ditolak dan tidak menduplikasi notifikasi', async () => {
      const notifCountBefore = await prisma.notification.count({
        where: { type: 'AUTH', actionId: createdRequestId }
      });

      const resDup = await request(app)
        .post('/api/password-reset/request')
        .send({ username: testUser.username, reason: 'Lupa lagi' });

      expect(resDup.status).toBe(400);
      expect(resDup.body.success).toBe(false);
      expect(resDup.body.message).toContain('sedang diproses');

      const notifCountAfter = await prisma.notification.count({
        where: { type: 'AUTH', actionId: createdRequestId }
      });
      expect(notifCountAfter).toBe(notifCountBefore);
    });

    it('Skenario L: Admin dapat melihat pending request dan memprosesnya (Approve/Reset)', async () => {
      // 1. Admin melihat pending requests
      const resPending = await request(app)
        .get('/api/password-reset/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resPending.status).toBe(200);
      expect(Array.isArray(resPending.body.data)).toBe(true);
      const found = resPending.body.data.find(r => r.id === createdRequestId);
      expect(found).toBeDefined();

      // 2. Admin memverifikasi dan mereset password
      const resReset = await request(app)
        .post('/api/password-reset/verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          requestId: createdRequestId,
          isApproved: true,
          notes: 'Disetujui oleh admin testing'
        });

      expect(resReset.status).toBe(200);
      expect(resReset.body.success).toBe(true);
      expect(resReset.body.data.newPassword).toBeDefined();

      const newTempPassword = resReset.body.data.newPassword;

      // 3. Status di database berubah menjadi COMPLETED
      const updatedReq = await prisma.passwordResetRequest.findUnique({
        where: { id: createdRequestId }
      });
      expect(updatedReq.status).toBe('COMPLETED');
      expect(updatedReq.resetByAdminId).toBe(adminUserId);

      // 4. Notifikasi Admin ditandai sebagai sudah dibaca
      const notif = await prisma.notification.findFirst({
        where: { actionId: createdRequestId }
      });
      expect(notif.isRead).toBe(true);

      // 5. User dapat login dengan password baru hasil reset
      const resLoginNew = await request(app)
        .post('/api/auth/login')
        .send({ username: testUser.username, password: newTempPassword });

      expect(resLoginNew.status).toBe(200);
      expect(resLoginNew.body.token).toBeDefined();
    });
  });
});
