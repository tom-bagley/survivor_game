const mongoose = require('mongoose');
const { Schema } = mongoose;

const stockLineSchema = new Schema({
  survivorName: { type: String, required: true },
  amount: { type: Number, required: true, min: 1 },
}, { _id: false });

const tradeSchema = new Schema({
  groupId:     { type: Schema.Types.ObjectId, ref: 'Group', required: true },
  senderId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  senderName:  { type: String, required: true },

  offerMoney:    { type: Number, default: 0, min: 0 },
  offerStocks:   [stockLineSchema],

  requestMoney:  { type: Number, default: 0, min: 0 },
  requestStocks: [stockLineSchema],

  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled'],
    default: 'pending',
  },
}, { timestamps: true });

tradeSchema.index({ recipientId: 1, groupId: 1, status: 1 });
tradeSchema.index({ senderId: 1, groupId: 1, status: 1 });

module.exports = mongoose.model('Trade', tradeSchema);
