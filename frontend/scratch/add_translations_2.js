const fs = require('fs');

const enPath = '../src/i18n/locales/en.json';
const mrPath = '../src/i18n/locales/mr.json';
const hiPath = '../src/i18n/locales/hi.json';

const en = JSON.parse(fs.readFileSync(enPath));
const mr = JSON.parse(fs.readFileSync(mrPath));
const hi = JSON.parse(fs.readFileSync(hiPath));

const newKeys = {
  smartcard: {
    title: { en: "Digital Smart Card", mr: "डिजिटल स्मार्ट कार्ड", hi: "डिजिटल स्मार्ट कार्ड" },
    onePune: { en: "ONE PUNE", mr: "वन पुणे", hi: "वन पुणे" },
    subtitle: { en: "Metro Smart Card", mr: "मेट्रो स्मार्ट कार्ड", hi: "मेट्रो स्मार्ट कार्ड" },
    ncmc: { en: "NCMC", mr: "एनसीएमसी (NCMC)", hi: "एनसीएमसी (NCMC)" },
    inTransit: { en: "IN TRANSIT", mr: "प्रवासात", hi: "पारगमन में" },
    cardholder: { en: "CARDHOLDER", mr: "कार्डधारक", hi: "कार्डधारक" },
    balance: { en: "BALANCE", mr: "शिल्लक", hi: "शेष" },
    cvv: { en: "CVV", mr: "CVV", hi: "CVV" },
    instructions: { en: "For entry/exit scan at AFC gates. Property of Pune Metro.", mr: "AFC गेट्सवर प्रवेश/बाहेर पडताना स्कॅनसाठी. पुणे मेट्रोची मालमत्ता.", hi: "एएफसी गेट्स पर प्रवेश/निकास स्कैन के लिए। पुणे मेट्रो की संपत्ति।" },
    helpline: { en: "Helpline: 1800 270 5555", mr: "हेल्पलाइन: 1800 270 5555", hi: "हेल्पलाइन: 1800 270 5555" },
    hintText: { en: "Tap card to flip and view Back/Front", mr: "कार्ड उलटण्यासाठी आणि मागे/पुढे पाहण्यासाठी टॅप करा", hi: "कार्ड को पलटने और आगे/पीछे देखने के लिए टैप करें" },
    simulatorTitle: { en: "AFC Gate Simulator", mr: "AFC गेट सिम्युलेटर", hi: "एएफसी गेट सिम्युलेटर" },
    simulatorDesc: { en: "Use this to simulate scanning your digital smart card at entry/exit gates of Pune Metro.", mr: "पुणे मेट्रोच्या प्रवेश/बाहेर पडण्याच्या गेट्सवर तुमचे डिजिटल स्मार्ट कार्ड स्कॅन करण्याचे सिम्युलेट करण्यासाठी याचा वापर करा.", hi: "पुणे मेट्रो के प्रवेश/निकास गेट्स पर अपने डिजिटल स्मार्ट कार्ड को स्कैन करने का अनुकरण करने के लिए इसका उपयोग करें।" },
    scanning: { en: "SCANNING CARD...", mr: "कार्ड स्कॅन करत आहे...", hi: "कार्ड स्कैन हो रहा है..." },
    tapToEnter: { en: "TAP TO ENTER STATION", mr: "स्थानकात प्रवेश करण्यासाठी टॅप करा", hi: "स्टेशन में प्रवेश करने के लिए टैप करें" },
    tapToExit: { en: "TAP TO EXIT STATION", mr: "स्थानकातून बाहेर पडण्यासाठी टॅप करा", hi: "स्टेशन से बाहर निकलने के लिए टैप करें" },
    statusIdle: { en: "Status: Idle. Tap to enter at PMC Station.", mr: "स्थिती: निष्क्रिय. PMC स्थानकात प्रवेश करण्यासाठी टॅप करा.", hi: "स्थिति: निष्क्रिय। पीएमसी स्टेशन पर प्रवेश करने के लिए टैप करें।" },
    statusInTransit: { en: "Status: In Transit. Entered at {{station}} station. Tap to exit at District Court.", mr: "स्थिती: प्रवासात. {{station}} स्थानकातून प्रवेश केला. जिल्हा न्यायालय येथे बाहेर पडण्यासाठी टॅप करा.", hi: "स्थिति: पारगमन में। {{station}} स्टेशन से प्रवेश किया। जिला न्यायालय में बाहर निकलने के लिए टैप करें।" },
    alert: {
      insufficientTitle: { en: "Insufficient Balance", mr: "अपुरी शिल्लक", hi: "अपर्याप्त शेष" },
      insufficientDesc: { en: "Minimum balance of ₹20 is required to enter the metro station. Please recharge your card.", mr: "मेट्रो स्थानकात प्रवेश करण्यासाठी किमान ₹२० ची शिल्लक आवश्यक आहे. कृपया तुमचे कार्ड रिचार्ज करा.", hi: "मेट्रो स्टेशन में प्रवेश करने के लिए न्यूनतम ₹20 शेष राशि आवश्यक है। कृपया अपना कार्ड रिचार्ज करें।" },
      entrySuccessTitle: { en: "Gate Entry Successful", mr: "गेट प्रवेश यशस्वी", hi: "गेट प्रवेश सफल" },
      entrySuccessDesc: { en: "Scan Success at Pune Municipal Corporation (PMC) station.\n\nGate Open. Happy Journey!", mr: "पुणे महानगरपालिका (PMC) स्थानकावर स्कॅन यशस्वी.\n\nगेट उघडे आहे. प्रवासासाठी शुभेच्छा!", hi: "पुणे नगर निगम (पीएमसी) स्टेशन पर स्कैन सफल।\n\nगेट खुला है। सुखद यात्रा!" },
      exitSuccessTitle: { en: "Gate Exit Successful", mr: "गेटून बाहेर पडणे यशस्वी", hi: "गेट से बाहर निकलना सफल" },
      exitSuccessDesc: { en: "Scan Success at District Court station.\n\nJourney: PMC → District Court\nFare Deducted: ₹{{fare}}\nRemaining Balance: ₹{{newBalance}}\n\nThank you for travelling with Pune Metro!", mr: "जिल्हा न्यायालय स्थानकावर स्कॅन यशस्वी.\n\nप्रवास: PMC → जिल्हा न्यायालय\nभाडे कापले: ₹{{fare}}\nउर्वरित शिल्लक: ₹{{newBalance}}\n\nपुणे मेट्रोने प्रवास केल्याबद्दल धन्यवाद!", hi: "जिला न्यायालय स्टेशन पर स्कैन सफल।\n\nयात्रा: पीएमसी → जिला न्यायालय\nकिराया कटा: ₹{{fare}}\nशेष राशि: ₹{{newBalance}}\n\nपुणे मेट्रो के साथ यात्रा करने के लिए धन्यवाद!" }
    }
  },
  help: {
    title: { en: "Help & Support", mr: "मदत आणि सपोर्ट", hi: "मदद और समर्थन" },
    newTicket: { en: "New Ticket", mr: "नवीन तिकीट", hi: "नया टिकट" },
    myTickets: { en: "My Tickets", mr: "माझी तिकिटे", hi: "मेरे टिकट" },
    howCanWeHelp: { en: "How can we help you?", mr: "आम्ही तुम्हाला कशी मदत करू शकतो?", hi: "हम आपकी कैसे मदद कर सकते हैं?" },
    selectCategory: { en: "Select Category", mr: "श्रेणी निवडा", hi: "श्रेणी चुनें" },
    description: { en: "Description", mr: "वर्णन", hi: "विवरण" },
    descriptionPlaceholder: { en: "Describe your issue, suggestion, or what you lost in detail...", mr: "तुमची समस्या, सूचना किंवा तुम्ही काय गमावले याचे सविस्तर वर्णन करा...", hi: "अपनी समस्या, सुझाव, या जो आपने खोया है उसका विस्तार से वर्णन करें..." },
    submitTicket: { en: "Submit Ticket", mr: "तिकीट सबमिट करा", hi: "टिकट सबमिट करें" },
    noTickets: { en: "No support tickets found.", mr: "कोणतीही सपोर्ट तिकिटे आढळली नाहीत.", hi: "कोई समर्थन टिकट नहीं मिला।" },
    pending: { en: "Pending", mr: "प्रलंबित", hi: "लंबित" },
    categories: {
      grievance: { en: "Grievance", mr: "तक्रार", hi: "शिकायत" },
      lostFound: { en: "Lost & Found", mr: "हरवलेले आणि सापडलेले", hi: "खोया और पाया" },
      suggestion: { en: "Suggestion", mr: "सूचना", hi: "सुझाव" },
      other: { en: "Other", mr: "इतर", hi: "अन्य" }
    },
    alert: {
      validation: { en: "Validation", mr: "प्रमाणीकरण", hi: "सत्यापन" },
      enterDesc: { en: "Please enter a description", mr: "कृपया वर्णन प्रविष्ट करा", hi: "कृपया विवरण दर्ज करें" },
      success: { en: "Success", mr: "यशस्वी", hi: "सफल" },
      submitted: { en: "Ticket Submitted Successfully", mr: "तिकीट यशस्वीरित्या सबमिट केले", hi: "टिकट सफलतापूर्वक सबमिट किया गया" },
      error: { en: "Error", mr: "त्रुटी", hi: "त्रुटि" },
      failedSubmit: { en: "Failed to submit", mr: "सबमिट करण्यात अयशस्वी", hi: "सबमिट करने में विफल" },
      mockSubmit: { en: "Ticket Submitted! (Mock)", mr: "तिकीट सबमिट केले! (मॉक)", hi: "टिकट सबमिट किया गया! (मॉक)" }
    }
  }
};

for (const section in newKeys) {
  if (!en[section]) en[section] = {};
  if (!mr[section]) mr[section] = {};
  if (!hi[section]) hi[section] = {};
  
  for (const key in newKeys[section]) {
    if (typeof newKeys[section][key].en === 'object') {
      if (!en[section][key]) en[section][key] = {};
      if (!mr[section][key]) mr[section][key] = {};
      if (!hi[section][key]) hi[section][key] = {};
      for (const subKey in newKeys[section][key].en) {
        en[section][key][subKey] = newKeys[section][key][subKey]; // wait, actually object structure
      }
    }
  }
}

// Fixed merge logic
function mergeKeys(target, source, lang) {
  for (const key in source) {
    if (source[key][lang] !== undefined) {
      target[key] = source[key][lang];
    } else if (typeof source[key] === 'object') {
      if (!target[key]) target[key] = {};
      mergeKeys(target[key], source[key], lang);
    }
  }
}

mergeKeys(en.smartcard, newKeys.smartcard, 'en');
mergeKeys(mr.smartcard, newKeys.smartcard, 'mr');
mergeKeys(hi.smartcard, newKeys.smartcard, 'hi');

mergeKeys(en.help, newKeys.help, 'en');
mergeKeys(mr.help, newKeys.help, 'mr');
mergeKeys(hi.help, newKeys.help, 'hi');

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(mrPath, JSON.stringify(mr, null, 2) + '\n');
fs.writeFileSync(hiPath, JSON.stringify(hi, null, 2) + '\n');
console.log("Translation keys added successfully.");
