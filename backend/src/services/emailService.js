const nodemailer = require('nodemailer');
const emailTemplates = require('./emailTemplates');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.sendPasswordResetNotification = async (adminEmail, user, reason, requestId) => {
  try {
    const html = emailTemplates.passwordResetNotification({
      adminName: 'Admin',
      userName: user.name,
      userEmail: user.username, // using username as email usually
      userPhone: user.jabatan || '-', 
      userRole: user.role,
      reason: reason,
      requestId: requestId
    });
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `🔔 Notifikasi: User ${user.name} Lupa Password`,
      html: html
    });
    
    await prisma.emailNotificationLog.create({
      data: {
        emailAddress: adminEmail,
        subject: `🔔 Notifikasi: User ${user.name} Lupa Password`,
        emailType: 'PASSWORD_RESET',
        emailStatus: 'SENT',
        sentAt: new Date()
      }
    });
    
    console.log(`✅ Password reset notification sent to ${adminEmail}`);
  } catch (error) {
    console.error('❌ Send notification error:', error);
  }
};

exports.sendPasswordResetCompletedEmail = async (userEmail, userName, newPassword) => {
  try {
    const html = emailTemplates.passwordResetCompleted({
      userName: userName,
      newPassword: newPassword
    });
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: '✅ Password Anda Telah Direset',
      html: html
    });
    
    await prisma.emailNotificationLog.create({
      data: {
        emailAddress: userEmail,
        subject: '✅ Password Anda Telah Direset',
        emailType: 'PASSWORD_RESET',
        emailStatus: 'SENT',
        sentAt: new Date()
      }
    });

    console.log(`✅ Password reset email sent to ${userEmail}`);
  } catch (error) {
    console.error('❌ Send email error:', error);
  }
};

exports.sendFindingReportEmail = async (adminEmail, finding, photoUrl) => {
  try {
    const html = emailTemplates.findingReportEmail({
      adminName: 'Admin',
      reporterName: finding.reporterName,
      reporterEmail: finding.reporterEmail,
      reporterPhone: finding.reporterPhone,
      location: finding.location,
      category: finding.category,
      description: finding.description,
      photoUrl: photoUrl,
      severity: finding.severity || 'MEDIUM',
      reportDate: finding.createdAt
    });
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `🚨 Laporan Baru: ${finding.category}`,
      html: html
    });
    
    await prisma.emailNotificationLog.create({
      data: {
        handoverId: finding.handoverId,
        emailAddress: adminEmail,
        subject: `🚨 Laporan Baru: ${finding.category}`,
        emailType: 'FINDING_REPORT',
        emailStatus: 'SENT',
        sentAt: new Date()
      }
    });

    console.log(`✅ Finding report email sent to ${adminEmail}`);
  } catch (error) {
    console.error('❌ Send finding email error:', error);
  }
};
