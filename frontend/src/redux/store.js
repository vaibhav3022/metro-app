import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import ticketReducer from './slices/ticketSlice';
import walletReducer from './slices/walletSlice';
import adminReducer from './slices/adminSlice';
import merchantReducer from './slices/merchantSlice';
import userReducer from './slices/userSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tickets: ticketReducer,
    wallet: walletReducer,
    admin: adminReducer,
    merchant: merchantReducer,
    user: userReducer,
    notification: notificationReducer
  }
});

export default store;
