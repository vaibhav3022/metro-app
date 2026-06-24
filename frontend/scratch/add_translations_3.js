const fs = require('fs');

const enPath = '../src/i18n/locales/en.json';
const mrPath = '../src/i18n/locales/mr.json';
const hiPath = '../src/i18n/locales/hi.json';

const en = JSON.parse(fs.readFileSync(enPath));
const mr = JSON.parse(fs.readFileSync(mrPath));
const hi = JSON.parse(fs.readFileSync(hiPath));

const newKeys = {
  map: {
    title: { en: "Official Route Map", mr: "अधिकृत मार्ग नकाशा", hi: "आधिकारिक रूट मैप" }
  },
  station: {
    selectStation: { en: "Select Station", mr: "स्थानक निवडा", hi: "स्टेशन चुनें" },
    facilitiesAt: { en: "Facilities at {{station}}", mr: "{{station}} वरील सुविधा", hi: "{{station}} पर सुविधाएं" },
    parking: { en: "Parking Available", mr: "पार्किंग उपलब्ध", hi: "पार्किंग उपलब्ध" },
    elevators: { en: "Elevators / Lifts", mr: "लिफ्ट्स", hi: "लिफ्ट्स" },
    escalators: { en: "Escalators", mr: "एस्केलेटर", hi: "एस्केलेटर" },
    water: { en: "Drinking Water", mr: "पिण्याचे पाणी", hi: "पीने का पानी" },
    washrooms: { en: "Washrooms", mr: "शौचालये", hi: "शौचालय" },
    interchange: { en: "Interchange", mr: "इंटरचेंज", hi: "इंटरचेंज" },
    unavailable: { en: "Unavailable", mr: "अनुपलब्ध", hi: "अनुपलब्ध" }
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

if(!en.map) en.map = {};
if(!mr.map) mr.map = {};
if(!hi.map) hi.map = {};

if(!en.station) en.station = {};
if(!mr.station) mr.station = {};
if(!hi.station) hi.station = {};


mergeKeys(en.map, newKeys.map, 'en');
mergeKeys(mr.map, newKeys.map, 'mr');
mergeKeys(hi.map, newKeys.map, 'hi');

mergeKeys(en.station, newKeys.station, 'en');
mergeKeys(mr.station, newKeys.station, 'mr');
mergeKeys(hi.station, newKeys.station, 'hi');

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(mrPath, JSON.stringify(mr, null, 2) + '\n');
fs.writeFileSync(hiPath, JSON.stringify(hi, null, 2) + '\n');
console.log("Translation keys added successfully.");
