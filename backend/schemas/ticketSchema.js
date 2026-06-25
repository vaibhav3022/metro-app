const { z } = require('zod');

const bookTicketSchema = z.object({
  fromStation : z.string().min(2).max(100),
  toStation   : z.string().min(2).max(100),
  passengers  : z.number().int().min(1).max(10),
  travelDate  : z.string().datetime({ offset: true }).optional(),
});

const walletTopupSchema = z.object({
  amount    : z.number().min(10).max(10000),
  currency  : z.literal('INR'),
});

const supportTicketSchema = z.object({
  category    : z.enum(['Grievance', 'Lost & Found', 'Suggestion', 'Other']),
  description : z.string().min(10).max(1000),
  stationId   : z.string().optional(),
});

module.exports = { bookTicketSchema, walletTopupSchema, supportTicketSchema };
