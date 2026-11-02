const request = require('supertest');
const app = require('../index');
const prisma = require('../src/config/prisma');
const TokenManager = require('../src/utils/TokenManager');

describe('Notification Role Scoping & Privacy Tests', () => {
  let adminUser, pengawasUser, amtUserA, amtUserB;
  let adminToken, pengawasToken, amtTokenA, amtTokenB;
  let notifAdmin, notifPengawas, notifAmtA, notifAmtB, notifBroadcast;

  beforeAll(async () => {
    const timestamp = Date.now();

    // 1. Create test users
    adminUser = await prisma.user.create({
      data: {
        username: `test_admin_notif_${timestamp}`,
        password: 'hashed_password',
        name: 'Admin Test User',
        role: 'ADMIN',
        jabatan: 'Administrator'
      }
    });

    pengawasUser = await prisma.user.create({
      data: {
        username: `test_pengawas_notif_${timestamp}`,
        password: 'hashed_password',
        name: 'Pengawas Test User',
        role: 'PENGAWAS',
        jabatan: 'Supervisor'
      }
    });

    amtUserA = await prisma.user.create({
      data: {
        username: `test_amt_a_${timestamp}`,
        password: 'hashed_password',
        name: 'AMT Driver A',
        role: 'AMT',
        jabatan: 'Driver AMT 1'
      }
    });

    amtUserB = await prisma.user.create({
      data: {
        username: `test_amt_b_${timestamp}`,
        password: 'hashed_password',
        name: 'AMT Driver B',
        role: 'AMT',
        jabatan: 'Driver AMT 2'
      }
    });

    // Generate tokens
    adminToken = TokenManager.generateAccessToken({ id: adminUser.id, role: adminUser.role, name: adminUser.name });
    pengawasToken = TokenManager.generateAccessToken({ id: pengawasUser.id, role: pengawasUser.role, name: pengawasUser.name });
    amtTokenA = TokenManager.generateAccessToken({ id: amtUserA.id, role: amtUserA.role, name: amtUserA.name });
    amtTokenB = TokenManager.generateAccessToken({ id: amtUserB.id, role: amtUserB.role, name: amtUserB.name });

    // 2. Create sample notifications with distinct targets
    notifAdmin = await prisma.notification.create({
      data: {
        title: `Admin System Alert ${timestamp}`,
        message: 'Isu kerusakan kendaraan dilaporkan',
        type: 'ERROR',
        targetRole: 'ADMIN',
        targetUserId: null
      }
    });

    notifPengawas = await prisma.notification.create({
      data: {
        title: `Pengawas Shift Notice ${timestamp}`,
        message: 'Pengawasan operasional lapangan',
        type: 'WARNING',
        targetRole: 'PENGAWAS',
        targetUserId: null
      }
    });

    notifAmtA = await prisma.notification.create({
      data: {
        title: `Pribadi AMT A ${timestamp}`,
        message: 'Catatan kepatuhan perlengkapan driver A',
        type: 'WARNING',
        targetRole: 'USER',
        targetUserId: amtUserA.id
      }
    });

    notifAmtB = await prisma.notification.create({
      data: {
        title: `Pribadi AMT B ${timestamp}`,
        message: 'Catatan kepatuhan perlengkapan driver B',
        type: 'WARNING',
        targetRole: 'USER',
        targetUserId: amtUserB.id
      }
    });

    notifBroadcast = await prisma.notification.create({
      data: {
        title: `Siaran Umum ${timestamp}`,
        message: 'Pengumuman umum operasional',
        type: 'INFO',
        targetRole: 'ALL',
        targetUserId: null
      }
    });
  });

  afterAll(async () => {
    // Cleanup test notifications
    const ids = [notifAdmin?.id, notifPengawas?.id, notifAmtA?.id, notifAmtB?.id, notifBroadcast?.id].filter(Boolean);
    await prisma.notification.deleteMany({ where: { id: { in: ids } } });

    // Cleanup test users
    const userIds = [adminUser?.id, pengawasUser?.id, amtUserA?.id, amtUserB?.id].filter(Boolean);
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  });

  test('ADMIN can see ALL notifications across the system ("admin mah bebas bisa lihat semua")', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const receivedIds = res.body.notifications.map(n => n.id);
    expect(receivedIds).toContain(notifAdmin.id);
    expect(receivedIds).toContain(notifPengawas.id);
    expect(receivedIds).toContain(notifAmtA.id);
    expect(receivedIds).toContain(notifAmtB.id);
    expect(receivedIds).toContain(notifBroadcast.id);
  });

  test('PENGAWAS sees operational notifications (PENGAWAS, ALL) but not private AMT notifications', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${pengawasToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const receivedIds = res.body.notifications.map(n => n.id);
    expect(receivedIds).toContain(notifPengawas.id);
    expect(receivedIds).toContain(notifBroadcast.id);
    expect(receivedIds).not.toContain(notifAmtA.id);
    expect(receivedIds).not.toContain(notifAmtB.id);
    expect(receivedIds).not.toContain(notifAdmin.id);
  });

  test('AMT A ONLY sees their own private notifications and NOT others', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${amtTokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const receivedIds = res.body.notifications.map(n => n.id);
    expect(receivedIds).toContain(notifAmtA.id);
    expect(receivedIds).not.toContain(notifAmtB.id);
    expect(receivedIds).not.toContain(notifAdmin.id);
    expect(receivedIds).not.toContain(notifPengawas.id);
    expect(receivedIds).not.toContain(notifBroadcast.id);
  });

  test('AMT B ONLY sees their own private notifications and NOT AMT A notifications', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${amtTokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const receivedIds = res.body.notifications.map(n => n.id);
    expect(receivedIds).toContain(notifAmtB.id);
    expect(receivedIds).not.toContain(notifAmtA.id);
  });

  test('AMT cannot mark another user private notification as read', async () => {
    const res = await request(app)
      .put(`/api/notifications/${notifAmtB.id}/read`)
      .set('Authorization', `Bearer ${amtTokenA}`);

    expect(res.status).toBe(403);
  });

  test('AMT can mark their own private notification as read', async () => {
    const res = await request(app)
      .put(`/api/notifications/${notifAmtA.id}/read`)
      .set('Authorization', `Bearer ${amtTokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.notification.isRead).toBe(true);
  });

  test('Deduplicates paired Admin and AMT notifications for the same event so neither sees double', async () => {
    const testActionId = `HO-TEST-${Date.now()}`;
    const testAdminNotif = await prisma.notification.create({
      data: {
        title: 'Temuan Kepatuhan AMT: ADES SETIAWAN',
        message: 'Petugas ADES SETIAWAN (R 868669 C) catatan kepatuhan belum lengkap: Dokumen HSE Paspor',
        type: 'WARNING',
        targetRole: 'ADMIN',
        actionType: 'VIEW_AMT_ISSUE',
        actionId: testActionId,
        noPolisi: 'R 868669 C'
      }
    });

    const testUserNotif = await prisma.notification.create({
      data: {
        title: 'Peringatan Perlengkapan Kerja: ADES SETIAWAN',
        message: 'Catatan perlengkapan belum lengkap: Dokumen HSE Paspor',
        type: 'WARNING',
        targetRole: 'USER',
        targetUserId: amtUserA.id,
        actionType: 'VIEW_AMT_ISSUE',
        actionId: testActionId,
        noPolisi: 'R 868669 C'
      }
    });

    try {
      // Admin request: harus dapat notifikasi versi ADMIN, dan TIDAK melihat duplikat versi USER
      const resAdmin = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`);
      const adminNotifIds = resAdmin.body.notifications.map(n => n.id);
      expect(adminNotifIds).toContain(testAdminNotif.id);
      expect(adminNotifIds).not.toContain(testUserNotif.id);

      // AMT request: harus dapat notifikasi versi USER, dan TIDAK melihat versi ADMIN
      const resAmt = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${amtTokenA}`);
      const amtNotifIds = resAmt.body.notifications.map(n => n.id);
      expect(amtNotifIds).toContain(testUserNotif.id);
      expect(amtNotifIds).not.toContain(testAdminNotif.id);
    } finally {
      await prisma.notification.deleteMany({
        where: { id: { in: [testAdminNotif.id, testUserNotif.id] } }
      });
    }
  });
});

