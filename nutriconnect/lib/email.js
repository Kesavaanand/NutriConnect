// Sends email through Brevo's HTTPS API (free plan: 300 emails/day, no time limit).
// Brevo is used instead of Gmail SMTP because Render's free plan blocks SMTP ports (25/465/587).
// Without BREVO_API_KEY the email is printed in the server terminal instead (handy for local testing).

export const emailConfigured = () => Boolean(process.env.BREVO_API_KEY && process.env.EMAIL_FROM);

export async function sendEmail({ to, toName, subject, html, text }) {
  if (!emailConfigured()) {
    console.log(`\n📧 [EMAIL NOT CONFIGURED — showing it here instead]\nTo: ${to}\nSubject: ${subject}\n${text}\n`);
    return { delivered: false, dev: true };
  }
  const res = await fetch(process.env.BREVO_API_URL || 'https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: process.env.EMAIL_FROM_NAME || 'NutriConnect', email: process.env.EMAIL_FROM },
      to: [{ email: to, name: toName || to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('Brevo email failed', res.status, body);
    throw new Error('We could not send the email right now. Please try again in a minute.');
  }
  return { delivered: true };
}

const layout = (title, body) => `
<div style="font-family:Arial,Helvetica,sans-serif;background:#f6f5f0;padding:24px">
  <div style="max-width:480px;margin:auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #e5e7eb">
    <p style="margin:0 0 16px;font-size:20px;font-weight:bold;color:#10231b">Nutri<span style="color:#1a7d53">Connect</span></p>
    <h2 style="margin:0 0 12px;font-size:18px;color:#10231b">${title}</h2>
    ${body}
    <p style="margin-top:24px;font-size:12px;color:#94a3b8">If you didn't request this, you can ignore this email.</p>
  </div>
</div>`;

export function otpEmail(name, code) {
  return {
    subject: `Your NutriConnect verification code: ${code}`,
    text: `Hi ${name},\n\nYour NutriConnect verification code is ${code}. It expires in 10 minutes.\n`,
    html: layout('Verify your email', `
      <p style="color:#475569">Hi ${name}, use this code to verify your email address:</p>
      <p style="font-size:34px;letter-spacing:8px;font-weight:bold;color:#1a7d53;margin:16px 0">${code}</p>
      <p style="color:#475569">The code expires in <b>10 minutes</b>.</p>`),
  };
}

export function resetEmail(name, link) {
  return {
    subject: 'Reset your NutriConnect password',
    text: `Hi ${name},\n\nOpen this link to set a new password (valid for 30 minutes):\n${link}\n`,
    html: layout('Reset your password', `
      <p style="color:#475569">Hi ${name}, click the button to choose a new password. The link is valid for <b>30 minutes</b> and works once.</p>
      <p style="margin:20px 0"><a href="${link}" style="background:#1a7d53;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;display:inline-block">Set a new password</a></p>
      <p style="font-size:12px;color:#94a3b8;word-break:break-all">Or copy this link: ${link}</p>`),
  };
}
