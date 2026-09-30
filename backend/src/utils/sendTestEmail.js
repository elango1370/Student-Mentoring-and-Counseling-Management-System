// Usage: npm run email:test -- you@example.com
// Sends one real email through Brevo so you can confirm your setup works.
import 'dotenv/config';
import { sendEmail } from './email.js';

const to = process.argv[2];
if (!to) {
  console.error('Usage: npm run email:test -- recipient@example.com');
  process.exit(1);
}

const result = await sendEmail({
  to,
  subject: 'SMCMS test email',
  text: 'If you can read this, Brevo is configured correctly for SMCMS.',
  html: '<p>If you can read this, <strong>Brevo is configured correctly</strong> for SMCMS.</p>',
});

console.log(result);
process.exit(result.delivered ? 0 : 1);
