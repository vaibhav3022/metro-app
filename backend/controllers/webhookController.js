const crypto = require('crypto');
const User = require('../models/User');
const TokenTransaction = require('../models/TokenTransaction');
const Notification = require('../models/Notification');
const Revenue = require('../models/Revenue');

const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'metro_webhook_secret';
    
    // Verify Signature
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== req.headers['x-razorpay-signature']) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = req.body.event;

    if (event === 'payment.captured') {
      const payment = req.body.payload.payment.entity;
      const notes = payment.notes || {};

      if (notes.orderType === 'token_purchase') {
        const userId = notes.userId;
        const baseTokens = parseInt(notes.baseTokens) || 0;
        const gstAmount = parseInt(notes.gstAmount) || 0;
        const totalAmountPaid = payment.amount / 100; // convert paise to rupees

        const user = await User.findById(userId);
        if (user) {
          const balanceBefore = user.tokenBalance;
          user.tokenBalance += baseTokens;
          await user.save();

          await TokenTransaction.create({
            userId: user._id,
            type: 'purchase',
            amount: baseTokens,
            baseAmount: baseTokens,
            gstAmount: gstAmount,
            totalAmountPaid: totalAmountPaid,
            balanceBefore,
            balanceAfter: user.tokenBalance,
            razorpayPaymentId: payment.id,
            razorpayOrderId: payment.order_id,
            status: 'success'
          });

          await Notification.create({
            recipientId: user._id,
            recipientRole: 'user',
            title: 'Tokens Purchased & GST Invoice',
            message: `You successfully purchased ${baseTokens} tokens. GST Paid: ₹${gstAmount}. Total: ₹${totalAmountPaid}. Your invoice will be emailed.`,
            type: 'success'
          });

          // Log Revenue
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          await Revenue.findOneAndUpdate(
            { date: today },
            { $inc: { totalTokenSales: baseTokens, netRevenue: gstAmount } },
            { upsert: true, new: true }
          );
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { razorpayWebhook };
