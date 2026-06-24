const fs = require('fs');

const en = require('../src/i18n/locales/en.json');
const mr = require('../src/i18n/locales/mr.json');
const hi = require('../src/i18n/locales/hi.json');

const newKeys = {
  shops: {
    title: { en: "Station Shops", mr: "स्थानक दुकाने", hi: "स्टेशन की दुकानें" },
    retail: { en: "Retail", mr: "किरकोळ", hi: "खुदरा" },
    noEmail: { en: "No email", mr: "ईमेल नाही", hi: "ईमेल नहीं" },
    metroStation: { en: "Metro Station", mr: "मेट्रो स्थानक", hi: "मेट्रो स्टेशन" },
    pay: { en: "Pay", mr: "पे करा", hi: "भुगतान करें" },
    scan: { en: "Scan", mr: "स्कॅन करा", hi: "स्कैन करें" },
    searchPlaceholder: { en: "Search by shop name or station...", mr: "दुकानाचे नाव किंवा स्थानकाने शोधा...", hi: "दुकान के नाम या स्टेशन से खोजें..." },
    noShops: { en: "No shops found.", mr: "कोणतीही दुकाने आढळली नाहीत.", hi: "कोई दुकानें नहीं मिलीं।" },
    retailStore: { en: "Retail Store", mr: "किरकोळ दुकान", hi: "खुदरा स्टोर" },
    insideMetro: { en: "Inside Metro Station", mr: "मेट्रो स्थानकाच्या आत", hi: "मेट्रो स्टेशन के अंदर" },
    contactUnavail: { en: "Contact unavailable", mr: "संपर्क उपलब्ध नाही", hi: "संपर्क उपलब्ध नहीं" },
    openHours: { en: "Open: 08:00 AM - 10:00 PM", mr: "वेळ: सकाळी ०८:०० - रात्री १०:००", hi: "समय: सुबह ०८:०० - रात १०:००" },
    aboutShop: { en: "About the Shop", mr: "दुकानाबद्दल", hi: "दुकान के बारे में" },
    welcomeDesc: { en: "Welcome to {{name}}! We provide top quality products and services to metro passengers. Visit us for an excellent experience right inside the station.", mr: "{{name}} मध्ये आपले स्वागत आहे! आम्ही मेट्रो प्रवाशांना उत्तम दर्जाची उत्पादने आणि सेवा देतो.", hi: "{{name}} में आपका स्वागत है! हम मेट्रो यात्रियों को उच्च गुणवत्ता वाले उत्पाद और सेवाएं प्रदान करते हैं।" },
    payBill: { en: "Pay Bill", mr: "बिल पे करा", hi: "बिल का भुगतान करें" },
    scanQr: { en: "Scan QR", mr: "क्यूआर स्कॅन करा", hi: "क्यूआर स्कैन करें" }
  }
};

for (const section in newKeys) {
  if (!en[section]) en[section] = {};
  if (!mr[section]) mr[section] = {};
  if (!hi[section]) hi[section] = {};
  
  for (const key in newKeys[section]) {
    en[section][key] = newKeys[section][key].en;
    mr[section][key] = newKeys[section][key].mr;
    hi[section][key] = newKeys[section][key].hi;
  }
}

fs.writeFileSync('../src/i18n/locales/en.json', JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync('../src/i18n/locales/mr.json', JSON.stringify(mr, null, 2) + '\n');
fs.writeFileSync('../src/i18n/locales/hi.json', JSON.stringify(hi, null, 2) + '\n');
console.log("Translation keys added successfully.");
