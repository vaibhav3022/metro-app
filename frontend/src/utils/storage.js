import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@pune_metro_token';
const REFRESH_TOKEN_KEY = '@pune_metro_refresh_token';
const USER_KEY = '@pune_metro_user';

export const storage = {
  saveToken: async (token) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Error saving access token', e);
    }
  },

  getToken: async () => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (e) {
      console.error('Error getting access token', e);
      return null;
    }
  },

  saveRefreshToken: async (refreshToken) => {
    try {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch (e) {
      console.error('Error saving refresh token', e);
    }
  },

  getRefreshToken: async () => {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (e) {
      console.error('Error getting refresh token', e);
      return null;
    }
  },

  saveUser: async (user) => {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Error saving user data', e);
    }
  },

  getUser: async () => {
    try {
      const user = await AsyncStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (e) {
      console.error('Error getting user data', e);
      return null;
    }
  },

  clearAll: async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Error clearing storage', e);
    }
  },

  saveString: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error('Error saving string', e);
    }
  },

  getString: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.error('Error getting string', e);
      return null;
    }
  },

};

export default storage;
