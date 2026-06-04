import { METRO_LINES } from '../constants/metroLines';

/**
 * Calculates transit distance (in KM) between source and destination stations.
 * Utilizes line indices and routes through Swargate if they are on different lines.
 */
export const calculateDistance = (source, destination) => {
  if (!source || !destination) return 0;
  if (source === destination) return 0;

  const purpleStations = METRO_LINES.purple.stations;
  const aquaStations = METRO_LINES.aqua.stations;

  const inPurpleSrc = purpleStations.indexOf(source);
  const inPurpleDest = purpleStations.indexOf(destination);
  const inAquaSrc = aquaStations.indexOf(source);
  const inAquaDest = aquaStations.indexOf(destination);

  // 1. Same line: Purple
  if (inPurpleSrc !== -1 && inPurpleDest !== -1) {
    return Math.abs(inPurpleSrc - inPurpleDest) * 1.4; // 1.4 km average station gap
  }

  // 2. Same line: Aqua
  if (inAquaSrc !== -1 && inAquaDest !== -1) {
    return Math.abs(inAquaSrc - inAquaDest) * 1.4;
  }

  // 3. Different lines: Route through Swargate (interchange in our lists)
  // Find distance from Source to Swargate + Swargate to Destination
  let distToInterchange = 0;
  let distFromInterchange = 0;

  // Source part
  if (inPurpleSrc !== -1) {
    const swargateIdx = purpleStations.indexOf('Swargate');
    distToInterchange = Math.abs(inPurpleSrc - swargateIdx) * 1.4;
  } else if (inAquaSrc !== -1) {
    const swargateIdx = aquaStations.indexOf('Swargate');
    distToInterchange = Math.abs(inAquaSrc - swargateIdx) * 1.4;
  }

  // Destination part
  if (inPurpleDest !== -1) {
    const swargateIdx = purpleStations.indexOf('Swargate');
    distFromInterchange = Math.abs(inPurpleDest - swargateIdx) * 1.4;
  } else if (inAquaDest !== -1) {
    const swargateIdx = aquaStations.indexOf('Swargate');
    distFromInterchange = Math.abs(inAquaDest - swargateIdx) * 1.4;
  }

  const totalDist = distToInterchange + distFromInterchange;
  return parseFloat(totalDist.toFixed(1));
};

/**
 * Calculates ticket fare based on computed distance and number of passengers
 * Pune Metro Rates:
 *  0 - 2 km: ₹10
 *  2 - 5 km: ₹20
 *  5 - 12 km: ₹30
 *  12 - 20 km: ₹40
 *  20+ km: ₹50
 */
export const calculateFare = (source, destination, passengers = 1) => {
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

  const totalFare = farePerPerson * passengers;

  return {
    distance,
    farePerPerson,
    totalFare
  };
};

export default {
  calculateDistance,
  calculateFare
};
