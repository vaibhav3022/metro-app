import { createSlice } from '@reduxjs/toolkit';

const adminSlice = createSlice({
  name: 'admin',
  initialState: { dashboardData: null, merchantsList: [], usersList: [], revenueData: null, loading: false, error: null },
  reducers: {
    setLoading: (state, action) => { state.loading = action.payload; },
    setError: (state, action) => { state.error = action.payload; },
    setDashboardData: (state, action) => { state.dashboardData = action.payload; },
    setMerchantsList: (state, action) => { state.merchantsList = action.payload; },
    setUsersList: (state, action) => { state.usersList = action.payload; },
    setRevenueData: (state, action) => { state.revenueData = action.payload; }
  }
});

export const { setLoading, setError, setDashboardData, setMerchantsList, setUsersList, setRevenueData } = adminSlice.actions;
export default adminSlice.reducer;
