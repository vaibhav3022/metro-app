export const METRO_LINES = {
  purple: {
    name: 'Purple Line (PCMC to Swargate)',
    color: '#8E24AA',
    stations: [
      'PCMC',
      'Sant Tukaram Nagar',
      'Bhosari',
      'Kasarwadi',
      'Phugewadi',
      'Dapodi',
      'Bopodi',
      'Khadki',
      'Range Hills',
      'Shivajinagar',
      'Civil Court',
      'Budhwar Peth',
      'Mandai',
      'Swargate'
    ]
  },
  aqua: {
    name: 'Aqua Line (Vanaz to Ramwadi)',
    color: '#00ACC1',
    stations: [
      'Vanaz',
      'Anand Nagar',
      'Ideal Colony',
      'Nal Stop',
      'Garware College',
      'Deccan Gymkhana',
      'Chhatrapati Sambhaji Udyan',
      'PMC',
      'Civil Court',
      'Mangalwar Peth',
      'Pune Railway Station',
      'Ruby Hall Clinic',
      'Bund Garden',
      'Yerawada',
      'Kalyani Nagar',
      'Ramwadi'
    ]
  },
  line3: {
    name: 'Line 3 (Hinjewadi to Civil Court)',
    color: '#E53935',
    stations: [
      'Megapolis Circle',
      'Embassy Quadron Business Park',
      'Dohler',
      'Infosys Phase II',
      'Wipro Phase II',
      'Pall India',
      'Shivaji Chowk',
      'Hinjawadi',
      'Wakad Chowk',
      'Balewadi Stadium',
      'NICMAR',
      'Ram Nagar',
      'Laxmi Nagar',
      'Balewadi Phata',
      'Baner Gaon',
      'Baner',
      'Krushi Anusadhan',
      'Sakal Nagar',
      'University',
      'R.B.I.',
      'Agriculture College',
      'Shivajinagar',
      'Civil Court'
    ]
  }
};

export const ALL_STATIONS = [
  ...new Set([
    ...METRO_LINES.purple.stations,
    ...METRO_LINES.aqua.stations,
    ...METRO_LINES.line3.stations
  ])
];

export default METRO_LINES;
