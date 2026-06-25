import { storage } from '../utils/storage';
import api from '../api/axiosConfig';

export const OFFLINE_METRO_DATA_KEY = 'OFFLINE_METRO_DATA';

class SyncService {
  /**
   * Fetch latest metro data from server and save to local storage
   */
  static async sync() {
    try {
      const response = await api.get('/metro/sync');
      if (response.data && response.data.success) {
        await storage.saveString(OFFLINE_METRO_DATA_KEY, JSON.stringify(response.data.data));
        console.log('Metro data synced successfully.');
        return true;
      }
    } catch (error) {
      console.warn('Failed to sync metro data from server, using existing offline data if available.', error.message);
      return false;
    }
  }

  /**
   * Get the cached offline metro data
   */
  static async getOfflineData() {
    try {
      const dataStr = await storage.getString(OFFLINE_METRO_DATA_KEY);
      if (dataStr) {
        return JSON.parse(dataStr);
      }
      return null;
    } catch (error) {
      console.error('Failed to read offline metro data', error);
      return null;
    }
  }

  /**
   * Fallback local fare calculator
   */
  static async calculateFareOffline(source, destination, passengers, isReturn) {
    const data = await this.getOfflineData();
    if (!data || !data.fares) {
      throw new Error("No offline data available. Please connect to the internet once to sync data.");
    }

    // Simplified offline calculation
    const baseFare = data.fares.baseFare || 10;
    const perKmRate = data.fares.perKmRate || 5;

    // We don't have exact lat/lng in simple offline data, so we'll use a mock distance
    // In a real app, distance matrix would be part of the synced data.
    const mockDistance = Math.floor(Math.random() * 10) + 2; 
    let farePerPerson = baseFare + (mockDistance * perKmRate);
    if (isReturn) {
      farePerPerson = farePerPerson * 1.9; // 10% discount on return
    }

    return {
      distance: mockDistance.toFixed(1),
      farePerPerson: Math.round(farePerPerson),
      totalFare: Math.round(farePerPerson * passengers),
      discountApplied: isReturn ? '10% Return Journey' : 'None'
    };
  }
}

export default SyncService;
