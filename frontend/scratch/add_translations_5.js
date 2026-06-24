const fs = require('fs');

const enPath = '../src/i18n/locales/en.json';
const mrPath = '../src/i18n/locales/mr.json';
const hiPath = '../src/i18n/locales/hi.json';

const en = JSON.parse(fs.readFileSync(enPath));
const mr = JSON.parse(fs.readFileSync(mrPath));
const hi = JSON.parse(fs.readFileSync(hiPath));

const newKeys = {
  fare: {
    noDetails: { en: "No booking details found.", mr: "बुकिंग तपशील आढळले नाहीत.", hi: "कोई बुकिंग विवरण नहीं मिला।" },
    goBack: { en: "Go Back", mr: "मागे जा", hi: "वापस जाएं" },
    generatingTicket: { en: "Generating your digital QR ticket...", mr: "तुमचे डिजिटल QR तिकीट तयार करत आहे...", hi: "आपका डिजिटल क्यूआर टिकट जनरेट हो रहा है..." },
    initiatingTransaction: { en: "Initiating secure transaction...", mr: "सुरक्षित व्यवहार सुरू करत आहे...", hi: "सुरक्षित लेनदेन शुरू किया जा रहा है..." },
    fareBreakdown: { en: "Fare Breakdown", mr: "भाडे तपशील", hi: "किराया विवरण" },
    journeyDetails: { en: "Journey Details", mr: "प्रवासाचे तपशील", hi: "यात्रा विवरण" },
    source: { en: "Source", mr: "मूळ स्थानक", hi: "स्रोत" },
    destination: { en: "Destination", mr: "गंतव्यस्थान", hi: "गंतव्य" },
    fareCalculation: { en: "Fare Calculation", mr: "भाडे गणना", hi: "किराया गणना" },
    farePerPassenger: { en: "Fare (Per Passenger)", mr: "भाडे (प्रति प्रवासी)", hi: "किराया (प्रति यात्री)" },
    discountApplied: { en: "Discount Applied", mr: "सवलत लागू", hi: "छूट लागू" },
    totalPassengers: { en: "Total Passengers", mr: "एकूण प्रवासी", hi: "कुल यात्री" },
    totalPayable: { en: "Total Payable", mr: "एकूण देय", hi: "कुल देय" },
    payNow: { en: "Pay Now", mr: "आता पैसे द्या", hi: "अब भुगतान करें" },
    alert: {
      noticeTitle: { en: "Notice", mr: "सूचना", hi: "सूचना" },
      paymentReceived: { en: "Payment received. Checking ticket status...", mr: "पेमेंट प्राप्त झाले. तिकीट स्थिती तपासत आहे...", hi: "भुगतान प्राप्त हुआ। टिकट की स्थिति की जांच हो रही है..." },
      errorTitle: { en: "Error", mr: "त्रुटी", hi: "त्रुटि" },
      failedTicket: { en: "Failed to generate ticket after payment.", mr: "पेमेंटनंतर तिकीट तयार करण्यात अयशस्वी.", hi: "भुगतान के बाद टिकट जनरेट करने में विफल।" }
    }
  },
  scan: {
    title: { en: "Scan & Pay", mr: "स्कॅन आणि पे", hi: "स्कैन एंड पे" },
    alignQR: { en: "Align QR code within the frame", mr: "QR कोड फ्रेममध्ये अलाइन करा", hi: "फ़्रेम के भीतर क्यूआर कोड को संरेखित करें" },
    unknownMerchant: { en: "Unknown Merchant", mr: "अज्ञात व्यापारी", hi: "अज्ञात व्यापारी" },
    merchantId: { en: "ID:", mr: "आयडी (ID):", hi: "आईडी (ID):" },
    payWithRazorpay: { en: "Pay with Razorpay", mr: "Razorpay द्वारे पैसे द्या", hi: "Razorpay से भुगतान करें" },
    payWithWallet: { en: "Pay with Wallet", mr: "वॉलेटद्वारे पैसे द्या", hi: "वॉलेट से भुगतान करें" },
    cancel: { en: "Cancel", mr: "रद्द करा", hi: "रद्द करें" },
    successTitle: { en: "Payment Successful!", mr: "पेमेंट यशस्वी!", hi: "भुगतान सफल!" },
    paidTo: { en: "Paid to {{merchant}}", mr: "{{merchant}} ला पैसे दिले", hi: "{{merchant}} को भुगतान किया गया" },
    method: { en: "Method:", mr: "पद्धत:", hi: "विधि:" },
    date: { en: "Date:", mr: "तारीख:", hi: "दिनांक:" },
    backToDashboard: { en: "Back to Dashboard", mr: "डॅशबोर्डवर परत जा", hi: "डैशबोर्ड पर वापस जाएं" },
    alert: {
      invalidTitle: { en: "Invalid QR", mr: "अवैध QR", hi: "अमान्य क्यूआर" },
      invalidDesc: { en: "This is not a valid merchant QR code.", mr: "हा वैध व्यापारी QR कोड नाही.", hi: "यह एक वैध मर्चेंट क्यूआर कोड नहीं है।" },
      tryAgain: { en: "Try Again", mr: "पुन्हा प्रयत्न करा", hi: "पुनः प्रयास करें" },
      scanFailedTitle: { en: "Scan Failed", mr: "स्कॅन अयशस्वी", hi: "स्कैन विफल" },
      scanFailedDesc: { en: "Could not read the QR code. Please try again.", mr: "QR कोड वाचू शकलो नाही. कृपया पुन्हा प्रयत्न करा.", hi: "क्यूआर कोड नहीं पढ़ सका। कृपया पुनः प्रयास करें।" },
      errorTitle: { en: "Error", mr: "त्रुटी", hi: "त्रुटि" },
      invalidAmount: { en: "Please enter a valid amount.", mr: "कृपया वैध रक्कम प्रविष्ट करा.", hi: "कृपया एक वैध राशि दर्ज करें।" },
      paymentCancelledTitle: { en: "Payment Cancelled", mr: "पेमेंट रद्द केले", hi: "भुगतान रद्द" },
      paymentCancelledDesc: { en: "You cancelled the payment.", mr: "तुम्ही पेमेंट रद्द केले.", hi: "आपने भुगतान रद्द कर दिया।" },
      paymentFailedTitle: { en: "Payment Failed", mr: "पेमेंट अयशस्वी", hi: "भुगतान विफल" },
      somethingWentWrong: { en: "Something went wrong. Please try again.", mr: "काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.", hi: "कुछ गलत हो गया। कृपया पुनः प्रयास करें।" },
      walletFailed: { en: "Could not process wallet payment. Please check your balance.", mr: "वॉलेट पेमेंटवर प्रक्रिया करू शकलो नाही. कृपया तुमची शिल्लक तपासा.", hi: "वॉलेट भुगतान संसाधित नहीं कर सका। कृपया अपना शेष जांचें।" }
    }
  },
  notifications: {
    title: { en: "Notifications", mr: "सूचना", hi: "सूचनाएं" },
    noNew: { en: "No New Notifications", mr: "कोणत्याही नवीन सूचना नाहीत", hi: "कोई नई सूचना नहीं" },
    caughtUp: { en: "You're all caught up!", mr: "तुमच्याकडे सर्व अद्यतने आहेत!", hi: "आपने सब कुछ देख लिया है!" }
  }
};

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

if(!en.fare) en.fare = {};
if(!mr.fare) mr.fare = {};
if(!hi.fare) hi.fare = {};

if(!en.scan) en.scan = {};
if(!mr.scan) mr.scan = {};
if(!hi.scan) hi.scan = {};

if(!en.notifications) en.notifications = {};
if(!mr.notifications) mr.notifications = {};
if(!hi.notifications) hi.notifications = {};

mergeKeys(en.fare, newKeys.fare, 'en');
mergeKeys(mr.fare, newKeys.fare, 'mr');
mergeKeys(hi.fare, newKeys.fare, 'hi');

mergeKeys(en.scan, newKeys.scan, 'en');
mergeKeys(mr.scan, newKeys.scan, 'mr');
mergeKeys(hi.scan, newKeys.scan, 'hi');

mergeKeys(en.notifications, newKeys.notifications, 'en');
mergeKeys(mr.notifications, newKeys.notifications, 'mr');
mergeKeys(hi.notifications, newKeys.notifications, 'hi');

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(mrPath, JSON.stringify(mr, null, 2) + '\n');
fs.writeFileSync(hiPath, JSON.stringify(hi, null, 2) + '\n');
console.log("Translation keys added successfully.");
