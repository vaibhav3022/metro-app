import api from './axiosConfig';

export const authAPI = {
  sendOTP: async ({ email, isRegister }) => {
    const response = await api.post('/auth/send-otp', { email, isRegister });
    return response.data;
  },

  verifyOTP: async (payload) => {
    const response = await api.post('/auth/verify-otp', payload);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  }
};

export default authAPI;
