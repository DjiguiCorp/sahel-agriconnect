import AfricasTalking from 'africastalking';

// Required env vars (add to Render.com → Environment Variables):
// AFRICASTALKING_USERNAME=sandbox   ← use 'sandbox' for testing, your username for production
// AFRICASTALKING_API_KEY=...        ← from dashboard.africastalking.com
// AFRICASTALKING_SENDER_ID=...      ← optional short code or alphanumeric sender name

let client = null;

function getClient() {
  if (!process.env.AFRICASTALKING_API_KEY || !process.env.AFRICASTALKING_USERNAME) {
    return null;
  }
  if (!client) {
    client = AfricasTalking({
      username: process.env.AFRICASTALKING_USERNAME,
      apiKey: process.env.AFRICASTALKING_API_KEY,
    });
  }
  return client;
}

export async function sendSms(phone, message) {
  const at = getClient();
  if (!at) {
    console.warn("⚠️ Africa's Talking not configured — SMS not sent to", phone);
    return { success: false, reason: 'not_configured' };
  }

  // Normalize phone number to international format
  // Mali (+223), Burkina Faso (+226), Niger (+227) — strip spaces and ensure + prefix
  const normalized = String(phone || '')
    .replace(/\s+/g, '')
    .replace(/^00/, '+')
    .replace(/^(?!\+)/, '+');

  try {
    const sms = at.SMS;
    const result = await sms.send({
      to: [normalized],
      message,
      ...(process.env.AFRICASTALKING_SENDER_ID ? { from: process.env.AFRICASTALKING_SENDER_ID } : {}),
    });
    const recipient = result?.SMSMessageData?.Recipients?.[0];
    if (recipient?.status === 'Success') {
      return { success: true, messageId: recipient.messageId };
    }
    return { success: false, reason: recipient?.status || 'unknown' };
  } catch (err) {
    console.error("Africa's Talking SMS error:", err.message);
    return { success: false, reason: err.message };
  }
}

