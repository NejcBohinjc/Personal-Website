require('dotenv').config();

const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

/* Health check */
app.get('/', (_req, res) => res.json({ status: 'ok' }));

/* ─── POST /api/contact ──────────────────────────────────────── */
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body ?? {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  /* Basic email format check */
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const safeMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;color:#1a1a1a">
      <h2 style="margin:0 0 24px;color:#00d4ff;font-size:20px">
        New message from your portfolio
      </h2>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:10px 0;color:#555;width:80px;vertical-align:top">
            <strong>Name</strong>
          </td>
          <td style="padding:10px 0">${name}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;color:#555;vertical-align:top">
            <strong>Email</strong>
          </td>
          <td style="padding:10px 0">
            <a href="mailto:${email}" style="color:#00d4ff">${email}</a>
          </td>
        </tr>
      </table>
      <hr style="border:none;border-top:1px solid #ddd;margin:20px 0">
      <p style="margin:0;line-height:1.7;white-space:pre-wrap">${safeMessage}</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from:    `"Portfolio" <${process.env.GMAIL_USER}>`,
      to:      'nbohinjc@gmail.com',
      replyTo: email,
      subject: `✉ Portfolio message from ${name}`,
      text:    `From: ${name} <${email}>\n\n${message}`,
      html,
    });

    console.log(`[${new Date().toISOString()}] Mail sent from ${name} <${email}>`);
    res.json({ success: true });

  } catch (err) {
    console.error(`[${new Date().toISOString()}] Mail error:`, err.message);
    res.status(500).json({ error: 'Failed to send email. Check server logs.' });
  }
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Portfolio backend running → http://localhost:${PORT}`);
});
