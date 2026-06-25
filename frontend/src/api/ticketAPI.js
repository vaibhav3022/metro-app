import api from './axiosConfig';
import SyncService from '../services/SyncService';

export const ticketAPI = {
  calculateFare: async (source, destination, passengers, isReturn) => {
    try {
      const response = await api.post('/tickets/calculate-fare', { source, destination, passengers, isReturn });
      return response.data;
    } catch (error) {
      if (!error.response) {
        // Network error, fallback to offline calculation
        console.warn('Network error, calculating fare offline...');
        return await SyncService.calculateFareOffline(source, destination, passengers, isReturn);
      }
      throw error;
    }
  },

  createTicket: async (ticketData) => {
    const response = await api.post('/tickets/create', ticketData);
    return response.data;
  },

  createRazorpayOrder: async (amount) => {
    const response = await api.post('/tickets/create-razorpay-order', { amount });
    return response.data;
  },

  processPayment: async (ticketId, paymentData) => {
    const response = await api.post('/tickets/payment', { ticketId, ...paymentData });
    return response.data;
  },

  getTicketHistory: async () => {
    const response = await api.get('/tickets/history');
    return response.data;
  },

  getTicketById: async (id) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  verifyTicketQR: async (qrData) => {
    const response = await api.post('/tickets/verify-qr', { qrData });
    return response.data;
  },

  expireTicket: async (id) => {
    const response = await api.post(`/tickets/expire/${id}`);
    return response.data;
  }
};

export default ticketAPI;
