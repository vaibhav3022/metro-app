const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'src', 'i18n', 'locales');
const langs = ['en', 'mr', 'hi'];

const updates = {
  en: {
    home: {
      pmpmlTitle: "PMPML Bus Tickets",
      pmpmlSub: "Book city bus tickets seamlessly",
      evAutoTitle: "EV Auto",
      evAutoSub: "Book shared EV autos to your destination",
      notifShortcutTitle: "Notifications",
      notifShortcutSub: "Check your latest alerts & offers"
    }
  },
  mr: {
    home: {
      pmpmlTitle: "PMPML बस तिकिटे",
      pmpmlSub: "शहरातील बसची तिकिटे सहज बुक करा",
      evAutoTitle: "EV ऑटो",
      evAutoSub: "तुमच्या प्रवासासाठी शेअरिंग ईव्ही ऑटो बुक करा",
      notifShortcutTitle: "सूचना (Notifications)",
      notifShortcutSub: "तुमचे नवीन अलर्ट्स आणि ऑफर्स तपासा"
    }
  },
  hi: {
    home: {
      pmpmlTitle: "PMPML बस टिकट",
      pmpmlSub: "शहर की बस के टिकट आसानी से बुक करें",
      evAutoTitle: "EV ऑटो",
      evAutoSub: "अपनी मंजिल के लिए शेयरिंग EV ऑटो बुक करें",
      notifShortcutTitle: "सूचनाएं (Notifications)",
      notifShortcutSub: "अपने नवीनतम अलर्ट और ऑफ़र देखें"
    }
  }
};

langs.forEach(lang => {
  const filePath = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!data.home) data.home = {};
    
    Object.assign(data.home, updates[lang].home);
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${lang}.json`);
  }
});
