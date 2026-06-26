import { METRO_LINES } from '../constants/metroLines';

/**
 * Calculates transit distance (in KM) between source and destination stations.
 * Utilizes line indices and routes through Swargate if they are on different lines.
 */
export const calculateDistance = (source, destination) => {
  if (!source || !destination) return 0;
  if (source === destination) return 0;

  // 1. Build Adjacency List for the metro graph
  const graph = {};
  const addEdge = (u, v) => {
    if (!graph[u]) graph[u] = [];
    if (!graph[v]) graph[v] = [];
    if (!graph[u].includes(v)) graph[u].push(v);
    if (!graph[v].includes(u)) graph[v].push(u);
  };

  Object.values(METRO_LINES).forEach(line => {
    const stations = line.stations;
    for (let i = 0; i < stations.length - 1; i++) {
      addEdge(stations[i], stations[i+1]);
    }
  });

  // 2. BFS to find shortest path (fewest edges)
  const queue = [{ station: source, dist: 0 }];
  const visited = new Set([source]);

  while (queue.length > 0) {
    const { station, dist } = queue.shift();

    if (station === destination) {
      // Assuming average 1.4 km gap between any adjacent stations
      return parseFloat((dist * 1.4).toFixed(1));
    }

    for (const neighbor of (graph[station] || [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ station: neighbor, dist: dist + 1 });
      }
    }
  }

  return 0; // If no path found
};

/**
 * Calculates ticket fare based on computed distance and number of passengers
 * ENERGEIA METRO Rates:
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
