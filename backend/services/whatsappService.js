/**
 * Simplified WhatsApp notification queue (no paid APIs).
 * This file is kept for backwards compatibility, but it does NOT send messages automatically.
 * Instead, it queues a PendingNotification so admins can send manually.
 */
import { queueNotification, messageTemplates } from './notificationService.js';

export async function sendWhatsAppMessage(phone, message) {
  return queueNotification({
    name: '',
    phone,
    email: '',
    message,
    source: 'whatsapp_service',
  });
}

export const messages = messageTemplates;

