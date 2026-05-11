import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  cooperativeId: { type: mongoose.Schema.Types.ObjectId, ref: 'CooperativePlatformRegistration' },
  cooperativeName: { type: String, required: true },
  cooperativeEmail: String,
  cooperativeCountry: String,
  cooperativeLeader: String,

  inviteePhone: String,
  inviteeEmail: String,
  inviteeName: String,
  inviteeRegion: String,

  message: String,
  messageFr: String,

  status: {
    type: String,
    enum: ['sent', 'viewed', 'accepted', 'declined', 'expired'],
    default: 'sent',
  },

  inviteCode: { type: String, unique: true },
  expiresAt: { type: Date },
  respondedAt: Date,

  linkedFarmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer' },

  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('CooperativeInvitation', schema);

