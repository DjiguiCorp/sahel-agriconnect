import PendingNotification from '../models/PendingNotification.js';

export const messageTemplates = {
  farmerRegistered: (name) =>
    `✅ Bonjour ${name}! Votre profil agriculteur Sahel AgriConnect a été reçu. Notre équipe vous contactera sous 48h. 🌾 sahelagriconnect.com`,
  cooperativeRegistered: (name) =>
    `✅ Bonjour ${name}! L'inscription de votre coopérative a été reçue. Activation sous 48h. 🤝 sahelagriconnect.com`,
  expertRequestReceived: (name) =>
    `🔬 Bonjour ${name}! Votre demande d'expert a été reçue. Un spécialiste vous contactera bientôt. Sahel AgriConnect`,
  investorWelcome: (name) =>
    `💰 Bienvenue ${name} sur AfriYield Exchange! Notre équipe vous contactera dans les 24h. 🌍 sahelagriconnect.com/afri-yield`,
  certificationReceived: (name) =>
    `🏅 Bonjour ${name}! Votre demande de certification export a été reçue. Sahel AgriConnect`,
  profileActivated: (name) =>
    `✅ Bonjour ${name}! Votre profil est maintenant ACTIF sur Sahel AgriConnect. Connectez-vous: sahelagriconnect.com 🌾`,
};

export async function queueNotification({ name, phone, email, message, source }) {
  try {
    await PendingNotification.create({
      recipientName: name,
      recipientPhone: phone,
      recipientEmail: email,
      message,
      source,
      status: 'pending'
    });
    console.log(`📱 Notification queued for ${name} (${phone || email}): ${String(message).substring(0, 50)}...`);
  } catch (err) {
    console.error('Notification queue error:', err.message);
  }
}

