const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Wallet = mongoose.model('Wallet', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, transactions: [] }, { strict: false }));
  const Ticket = mongoose.model('Ticket', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, source: String, destination: String, totalAmount: Number, createdAt: Date }, { strict: false }));

  const wallets = await Wallet.find({});
  for (const wallet of wallets) {
    let changed = false;
    for (const tx of wallet.transactions) {
      if (tx.description && tx.description.startsWith('Premium Member 5% Cashback') && !tx.description.includes('Ticket Price:')) {
        // Find matching ticket around this time
        const txDate = new Date(tx.date || tx.createdAt);
        const ticket = await Ticket.findOne({
          userId: wallet.userId,
          createdAt: { $gte: new Date(txDate.getTime() - 60000), $lte: new Date(txDate.getTime() + 60000) }
        });
        if (ticket) {
          tx.description = tx.description + ' | Ticket Price: ₹' + ticket.totalAmount;
          changed = true;
        } else {
           // fallback to math guess if ticket not found
           tx.description = tx.description + ' | Ticket Price: ₹' + (tx.amount * 20);
           changed = true;
        }
      }
    }
    if (changed) {
      await Wallet.updateOne({ _id: wallet._id }, { $set: { transactions: wallet.transactions } });
    }
  }
  console.log('Migration complete');
  process.exit(0);
}
run();
