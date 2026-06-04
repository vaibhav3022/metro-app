export default {
  open: () => Promise.reject(new Error("Razorpay not supported on web natively")),
};
