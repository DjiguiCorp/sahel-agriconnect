import mongoose from 'mongoose';
const waitlistSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  source: { type: String, trim: true, default: '' },
  createdAt: { type: Date, default: Date.now },
});
export default mongoose.model('Waitlist', waitlistSchema);

