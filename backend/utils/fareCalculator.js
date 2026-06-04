const purpleStations = [
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
];

const aquaStations = [
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
];

const calculateDistance = (source, destination) => {
  if (!source || !destination) return 0;
  if (source === destination) return 0;

  const inPurpleSrc = purpleStations.indexOf(source);
  const inPurpleDest = purpleStations.indexOf(destination);
  const inAquaSrc = aquaStations.indexOf(source);
  const inAquaDest = aquaStations.indexOf(destination);

  // 1. Same line: Purple
  if (inPurpleSrc !== -1 && inPurpleDest !== -1) {
    return Math.abs(inPurpleSrc - inPurpleDest) * 1.4;
  }

  // 2. Same line: Aqua
  if (inAquaSrc !== -1 && inAquaDest !== -1) {
    return Math.abs(inAquaSrc - inAquaDest) * 1.4;
  }

  // 3. Different lines: Route through Civil Court
  let distToInterchange = 0;
  let distFromInterchange = 0;

  if (inPurpleSrc !== -1) {
    const interchangeIdx = purpleStations.indexOf('Civil Court');
    distToInterchange = Math.abs(inPurpleSrc - interchangeIdx) * 1.4;
  } else if (inAquaSrc !== -1) {
    const interchangeIdx = aquaStations.indexOf('Civil Court');
    distToInterchange = Math.abs(inAquaSrc - interchangeIdx) * 1.4;
  }

  if (inPurpleDest !== -1) {
    const interchangeIdx = purpleStations.indexOf('Civil Court');
    distFromInterchange = Math.abs(inPurpleDest - interchangeIdx) * 1.4;
  } else if (inAquaDest !== -1) {
    const interchangeIdx = aquaStations.indexOf('Civil Court');
    distFromInterchange = Math.abs(inAquaDest - interchangeIdx) * 1.4;
  }

  return parseFloat((distToInterchange + distFromInterchange).toFixed(1));
};

const calculateFare = (source, destination, passengers = 1, isReturn = false) => {
  const distance = calculateDistance(source, destination);
  let farePerPerson = 10;

  if (distance <= 2) {
    farePerPerson = 10;
  } else if (distance <= 5) {
    farePerPerson = 20;
  } else if (distance <= 12) {
    farePerPerson = 30;
  } else if (distance <= 20) {
    farePerPerson = 40;
  } else {
    farePerPerson = 50;
  }

  if (isReturn) {
    farePerPerson *= 2;
  }

  // Dynamic Discount Logic
  const today = new Date().getDay();
  const isWeekend = today === 0 || today === 6; // 0 = Sunday, 6 = Saturday
  const discountMultiplier = isWeekend ? 0.70 : 0.90; // 30% off weekend, 10% off weekday

  farePerPerson = Math.ceil(farePerPerson * discountMultiplier);

  const totalFare = farePerPerson * passengers;

  return {
    distance,
    farePerPerson,
    totalFare,
    discountApplied: isWeekend ? '30% Weekend Off' : '10% Weekday Off'
  };
};

module.exports = {
  calculateDistance,
  calculateFare
};
