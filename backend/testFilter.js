const sentGifts = [
  { amount: 100 },
  { amount: 200, receiverEmail: 'foo@bar.com' },
  { amount: 300, receiverEmail: '' },
  { amount: 400, receiverEmail: null },
  { amount: 500, receiverEmail: undefined }
];

console.log(sentGifts.filter(g => !g.receiverEmail));
