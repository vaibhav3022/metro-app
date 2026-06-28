import api from './axiosConfig';

const generateIdempotencyKey = () => `wallet-add-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

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
    const response = await api.post(
      '/wallet/add-money',
      { amount, paymentId },
      {
        headers: {
          'X-Idempotency-Key': generateIdempotencyKey()
        }
      }
    );
    return response.data;
  },

  getTransactions: async () => {
    const response = await api.get('/wallet/transactions');
    return response.data;
  }
};

export default walletAPI;
