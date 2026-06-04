import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentTicket: null,
  history: [],
  loading: false,
  error: null,
  bookingDetails: null
};

const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    ticketActionStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    ticketActionFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    fetchHistorySuccess: (state, action) => {
      state.loading = false;
      state.history = action.payload;
      state.error = null;
    },
    setBookingDetails: (state, action) => {
      state.bookingDetails = action.payload;
    },
    setCurrentTicket: (state, action) => {
      state.currentTicket = action.payload;
      state.loading = false;
    },
    clearBooking: (state) => {
      state.bookingDetails = null;
      state.currentTicket = null;
    }
  }
});

export const {
  ticketActionStart,
  ticketActionFailure,
  fetchHistorySuccess,
  setBookingDetails,
  setCurrentTicket,
  clearBooking
} = ticketSlice.actions;

export default ticketSlice.reducer;
