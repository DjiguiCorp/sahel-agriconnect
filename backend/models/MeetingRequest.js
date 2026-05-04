import mongoose from 'mongoose';

const meetingRequestSchema = new mongoose.Schema({
  investorName: {
    type: String,
    required: true,
    trim: true,
  },
  investorEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  opportunityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity',
  },
  centerName: { type: String, trim: true },
  preferredDate: { type: String, trim: true },
  message: { type: String, trim: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MeetingRequest = mongoose.model('MeetingRequest', meetingRequestSchema);
export default MeetingRequest;
