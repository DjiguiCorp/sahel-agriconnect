import mongoose from 'mongoose';
const pendingNotificationSchema = new mongoose.Schema({
  recipientName: String,
  recipientPhone: String,
  recipientEmail: String,
  message: String,
  channel: { type: String, enum: ['whatsapp', 'sms', 'email'], default: 'whatsapp' },
  source: String,
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('PendingNotification', pendingNotificationSchema);

