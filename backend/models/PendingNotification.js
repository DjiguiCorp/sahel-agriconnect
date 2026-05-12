import mongoose from 'mongoose';

const pendingNotificationSchema = new mongoose.Schema({
  recipientName: String,
  recipientPhone: String,
  recipientEmail: String,
  message: { type: String, required: true },
  channel: { type: String, enum: ['email', 'whatsapp', 'sms'], default: 'email' },
  source: String,
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  sentAt: Date,
  error: String,
  fcmToken: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('PendingNotification', pendingNotificationSchema);
