// Sends the 6-digit "forgot password" code. Uses SMTP when SMTP_HOST is set
// (e.g. Gmail with an app password); without it, development servers print the
// code to the console and production refuses to send (returns null).
const nodemailer = require('nodemailer');

function createPasswordResetMailer(env = process.env) {
  if (!env.SMTP_HOST) {
    if (env.NODE_ENV === 'production') return null;
    return async ({ to, code }) => {
      console.log(`🔑 Password reset code for ${to}: ${code} (SMTP_HOST is not set, so it was not emailed)`);
    };
  }

  const port = Number(env.SMTP_PORT) || 587;
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  const from = env.MAIL_FROM || env.SMTP_USER;

  return async ({ to, code, minutes }) => {
    await transport.sendMail({
      from,
      to,
      subject: `รหัสรีเซ็ตรหัสผ่าน CalTrack: ${code}`,
      text: [
        `รหัสสำหรับตั้งรหัสผ่านใหม่ของคุณคือ ${code}`,
        `รหัสนี้ใช้ได้ ${minutes} นาที`,
        '',
        'ถ้าคุณไม่ได้ขอรีเซ็ตรหัสผ่าน ไม่ต้องทำอะไร รหัสผ่านเดิมยังใช้ได้ตามปกติ',
      ].join('\n'),
    });
  };
}

module.exports = { createPasswordResetMailer };
