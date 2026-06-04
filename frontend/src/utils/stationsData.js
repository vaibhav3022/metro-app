import { METRO_LINES } from '../constants/metroLines';

export const STATIONS = [
  ...new Set([
    ...METRO_LINES.purple.stations,
    ...METRO_LINES.aqua.stations
  ])
].sort();

// Helper mapping to check lines of a station
export const getStationLine = (stationName) => {
  const isPurple = METRO_LINES.purple.stations.includes(stationName);
  const isAqua = METRO_LINES.aqua.stations.includes(stationName);
  
  if (isPurple && isAqua) return 'both'; // Interchange station
  if (isPurple) return 'purple';
  if (isAqua) return 'aqua';
  return null;
};
export default STATIONS;
