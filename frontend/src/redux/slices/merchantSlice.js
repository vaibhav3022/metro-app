import { createSlice } from '@reduxjs/toolkit';

const merchantSlice = createSlice({
  name: 'merchant',
  initialState: { dashboardData: null, shopData: null, transactions: [], loading: false, error: null },
  reducers: {
    setMerchantLoading: (state, action) => { state.loading = action.payload; },
    setMerchantError: (state, action) => { state.error = action.payload; },
    setMerchantDashboard: (state, action) => { state.dashboardData = action.payload; },
    setShopData: (state, action) => { state.shopData = action.payload; },
    setMerchantTransactions: (state, action) => { state.transactions = action.payload; }
  }
});

export const { setMerchantLoading, setMerchantError, setMerchantDashboard, setShopData, setMerchantTransactions } = merchantSlice.actions;
export default merchantSlice.reducer;
