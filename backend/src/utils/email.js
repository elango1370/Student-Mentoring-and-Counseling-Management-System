/**
 * Transactional email via Brevo (https://www.brevo.com).
 *
 * Why the HTTPS API and not Brevo's SMTP relay: Render's free web services
 * block outbound SMTP (ports 25/465/587), so an SMTP transport would time out
 * in production. Brevo's REST API runs over port 443, which is never blocked,
 * and needs no extra dependency (Node 18+ ships a global fetch).
 *
 * Required environment variables:
 *   BREVO_API_KEY    API key from Brevo → SMTP & API → API Keys (starts "xkeysib-")
 *   EMAIL_FROM       A sender address you have verified in Brevo → Senders & IP
 * Optional:
 *   EMAIL_FROM_NAME  Display name shown to recipients (default "SMCMS")
 *
 * When the key/sender are missing the email is printed to the console in
 * development, so the app is still usable without any email account.
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const REQUEST_TIMEOUT_MS = 10_000;

let warnedNotConfigured = false;

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getConfig = () => {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  const senderEmail = (process.env.EMAIL_FROM || '').trim();
  const senderName = (process.env.EMAIL_FROM_NAME || 'SMCMS').trim();
  return { apiKey, senderEmail, senderName, configured: Boolean(apiKey && senderEmail) };
};

/**
 * Sends an email through Brevo, or logs it when Brevo isn't configured.
 * Never throws: a mail failure must not break the caller's request (this
 * matters most for forgot-password, which always returns a generic success
 * response regardless of what actually happened).
 *
 * Resolves to { delivered: boolean, mode: 'brevo' | 'console' | 'not-configured' | 'brevo-error', messageId? }
 */
export const sendEmail = async ({ to, toName, subject, html, text }) => {
  const { apiKey, senderEmail, senderName, configured } = getConfig();

  if (!configured) {
    if (!warnedNotConfigured) {
      console.warn('[email] BREVO_API_KEY / EMAIL_FROM are not set, so no email will be delivered.');
      warnedNotConfigured = true;
    }
    if (process.env.NODE_ENV === 'production') {
      // Never write reset/verification links to production logs.
      return { delivered: false, mode: 'not-configured' };
    }
    console.log(`[email:dev] To: ${to}\nSubject: ${subject}\n\n${text || html}`);
    return { delivered: false, mode: 'console' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [toName ? { email: to, name: toName } : { email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: controller.signal,
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      const hint =
        response.status === 401
          ? ' (check BREVO_API_KEY)'
          : response.status === 400
            ? ' (check that EMAIL_FROM is a verified sender in Brevo)'
            : '';
      console.error(`[email] Brevo rejected the request: ${response.status} ${body.message || ''}${hint}`);
      return { delivered: false, mode: 'brevo-error' };
    }

    return { delivered: true, mode: 'brevo', messageId: body.messageId };
  } catch (err) {
    const reason = err.name === 'AbortError' ? `timed out after ${REQUEST_TIMEOUT_MS}ms` : err.message;
    console.error('[email] Failed to reach Brevo:', reason);
    return { delivered: false, mode: 'brevo-error' };
  } finally {
    clearTimeout(timer);
  }
};

const buttonEmail = ({ heading, name, intro, expiry, buttonLabel, url, footnote }) => {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(url);
  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;color:#1f2937">
      <h2 style="color:#4f46e5">${heading}</h2>
      <p>Hi ${safeName},</p>
      <p>${intro} This link expires in <strong>${expiry}</strong>${expiry === '15 minutes' ? ' and can only be used once' : ''}.</p>
      <p style="margin:24px 0">
        <a href="${safeUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">${buttonLabel}</a>
      </p>
      <p style="font-size:13px;color:#6b7280">If the button doesn't work, copy this link into your browser:<br>${safeUrl}</p>
      <p style="font-size:13px;color:#6b7280">${footnote}</p>
    </div>
  `;
};

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const subject = 'Reset your SMCMS password';
  const text = `Hi ${name},\n\nWe received a request to reset your SMCMS password. This link expires in 15 minutes and can only be used once:\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`;
  const html = buttonEmail({
    heading: 'Reset your password',
    name,
    intro: 'We received a request to reset your SMCMS password.',
    expiry: '15 minutes',
    buttonLabel: 'Reset password',
    url: resetUrl,
    footnote: "If you didn't request this, you can safely ignore this email — your password will not change.",
  });
  return sendEmail({ to, toName: name, subject, html, text });
};

export const sendVerificationEmail = async ({ to, name, verifyUrl }) => {
  const subject = 'Verify your SMCMS email address';
  const text = `Hi ${name},\n\nPlease verify your email address to activate your SMCMS account. This link expires in 24 hours:\n\n${verifyUrl}\n\nIf you didn't create this account, you can safely ignore this email.`;
  const html = buttonEmail({
    heading: 'Verify your email',
    name,
    intro: 'Please confirm your email address to activate your SMCMS account.',
    expiry: '24 hours',
    buttonLabel: 'Verify email',
    url: verifyUrl,
    footnote: "If you didn't create this account, you can safely ignore this email.",
  });
  return sendEmail({ to, toName: name, subject, html, text });
};

export default sendEmail;
