import api from './axiosConfig';

export const shopAPI = {
  getAllShops: async () => {
    const response = await api.get('/shops');
    return response.data;
  },

  payShop: async (shopId, amount, paymentMethod = 'wallet', paymentId = null) => {
    const response = await api.post('/shops/pay', { shopId, amount, paymentMethod, paymentId });
    return response.data;
  }
};

export default shopAPI;
