const bcrypt = require('bcrypt');
const { sendPasswordResetNotification, sendPasswordResetCompletedEmail } = require('../services/emailService');
const prisma = require('../config/prisma');
const LoginAttemptService = require('../services/loginAttemptService');
const { normalizeRole } = require('../middleware/auth');

// 1. User submit forgot password request
exports.submitPasswordResetRequest = async (req, res) => {
  try {
    const rawUsername = (req.body.username || req.body.email || '').trim();
    const reason = (req.body.reason || '').trim() || 'Lupa password dari aplikasi';

    if (!rawUsername) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username wajib diisi untuk mengajukan permohonan reset password' 
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        username: rawUsername,
        deletedAt: null
      }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Username tidak terdaftar di sistem' 
      });
    }

    // Check if already have pending request
    const existingRequest = await prisma.passwordResetRequest.findFirst({
      where: {
        userId: user.id,
        status: "PENDING"
      }
    });

    if (existingRequest) {
      const isExpired = Date.now() - new Date(existingRequest.createdAt).getTime() > 24 * 60 * 60 * 1000;

      if (isExpired) {
        await prisma.passwordResetRequest.update({
          where: { id: existingRequest.id },
          data: {
            status: 'EXPIRED',
            adminNotes: 'Otomatis kedaluwarsa setelah lebih dari 24 jam.'
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'Permintaan reset password Anda sedang diproses oleh Admin. Mohon tunggu konfirmasi Admin.'
        });
      }
    }

    // Create password reset request
    const result = await prisma.passwordResetRequest.create({
      data: {
        userId: user.id,
        email: user.username,
        reason: reason,
        status: 'PENDING'
      }
    });

    // Create In-App Notification ONCE with structured type & reference
    await prisma.notification.create({
      data: {
        title: 'Permintaan Reset Password',
        message: `User ${user.name} (${user.username}) meminta reset password. Alasan: ${reason}`,
        type: 'AUTH',
        targetRole: 'ADMIN',
        actionType: 'PASSWORD_RESET',
        actionId: result.id
      }
    });

    // Send email notification to admins in background without blocking
    (async () => {
      try {
        const admins = await prisma.user.findMany({
          where: {
            role: { in: ['ADMIN', 'SUPER_ADMIN'] },
            deletedAt: null
          }
        });

        for (const admin of admins) {
          await sendPasswordResetNotification(
            admin.username,
            user,
            reason,
            result.id
          );
        }
      } catch (emailErr) {
        console.error('Non-critical: error sending admin notification email:', emailErr.message);
      }
    })();

    return res.status(200).json({
      success: true,
      message: 'Permintaan reset password telah dikirim ke Admin. Silakan tunggu konfirmasi Admin.',
      requestId: result.id
    });
  } catch (error) {
    console.error('Error submitting password reset request:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat memproses permintaan reset password'
    });
  }
};

// 2. Admin get pending requests
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await prisma.passwordResetRequest.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedRequests = requests.map(req => ({
      id: req.id,
      user_id: req.userId,
      user_name: req.user.name,
      user_email: req.user.username,
      role: normalizeRole(req.user.role),
      raw_role: req.user.role,
      reason: req.reason,
      status: req.status,
      created_at: req.createdAt
    }));

    res.status(200).json({
      success: true,
      data: formattedRequests,
      count: formattedRequests.length
    });
  } catch (error) {
    console.error('Error getting pending requests:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan'
    });
  }
};

exports.verifyAndResetPassword = async (req, res) => {
  try {
    const { requestId, username, userId, isApproved, notes } = req.body;
    const adminId = req.user.id; // from auth middleware
    const actorRole = normalizeRole(req.user.role);

    if (!requestId && !username && !userId) {
      return res.status(400).json({
        success: false,
        message: 'requestId atau username atau userId diperlukan'
      });
    }

    let request = null;
    let targetUser = null;

    if (requestId) {
      request = await prisma.passwordResetRequest.findUnique({
        where: { id: requestId },
        include: { user: true }
      });
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request tidak ditemukan'
        });
      }
      targetUser = request.user;
    } else {
      targetUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(username ? [{ username: (username || '').trim() }] : []),
            ...(userId ? [{ id: userId }] : [])
          ],
          deletedAt: null
        }
      });

      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: 'Pengguna target tidak ditemukan'
        });
      }

      // Cari permintaan PENDING jika ada
      request = await prisma.passwordResetRequest.findFirst({
        where: { userId: targetUser.id, status: 'PENDING' },
        include: { user: true }
      });
    }

    const targetUserRole = normalizeRole(targetUser.role);

    // Batasan ADMIN: dilarang mereset password akun PENGAWAS, ADMIN, atau SUPER_ADMIN
    if (actorRole === 'ADMIN') {
      if (targetUserRole !== 'AMT') {
        // Catat ke AuditLog upaya pelanggaran
        await prisma.auditLog.create({
          data: {
            userId: adminId,
            action: 'USER_PASSWORD_RESET_REJECTED_UNAUTHORIZED',
            actionType: 'SECURITY',
            actionId: targetUser.id,
            details: JSON.stringify({
              actorRole,
              targetUsername: targetUser.username,
              targetRole: targetUser.role,
              reason: 'Admin dilarang mereset password akun administratif'
            })
          }
        }).catch(() => {});

        return res.status(403).json({
          success: false,
          error: `Akses ditolak: Admin tidak diizinkan mereset password akun administratif (${targetUser.role}). Hanya Super Admin yang berwenang.`
        });
      }
    }

    if (isApproved) {
      // Generate password
      const tempPassword = generateSecurePassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Update user password
      await prisma.user.update({
        where: { id: request.userId },
        data: { password: hashedPassword }
      });

      // Update request status
      await prisma.passwordResetRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          resetByAdminId: adminId,
          adminNotes: notes,
          resetAt: new Date()
        }
      });

      // Get user for notification
      const user = await prisma.user.findUnique({
        where: { id: request.userId }
      });

      // Reset login failure attempts for this user now that password was reset
      if (user) {
        await LoginAttemptService.resetFailedAttempts(user.username);
      }

      // Mark corresponding notification as read
      await prisma.notification.updateMany({
        where: {
          type: 'AUTH',
          actionType: 'PASSWORD_RESET',
          actionId: requestId
        },
        data: { isRead: true }
      });

      // Send email to user (optional background)
      try {
        await sendPasswordResetCompletedEmail(
          user.username,
          user.name,
          tempPassword
        );
      } catch (mailErr) {
        console.error('Non-critical: error sending completion email:', mailErr.message);
      }

      // Catat ke AuditLog
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'USER_PASSWORD_RESET_APPROVED',
          actionType: 'USER_MANAGEMENT',
          actionId: request.userId,
          details: JSON.stringify({
            actorRole,
            targetUsername: request.user.username,
            targetRole: request.user.role,
            isApproved: true
          })
        }
      }).catch(() => {});

      return res.status(200).json({
        success: true,
        message: 'Password berhasil direset',
        data: {
          userId: user.id,
          userEmail: user.username,
          userName: user.name,
          newPassword: tempPassword
        }
      });
    } else {
      // Reject
      await prisma.passwordResetRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          resetByAdminId: adminId,
          adminNotes: notes,
          resetAt: new Date()
        }
      });

      // Mark corresponding notification as read
      await prisma.notification.updateMany({
        where: {
          type: 'AUTH',
          actionType: 'PASSWORD_RESET',
          actionId: requestId
        },
        data: { isRead: true }
      });

      // Catat ke AuditLog
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'USER_PASSWORD_RESET_REJECTED',
          actionType: 'USER_MANAGEMENT',
          actionId: request.userId,
          details: JSON.stringify({
            actorRole,
            targetUsername: request.user.username,
            targetRole: request.user.role,
            isApproved: false
          })
        }
      }).catch(() => {});

      return res.status(200).json({
        success: true,
        message: 'Permintaan ditolak'
      });
    }
  } catch (error) {
    console.error('Error verifying and resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan'
    });
  }
};

// Helper
function generateSecurePassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
