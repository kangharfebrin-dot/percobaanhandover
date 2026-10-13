const prisma = require('../config/prisma');
const { sendPushNotification } = require('../config/firebase');

/**
 * Notifikasi Isu Kendaraan (Kategori A)
 */
async function sendVehicleIssueNotification(handoverId, noPolisi, issueItems = [], isMajor = false) {
  try {
    const notificationTitle = isMajor ? `Isu Kendaraan Major: ${noPolisi}` : `Isu Kendaraan Minor: ${noPolisi}`;
    const textBody = `Kendaraan ${noPolisi} dilaporkan memiliki isu kondisi/perlengkapan kendaraan:\n${issueItems.map(i => '- ' + i.name).join('\n')}\n\nTingkat: ${isMajor ? 'Major (Perlu Maintenance)' : 'Minor'}`;
    const notificationType = isMajor ? 'ERROR' : 'WARNING';
    const actionType = 'VIEW_ISSUE';

    let targetActionId = handoverId;
    const relatedIssue = await prisma.issue.findFirst({ where: { handoverId } });
    if (relatedIssue) targetActionId = relatedIssue.id;

    await prisma.notification.createMany({
      data: [
        { title: notificationTitle, message: textBody, type: notificationType, targetRole: 'ADMIN', actionType, actionId: targetActionId, noPolisi },
        { title: notificationTitle, message: textBody, type: notificationType, targetRole: 'PENGAWAS', actionType, actionId: targetActionId, noPolisi }
      ]
    });

    // FCM Push Notifications
    const targetUsers = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN', 'PENGAWAS'] },
        fcmToken: { not: null },
        deletedAt: null
      }
    });

    for (const u of targetUsers) {
      if (u.fcmToken) {
        await sendPushNotification(u.fcmToken, notificationTitle, textBody, { handoverId, noPolisi, type: 'VEHICLE_ISSUE' });
      }
    }
  } catch (error) {
    console.error('Gagal mengirim notifikasi isu kendaraan:', error);
  }
}

/**
 * Notifikasi Isu Perlengkapan / Kepatuhan AMT (Kategori B)
 * Tidak mengubah status kendaraan menjadi Maintenance dan tidak mengarah ke form perbaikan kendaraan.
 */
async function sendAmtComplianceNotification(handoverId, noPolisi, amtItems = [], amtName = '', amtUserId = null) {
  try {
    const notificationTitle = `Temuan Kepatuhan AMT: ${amtName || noPolisi}`;
    const textBody = `Terdapat temuan perlengkapan/dokumen kepatuhan AMT (${amtName || 'Petugas AMT'}):\n${amtItems.map(i => '- ' + i.name).join('\n')}\nNomor Polisi: ${noPolisi}. Harap lengkapi perlengkapan kerja.`;
    const notificationType = 'WARNING';
    const actionType = 'VIEW_HANDOVER';

    const notifs = [
      { title: notificationTitle, message: textBody, type: notificationType, targetRole: 'ADMIN', actionType, actionId: handoverId, noPolisi },
      { title: notificationTitle, message: textBody, type: notificationType, targetRole: 'PENGAWAS', actionType, actionId: handoverId, noPolisi }
    ];

    if (amtUserId) {
      notifs.push({
        title: 'Peringatan Perlengkapan Kerja AMT',
        message: `Anda memiliki catatan perlengkapan kerja yang belum sesuai:\n${amtItems.map(i => '- ' + i.name).join('\n')}\nHarap segera lengkapi sebelum bertugas.`,
        type: 'WARNING',
        targetRole: 'AMT',
        targetUserId: amtUserId,
        actionType: 'VIEW_HANDOVER',
        actionId: handoverId,
        noPolisi
      });
    }

    await prisma.notification.createMany({ data: notifs });

    // Push notification to Admin & Pengawas & targeted AMT
    const orConditions = [{ role: { in: ['ADMIN', 'SUPER_ADMIN', 'PENGAWAS'] } }];
    if (amtUserId) {
      orConditions.push({ id: amtUserId });
    }

    const targetUsers = await prisma.user.findMany({
      where: {
        OR: orConditions,
        fcmToken: { not: null },
        deletedAt: null
      }
    });

    for (const u of targetUsers) {
      if (u.fcmToken) {
        await sendPushNotification(u.fcmToken, notificationTitle, textBody, { handoverId, noPolisi, type: 'AMT_COMPLIANCE' });
      }
    }
  } catch (error) {
    console.error('Gagal mengirim notifikasi kepatuhan AMT:', error);
  }
}

/**
 * Backward-compatible sendNotification: otomatis mendistribusikan ke Kategori A dan B.
 */
async function sendNotification(handoverId, noPolisi, issueItems = [], isBlocked = false, type = 'NEW_ISSUE') {
  console.log(`[NOTIFICATION] Kendaraan: ${noPolisi}, Tipe: ${type}, Blocked: ${isBlocked}`);
  try {
    if (type === 'RESOLVED') {
      const notificationTitle = `Isu Selesai: ${noPolisi}`;
      const textBody = `Perbaikan pada kendaraan ${noPolisi} telah selesai dan kendaraan dapat beroperasi kembali.`;
      await prisma.notification.createMany({
        data: [
          { title: notificationTitle, message: textBody, type: 'SUCCESS', targetRole: 'ADMIN', actionType: 'VIEW_HANDOVER', actionId: handoverId, noPolisi },
          { title: notificationTitle, message: textBody, type: 'SUCCESS', targetRole: 'PENGAWAS', actionType: 'VIEW_HANDOVER', actionId: handoverId, noPolisi }
        ]
      });
      return;
    }

    const catAItems = issueItems.filter(i => (i.category || 'A') === 'A');
    const catBItems = issueItems.filter(i => i.category === 'B');

    if (catAItems.length > 0) {
      await sendVehicleIssueNotification(handoverId, noPolisi, catAItems, isBlocked);
    }
    if (catBItems.length > 0) {
      await sendAmtComplianceNotification(handoverId, noPolisi, catBItems);
    }
  } catch (error) {
    console.error('Gagal memproses sendNotification:', error);
  }
}

module.exports = {
  sendNotification,
  sendVehicleIssueNotification,
  sendAmtComplianceNotification
};
