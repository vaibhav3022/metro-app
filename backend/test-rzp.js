const Razorpay = require('razorpay');

const instance = new Razorpay({
  key_id: 'rzp_test_St6f7LZjydxbQ0',
  key_secret: 'AoPkm0axAGB4PjAfMD6U0vQu',
});

instance.orders.create({
  amount: 50000,
  currency: "INR",
  receipt: "receipt#1",
}).then((order) => {
  console.log("SUCCESS:", order);
}).catch((error) => {
  console.error("ERROR:", error);
});
