const fs = require('fs');

const enPath = '../src/i18n/locales/en.json';
const mrPath = '../src/i18n/locales/mr.json';
const hiPath = '../src/i18n/locales/hi.json';

const en = JSON.parse(fs.readFileSync(enPath));
const mr = JSON.parse(fs.readFileSync(mrPath));
const hi = JSON.parse(fs.readFileSync(hiPath));

const newKeys = {
  feeder: {
    title: { en: "Feeder Services", mr: "फीडर सेवा", hi: "फीडर सेवाएं" },
    bannerTitle: { en: "Last Mile Connectivity", mr: "शेवटच्या टप्प्यापर्यंत कनेक्टिव्हिटी", hi: "लास्ट माइल कनेक्टिविटी" },
    bannerSubtitle: { en: "Pune Metro provides seamless feeder services to help you reach your final destination easily.", mr: "तुम्हाला तुमच्या अंतिम मुक्कामापर्यंत सहज पोहोचण्यासाठी पुणे मेट्रो उत्तम फीडर सेवा देते.", hi: "पुणे मेट्रो आपको आपके अंतिम गंतव्य तक आसानी से पहुंचने में मदद करने के लिए निर्बाध फीडर सेवाएं प्रदान करती है।" },
    availableServices: { en: "Available Services", mr: "उपलब्ध सेवा", hi: "उपलब्ध सेवाएं" },
    services: {
      pmpml: {
        title: { en: "PMPML Metro Shuttle", mr: "PMPML मेट्रो शटल", hi: "पीएमपीएमएल मेट्रो शटल" },
        desc: { en: "Frequent bus services available from major metro stations including Civil Court, Shivaji Nagar, and Swargate. Connect directly to IT parks and hubs.", mr: "सिव्हिल कोर्ट, शिवाजी नगर आणि स्वारगेट या प्रमुख मेट्रो स्थानकांवरून बस सेवा उपलब्ध. थेट आयटी पार्क आणि हबशी कनेक्ट करा.", hi: "सिविल कोर्ट, शिवाजी नगर और स्वारगेट सहित प्रमुख मेट्रो स्टेशनों से बार-बार बस सेवाएं उपलब्ध हैं। सीधे आईटी पार्क और हब से जुड़ें।" },
        button: { en: "View Bus Routes", mr: "बस मार्ग पहा", hi: "बस रूट देखें" }
      },
      ebike: {
        title: { en: "E-Bike Rentals", mr: "ई-बाईक भाड्याने", hi: "ई-बाइक रेंटल" },
        desc: { en: "Rent an E-bike from outside any metro station. Scan and unlock using partner apps to easily reach home or office.", mr: "कोणत्याही मेट्रो स्थानकाबाहेरून ई-बाईक भाड्याने घ्या. सहज घरी किंवा कार्यालयात पोहोचण्यासाठी भागीदार ॲप्स वापरून स्कॅन आणि अनलॉक करा.", hi: "किसी भी मेट्रो स्टेशन के बाहर से ई-बाइक किराए पर लें। घर या कार्यालय तक आसानी से पहुंचने के लिए पार्टनर ऐप का उपयोग करके स्कैन और अनलॉक करें।" },
        button: { en: "Find E-Bikes", mr: "ई-बाईक शोधा", hi: "ई-बाइक खोजें" }
      },
      cabs: {
        title: { en: "Partner Cabs/Autos", mr: "भागीदार कॅब/ऑटो", hi: "पार्टनर कैब/ऑटो" },
        desc: { en: "Prepaid and app-based autos and cabs are stationed directly at designated pick-up zones outside busy stations.", mr: "व्यस्त स्थानकाबाहेरील ठराविक पिक-अप झोनमध्ये प्रीपेड आणि ॲप-आधारित ऑटो आणि कॅब उपलब्ध आहेत.", hi: "व्यस्त स्टेशनों के बाहर निर्धारित पिक-अप जोन में प्रीपेड और ऐप-आधारित ऑटो और कैब उपलब्ध हैं।" },
        button: { en: "Book a Ride", mr: "राईड बुक करा", hi: "राइड बुक करें" }
      },
      evauto: {
        title: { en: "EV Auto", mr: "ईव्ही ऑटो", hi: "ईवी ऑटो" },
        desc: { en: "Shared & private EV Autos connecting you beyond metro limits. Popular routes: Ramwadi ↔ Phoenix Mall/Viman Nagar/Hadapsar, PCMC ↔ Nigdi.", mr: "मेट्रो मर्यादेपलीकडे जोडणारे सामायिक आणि खाजगी ईव्ही ऑटो. लोकप्रिय मार्ग: रामवाडी ↔ फिनिक्स मॉल/विमान नगर/हडपसर, PCMC ↔ निगडी.", hi: "मेट्रो सीमा से परे आपको जोड़ने वाले साझा और निजी ईवी ऑटो। लोकप्रिय मार्ग: रामवाड़ी ↔ फीनिक्स मॉल/विमान नगर/हडपसर, पीसीएमसी ↔ निगडी।" },
        button: { en: "Book EV Auto", mr: "ईव्ही ऑटो बुक करा", hi: "ईवी ऑटो बुक करें" }
      }
    }
  },
  tourist: {
    title: { en: "Tourist Places", mr: "पर्यटन स्थळे", hi: "पर्यटक स्थल" },
    bannerTitle: { en: "Explore Pune via Metro", mr: "मेट्रोने पुणे एक्सप्लोर करा", hi: "मेट्रो के माध्यम से पुणे का अन्वेषण करें" },
    bannerSubtitle: { en: "Beat the traffic and travel to historical landmarks easily.", mr: "रहदारी टाळा आणि ऐतिहासिक वास्तूंवर सहज प्रवास करा.", hi: "ट्रैफिक को मात दें और ऐतिहासिक स्थलों की आसानी से यात्रा करें।" },
    landmarks: { en: "Landmarks Near Stations", mr: "स्थानकांजवळील वास्तू", hi: "स्टेशनों के पास के स्थल" },
    getDirections: { en: "Get Directions", mr: "दिशा मिळवा", hi: "दिशा-निर्देश प्राप्त करें" },
    mapError: { en: "Could not open map", mr: "नकाशा उघडू शकलो नाही", hi: "नक्शा नहीं खुल सका" },
    places: {
      shaniwar_wada: {
        name: { en: "Shaniwar Wada", mr: "शनिवार वाडा", hi: "शनिवार वाडा" },
        station: { en: "Budhwar Peth / PMC", mr: "बुधवार पेठ / PMC", hi: "बुधवार पेठ / पीएमसी" },
        desc: { en: "Historic fortification built in 1732. It served as the seat of the Peshwas of the Maratha Empire until 1818.", mr: "१७३२ मध्ये बांधलेली ऐतिहासिक वास्तू. १८१८ पर्यंत हे मराठा साम्राज्याच्या पेशव्यांचे मुख्य ठिकाण होते.", hi: "1732 में निर्मित ऐतिहासिक किलेबंदी। यह 1818 तक मराठा साम्राज्य के पेशवाओं की सीट के रूप में कार्य करता था।" }
      },
      dagdusheth: {
        name: { en: "Dagdusheth Ganpati", mr: "दगडूशेठ गणपती", hi: "दगडूशेठ गणपति" },
        station: { en: "Budhwar Peth", mr: "बुधवार पेठ", hi: "बुधवार पेठ" },
        desc: { en: "One of the most famous Ganesh temples in Maharashtra, known for its beautiful deity and grand Ganeshotsav celebrations.", mr: "महाराष्ट्रातील सर्वात प्रसिद्ध गणेश मंदिरांपैकी एक, सुंदर मूर्ती आणि भव्य गणेशोत्सव सोहळ्यासाठी ओळखले जाते.", hi: "महाराष्ट्र में सबसे प्रसिद्ध गणेश मंदिरों में से एक, जो अपने सुंदर देवता और भव्य गणेशोत्सव समारोह के लिए जाना जाता है।" }
      },
      agakhan: {
        name: { en: "Aga Khan Palace", mr: "आगाखान पॅलेस", hi: "आगा खान पैलेस" },
        station: { en: "Kalyani Nagar", mr: "कल्याणी नगर", hi: "कल्याणी नगर" },
        desc: { en: "Built in 1892, this Italian-style palace has historical significance. Mahatma Gandhi and Kasturba Gandhi were interned here during the Quit India movement.", mr: "१८९२ मध्ये बांधलेल्या या इटालियन-शैलीतील राजवाड्याला ऐतिहासिक महत्त्व आहे. भारत छोडो आंदोलनादरम्यान महात्मा गांधी आणि कस्तुरबा गांधी यांना येथे नजरकैदेत ठेवण्यात आले होते.", hi: "1892 में निर्मित, इस इतालवी शैली के महल का ऐतिहासिक महत्व है। भारत छोड़ो आंदोलन के दौरान महात्मा गांधी और कस्तूरबा गांधी को यहां नजरबंद किया गया था।" }
      },
      sambhaji: {
        name: { en: "Sambhaji Park", mr: "संभाजी उद्यान", hi: "संभाजी पार्क" },
        station: { en: "Chhatrapati Sambhaji Udyan", mr: "छत्रपती संभाजी उद्यान", hi: "छत्रपति संभाजी उद्यान" },
        desc: { en: "A gorgeous central park on JM Road featuring a small aquarium, children playground, and beautiful flower beds.", mr: "जेएम रोडवरील एक भव्य मध्यवर्ती उद्यान, ज्यामध्ये एक छोटे मत्स्यालय, मुलांचे खेळाचे मैदान आणि सुंदर फुलांचे वाफे आहेत.", hi: "जेएम रोड पर एक भव्य सेंट्रल पार्क जिसमें एक छोटा एक्वेरियम, बच्चों का खेल का मैदान और सुंदर फूलों की क्यारियां हैं।" }
      },
      saras: {
        name: { en: "Saras Baug", mr: "सारस बाग", hi: "सारस बाग" },
        station: { en: "Swargate", mr: "स्वारगेट", hi: "स्वारगेट" },
        desc: { en: "A scenic park and temple of Talyatla Ganapati (Ganesh on a pond), popular for evening walks and street food stalls.", mr: "तळ्यातला गणपतीचे नयनरम्य उद्यान आणि मंदिर, संध्याकाळच्या फेरफटका आणि स्ट्रीट फूड स्टॉल्ससाठी लोकप्रिय.", hi: "तल्यातला गणपति का एक सुंदर पार्क और मंदिर, जो शाम की सैर और स्ट्रीट फूड स्टालों के लिए लोकप्रिय है।" }
      },
      kelkar: {
        name: { en: "Raja Dinkar Kelkar Museum", mr: "राजा केळकर संग्रहालय", hi: "राजा दिनकर केलकर संग्रहालय" },
        station: { en: "Mandai", mr: "मंडई", hi: "मंडई" },
        desc: { en: "Houses a massive, fascinating collection of Indian arts, crafts, musical instruments, and sculptures accumulated by Dr. Kelkar.", mr: "डॉ. केळकर यांनी गोळा केलेल्या भारतीय कला, हस्तकला, वाद्ये आणि शिल्पांचा एक भव्य, आकर्षक संग्रह येथे आहे.", hi: "डॉ. केलकर द्वारा संचित भारतीय कला, शिल्प, संगीत वाद्ययंत्र और मूर्तियों का एक विशाल, आकर्षक संग्रह है।" }
      }
    }
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

if(!en.feeder) en.feeder = {};
if(!mr.feeder) mr.feeder = {};
if(!hi.feeder) hi.feeder = {};

if(!en.tourist) en.tourist = {};
if(!mr.tourist) mr.tourist = {};
if(!hi.tourist) hi.tourist = {};

mergeKeys(en.feeder, newKeys.feeder, 'en');
mergeKeys(mr.feeder, newKeys.feeder, 'mr');
mergeKeys(hi.feeder, newKeys.feeder, 'hi');

mergeKeys(en.tourist, newKeys.tourist, 'en');
mergeKeys(mr.tourist, newKeys.tourist, 'mr');
mergeKeys(hi.tourist, newKeys.tourist, 'hi');

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(mrPath, JSON.stringify(mr, null, 2) + '\n');
fs.writeFileSync(hiPath, JSON.stringify(hi, null, 2) + '\n');
console.log("Translation keys added successfully.");
