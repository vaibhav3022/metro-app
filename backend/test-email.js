const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'dhotrev384@gmail.com', pass: 'uqvjsavnkzrxreen' }
});

async function testMail() {
  try {
    console.log("Testing email connection...");
    let info = await transporter.sendMail({
      from: '"Pune Metro" <dhotrev384@gmail.com>',
      to: 'dhotrev384@gmail.com',
      subject: 'Test Email',
      text: 'This is a test email'
    });
    console.log("Email sent successfully!", info.messageId);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

testMail();
