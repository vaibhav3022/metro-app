const { z } = require('zod');

const bookTicketSchema = z.object({
  source: z.string().min(2).max(100),
  destination: z.string().min(2).max(100),
  distance: z.number().optional(),
  fare: z.number().optional(),
  passengers: z.number().int().min(1).max(10),
  totalAmount: z.number().optional(),
  isReturn: z.boolean().optional(),
  travelDate: z.string().datetime({ offset: true }).optional(),
});

const walletTopupSchema = z.object({
  amount    : z.number().min(10).max(100000),
  paymentId : z.string().optional(),
  currency  : z.literal('INR').optional(),
});

const supportTicketSchema = z.object({
  category    : z.enum(['Grievance', 'Lost & Found', 'Suggestion', 'Other']),
  description : z.string().min(10).max(1000),
  stationId   : z.string().optional(),
});

module.exports = { bookTicketSchema, walletTopupSchema, supportTicketSchema };
