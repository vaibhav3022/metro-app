import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import walletAPI from '../../api/walletAPI';

export const fetchWallet = createAsyncThunk('wallet/fetchWallet', async (_, { rejectWithValue }) => {
  try {
    const res = await walletAPI.getBalance(); // returns { balance, transactions } theoretically, let's just get everything
    return res;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch wallet');
  }
});

export const addMoney = createAsyncThunk('wallet/addMoney', async ({ amount, paymentId }, { rejectWithValue }) => {
  try {
    const res = await walletAPI.addMoney(amount, paymentId);
    return res; // should return { balance, transaction }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add money');
  }
});

const initialState = {
  balance: 0,
  transactions: [],
  loading: false,
  error: null
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    walletActionStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    walletActionFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchBalanceSuccess: (state, action) => {
      state.loading = false;
      state.balance = action.payload;
      state.error = null;
    },
    fetchTransactionsSuccess: (state, action) => {
      state.loading = false;
      state.transactions = action.payload;
      state.error = null;
    },
    addMoneySuccess: (state, action) => {
      state.loading = false;
      state.balance = action.payload.balance;
      if (action.payload.transaction) {
        state.transactions.unshift(action.payload.transaction);
      }
      state.error = null;
    },
    deductMoneySuccess: (state, action) => {
      state.loading = false;
      state.balance = action.payload.balance;
      if (action.payload.transaction) {
        state.transactions.unshift(action.payload.transaction);
      }
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWallet.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.balance;
        state.transactions = action.payload.transactions || [];
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addMoney.pending, (state) => {
        state.loading = true;
      })
      .addCase(addMoney.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.balance || action.payload.wallet?.balance;
        if (action.payload.transaction) {
          state.transactions.unshift(action.payload.transaction);
        }
      })
      .addCase(addMoney.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  walletActionStart,
  walletActionFailure,
  fetchBalanceSuccess,
  fetchTransactionsSuccess,
  addMoneySuccess,
  deductMoneySuccess
} = walletSlice.actions;

export default walletSlice.reducer;
