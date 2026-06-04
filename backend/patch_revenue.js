const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/punemetro').then(async () => {
  const Revenue = require('./models/Revenue');
  const revs = await Revenue.find();

  let count = 0;
  for (let r of revs) {
    const dayTokens = r.merchantPayouts / 0.8;
    const dayTickets = (r.platformCommission / 0.1) - dayTokens;
    const netRev = dayTickets + dayTokens;

    r.totalTokenSales = dayTokens;
    r.totalTicketSales = dayTickets;
    r.netRevenue = netRev;

    await r.save();
    count++;
  }

  console.log(`Patched ${count} revenue records.`);
  process.exit(0);
});
