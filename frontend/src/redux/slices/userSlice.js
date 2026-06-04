import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: { walletBalance: 0, tokenBalance: 0, tickets: [], loading: false, error: null },
  reducers: {
    setUserLoading: (state, action) => { state.loading = action.payload; },
    setUserError: (state, action) => { state.error = action.payload; },
    setWalletBalance: (state, action) => { state.walletBalance = action.payload; },
    setTokenBalance: (state, action) => { state.tokenBalance = action.payload; },
    setUserTickets: (state, action) => { state.tickets = action.payload; }
  }
});

export const { setUserLoading, setUserError, setWalletBalance, setTokenBalance, setUserTickets } = userSlice.actions;
export default userSlice.reducer;
