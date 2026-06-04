import api from './axiosConfig';

export const walletAPI = {
  getBalance: async () => {
    const response = await api.get('/wallet/balance');
    return response.data;
  },

  createRazorpayOrder: async (amount) => {
    const response = await api.post('/wallet/create-razorpay-order', { amount });
    return response.data;
  },

  addMoney: async (amount, paymentId) => {
    const response = await api.post('/wallet/add-money', { amount, paymentId });
    return response.data;
  },

  getTransactions: async () => {
    const response = await api.get('/wallet/transactions');
    return response.data;
  }
};

export default walletAPI;
