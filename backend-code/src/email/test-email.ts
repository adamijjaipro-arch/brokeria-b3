import 'dotenv/config';
import nodemailer from 'nodemailer';

async function testSMTP() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: '✅ Alvio Email Test',
      text: 'Si tu reçois ce message, SMTP fonctionne !',
      html: '<h1>✅ Test SMTP OK</h1><p>Alvio emails are working!</p>',
    });
    console.log('✅ Email envoyé :', info.messageId);
  } catch (err) {
    console.error('❌ Erreur SMTP :', err);
  }
}

testSMTP();
