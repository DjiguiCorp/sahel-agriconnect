import express from 'express';
import ServiceBooking from '../models/ServiceBooking.js';
import PendingNotification from '../models/PendingNotification.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const ADMIN_EMAIL_FALLBACK = 'support@woneapp.com';

router.post('/', async (req, res) => {
  try {
    const booking = await ServiceBooking.create(req.body);
    await PendingNotification.create({
      recipientName: 'Admin',
      recipientEmail: process.env.ADMIN_EMAIL || ADMIN_EMAIL_FALLBACK,
      message: `🚜 RÉSERVATION SERVICE
Agriculteur: ${req.body.farmerName}
Service: ${req.body.serviceType}
Coopérative: ${req.body.cooperativeName}
Tél: ${req.body.farmerPhone}
Date souhaitée: ${req.body.requestedDate || 'flexible'}`,
      source: 'service_booking',
      status: 'pending',
    });
    res.status(201).json({ success: true, booking });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { country, status, serviceType } = req.query;
    const filter = {};
    if (country) filter.country = country;
    if (status) filter.status = status;
    if (serviceType) filter.serviceType = serviceType;
    const bookings = await ServiceBooking.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await ServiceBooking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (req.body.status && booking?.farmerPhone) {
      const msg =
        req.body.status === 'confirmed'
          ? `✅ Votre réservation ${booking.serviceType} est CONFIRMÉE pour le ${
              booking.requestedDate ? new Date(booking.requestedDate).toLocaleDateString() : 'date convenue'
            }. — Sahel AgriConnect`
          : req.body.status === 'completed'
            ? `🎉 Service ${booking.serviceType} complété. Merci d'utiliser Sahel AgriConnect !`
            : `ℹ️ Mise à jour de votre réservation ${booking.serviceType}: ${req.body.status}`;
      await PendingNotification.create({
        recipientName: booking.farmerName,
        recipientPhone: booking.farmerPhone,
        message: msg,
        source: 'booking_update',
        status: 'pending',
      });
    }
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
