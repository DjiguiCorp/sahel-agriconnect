/**
 * Bilingual OTP / magic-link email content (EN + FR).
 * lang: 'en' | 'fr' (defaults to 'fr' for backward compatibility)
 */

export function normalizeLang(lang) {
  const l = String(lang || '').toLowerCase().slice(0, 2);
  return l === 'en' ? 'en' : 'fr';
}

function purposeCopy(purpose, lang) {
  const en = {
    farmer_verify: 'Verify your farmer account',
    coop_verify: 'Verify your cooperative account',
    login: 'Your sign-in code',
    password_reset: 'Reset your password',
  };
  const fr = {
    farmer_verify: 'Vérifiez votre compte agriculteur',
    coop_verify: 'Vérifiez votre compte coopérative',
    login: 'Votre code de connexion',
    password_reset: 'Réinitialisez votre mot de passe',
  };
  const map = lang === 'en' ? en : fr;
  return map[purpose] || map.login;
}

export function buildMagicUrl({ code, email, purpose, role, lang }) {
  const webBase = process.env.WEB_APP_URL || 'https://sahelagriconnect.com';
  const params = new URLSearchParams({
    c: code,
    e: email,
    p: purpose,
  });
  const langNorm = normalizeLang(lang);
  if (langNorm) params.set('lang', langNorm);
  if (role) params.set('r', String(role));
  return `${webBase}/auth/magic?${params.toString()}`;
}

export function codeEmailSubject(code, purpose, lang) {
  const l = normalizeLang(lang);
  if (l === 'en') {
    return `${code} — Sahel AgriConnect verification code`;
  }
  return `${code} — Code de vérification Sahel AgriConnect`;
}

export function codeEmailHtml(code, purpose, { name = '', email = '', lang = 'fr', role = '' } = {}) {
  const l = normalizeLang(lang);
  const headline = purposeCopy(purpose, l);
  const magicUrl = buildMagicUrl({ code, email, purpose, role, lang: l });

  const t =
    l === 'en'
      ? {
          greeting: name ? `Hello <strong>${name}</strong>,` : '',
          intro:
            'Tap the button below to sign in. If the app is installed on your phone, it will open automatically.',
          cta: 'Sign in to Sahel AgriConnect',
          fallback: 'Button not working? Enter this code manually:',
          expires: 'This link expires in <strong>15 minutes</strong>.',
          ignore:
            'If you did not request this email, you can safely ignore it.',
        }
      : {
          greeting: name ? `Bonjour <strong>${name}</strong>,` : '',
          intro:
            'Cliquez sur le bouton ci-dessous pour vous connecter. Si l\'application est installée sur votre téléphone, elle s\'ouvrira automatiquement.',
          cta: 'Se connecter à Sahel AgriConnect',
          fallback: 'Bouton bloqué ? Entrez ce code manuellement :',
          expires: 'Ce lien expire dans <strong>15 minutes</strong>.',
          ignore: 'Si vous n\'avez pas demandé ce lien, ignorez cet email.',
        };

  return `
  <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;">
    <div style="background:#1a3c2e;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
      <h1 style="color:#B5850A;margin:0;font-size:22px;">Sahel AgriConnect</h1>
      <p style="color:white;margin:4px 0 0;font-size:13px;">${headline}</p>
    </div>
    <div style="padding:32px;background:white;border:1px solid #e0e0e0;border-radius:0 0 8px 8px;text-align:center;">
      ${t.greeting ? `<p style="color:#333;margin-bottom:8px;">${t.greeting}</p>` : ''}
      <p style="color:#555;margin-bottom:24px;font-size:15px;">${t.intro}</p>
      <a href="${magicUrl}"
         style="display:inline-block;background:#B5850A;color:white;text-decoration:none;
                padding:16px 40px;border-radius:12px;font-size:16px;font-weight:bold;
                margin-bottom:28px;letter-spacing:0.5px;">
        ✓ ${t.cta}
      </a>
      <div style="border-top:1px solid #eee;padding-top:20px;margin-top:4px;">
        <p style="color:#aaa;font-size:12px;margin-bottom:12px;">${t.fallback}</p>
        <div style="background:#f0f9f4;border:2px solid #1a3c2e;border-radius:12px;padding:16px;display:inline-block;margin-bottom:12px;">
          <span style="font-size:32px;font-weight:bold;color:#1a3c2e;letter-spacing:8px;font-family:monospace;">${code}</span>
        </div>
        <p style="color:#999;font-size:12px;">${t.expires}</p>
      </div>
      <p style="color:#ccc;font-size:11px;margin-top:20px;">${t.ignore}</p>
    </div>
  </div>`;
}
