import { METRO_LINES } from '../constants/metroLines';

export const STATIONS = [
  ...new Set([
    ...METRO_LINES.purple.stations,
    ...METRO_LINES.aqua.stations
  ])
].sort();

// Helper mapping to check lines of a station
export const getStationLine = (stationName) => {
  const lines = [];
  if (METRO_LINES.purple.stations.includes(stationName)) lines.push('purple');
  if (METRO_LINES.aqua.stations.includes(stationName)) lines.push('aqua');
  if (METRO_LINES.line3.stations.includes(stationName)) lines.push('line3');
  return lines;
};
export default STATIONS;
