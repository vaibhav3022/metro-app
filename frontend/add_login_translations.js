const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'src', 'i18n', 'locales');
const langs = ['en', 'mr', 'hi'];

const updates = {
  en: {
    login: {
      loginBtn: "Login",
      sendOtpBtn: "Send OTP",
      adminAuthBtn: "Authenticate"
    }
  },
  mr: {
    login: {
      loginBtn: "लॉगिन",
      sendOtpBtn: "OTP पाठवा",
      adminAuthBtn: "प्रमाणित करा"
    }
  },
  hi: {
    login: {
      loginBtn: "लॉगिन करें",
      sendOtpBtn: "OTP भेजें",
      adminAuthBtn: "प्रमाणित करें"
    }
  }
};

langs.forEach(lang => {
  const filePath = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!data.login) data.login = {};
    Object.assign(data.login, updates[lang].login);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${lang}.json`);
  }
});
