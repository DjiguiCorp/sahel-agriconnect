/// In-app legal copy — full prose per locale (Android & iOS).
class LegalSection {
  const LegalSection({required this.title, required this.paragraphs});
  final String title;
  final List<String> paragraphs;
}

List<LegalSection> termsSections(bool isFr) =>
    isFr ? _termsFr : _termsEn;

List<LegalSection> privacySections(bool isFr) =>
    isFr ? _privacyFr : _privacyEn;

List<LegalSection> userAgreementSections(bool isFr) =>
    isFr ? _agreementFr : _agreementEn;

const _termsEn = [
  LegalSection(
    title: '1. Acceptance of Terms',
    paragraphs: [
      'By accessing or using Sahel AgriConnect, you agree to be bound by these Terms of Service and all applicable laws. If you do not agree, you may not use the platform.',
      'Sahel AgriConnect provides digital farmer registration, cooperative management, marketplace services, AfriYield Exchange investments, and government or NGO data portals. Services are provided as-is and may change over time.',
    ],
  ),
  LegalSection(
    title: '2. Accounts and eligibility',
    paragraphs: [
      'You must be at least 18 years old and provide accurate information when registering. You are responsible for all activity under your account and must keep your login credentials secure.',
      'Farmers agree to provide truthful production data and allow cooperative verification. Cooperatives certify only verified farmers and maintain accurate member records. Manage cooperative accounts at sahelagriconnect.com.',
    ],
  ),
  LegalSection(
    title: '3. AfriYield Exchange',
    paragraphs: [
      'Investors complete mandatory KYC and understand that agricultural investments carry risk. Returns are not guaranteed and funds are held in escrow until verified milestones are completed. Manage investor accounts at sahelagriconnect.com.',
      'Djigui Corporation is not liable for crop failures, investment losses, or third-party outages. Maximum liability is limited to fees paid in the last twelve months.',
    ],
  ),
  LegalSection(
    title: '4. Termination and contact',
    paragraphs: [
      'We may suspend accounts that violate these Terms. You may delete your account at sahelagriconnect.com/delete-account.',
      'Questions: support@woneapp.com · WhatsApp +1 (215) 217-5381',
    ],
  ),
];

const _termsFr = [
  LegalSection(
    title: '1. Acceptation des conditions',
    paragraphs: [
      'En accédant à Sahel AgriConnect, vous acceptez d\'être lié par les présentes Conditions d\'utilisation et par toutes les lois applicables. Si vous n\'acceptez pas ces conditions, vous ne pouvez pas utiliser la plateforme.',
      'Sahel AgriConnect fournit l\'inscription numérique des agriculteurs, la gestion des coopératives, les services de marché, les investissements AfriYield Exchange et les portails gouvernementaux ou ONG. Les services sont fournis en l\'état et peuvent évoluer.',
    ],
  ),
  LegalSection(
    title: '2. Comptes et éligibilité',
    paragraphs: [
      'Vous devez avoir au moins 18 ans et fournir des informations exactes lors de l\'inscription. Vous êtes responsable de toute activité sous votre compte et devez protéger vos identifiants.',
      'Les agriculteurs s\'engagent à fournir des données de production véridiques et à permettre la vérification par la coopérative. Les coopératives certifient uniquement des agriculteurs vérifiés et tiennent des registres exacts. Gérez votre compte coopératif sur sahelagriconnect.com.',
    ],
  ),
  LegalSection(
    title: '3. AfriYield Exchange',
    paragraphs: [
      'Les investisseurs complètent une vérification KYC obligatoire et comprennent que les investissements agricoles comportent des risques. Les rendements ne sont pas garantis et les fonds sont détenus en séquestre jusqu\'à la réalisation des jalons vérifiés. Gérez votre compte investisseur sur sahelagriconnect.com.',
      'Djigui Corporation n\'est pas responsable des pertes de récolte, des pertes d\'investissement ni des interruptions de services tiers. La responsabilité maximale est limitée aux frais payés au cours des douze derniers mois.',
    ],
  ),
  LegalSection(
    title: '4. Résiliation et contact',
    paragraphs: [
      'Nous pouvons suspendre les comptes qui violent ces conditions. Vous pouvez supprimer votre compte sur sahelagriconnect.com/delete-account.',
      'Questions : support@woneapp.com · WhatsApp +1 (215) 217-5381',
    ],
  ),
];

const _privacyEn = [
  LegalSection(
    title: '1. Introduction',
    paragraphs: [
      'Djigui Corporation operates Sahel AgriConnect, a digital agricultural platform serving West Africa. This Privacy Policy explains how we collect, use, protect, and share your personal information when you use our mobile apps and website.',
      'We comply with GDPR and OHADA data protection standards. We do not sell your personal data.',
    ],
  ),
  LegalSection(
    title: '2. Information we collect',
    paragraphs: [
      'We collect identity and contact data (name, email, phone, address), agricultural production data, financial and investment information processed via Stripe, and KYC identity documents when required.',
      'We automatically collect device identifiers via Firebase, app usage data, location with your permission, push notification tokens, and crash reports.',
    ],
  ),
  LegalSection(
    title: '3. How we use and share data',
    paragraphs: [
      'We use your data to create accounts, connect farmers with cooperatives, process AfriYield investments, send verification codes, and provide customer support.',
      'We share data only with Stripe (payments), Firebase (notifications), Resend (email), your cooperative, authorities when required by law, and AfriYield partners with your consent.',
    ],
  ),
  LegalSection(
    title: '4. Retention and your rights',
    paragraphs: [
      'Account data is kept while your account is active. Financial records are retained for seven years. Deleted accounts are cleared within thirty days.',
      'You may access, correct, delete, or port your data. Contact support@woneapp.com or visit sahelagriconnect.com/delete-account. WhatsApp: +1 (215) 217-5381.',
    ],
  ),
];

const _privacyFr = [
  LegalSection(
    title: '1. Introduction',
    paragraphs: [
      'Djigui Corporation exploite Sahel AgriConnect, une plateforme agricole numérique au service de l\'Afrique de l\'Ouest. La présente Politique de confidentialité explique comment nous collectons, utilisons, protégeons et partageons vos informations personnelles lorsque vous utilisez nos applications mobiles et notre site web.',
      'Nous respectons le RGPD et les normes OHADA en matière de protection des données. Nous ne vendons pas vos données personnelles.',
    ],
  ),
  LegalSection(
    title: '2. Informations collectées',
    paragraphs: [
      'Nous collectons les données d\'identité et de contact (nom, e-mail, téléphone, adresse), les données de production agricole, les informations financières et d\'investissement traitées via Stripe, ainsi que les documents d\'identité KYC lorsque cela est requis.',
      'Nous collectons automatiquement les identifiants d\'appareil via Firebase, les données d\'utilisation, la localisation avec votre permission, les jetons de notification push et les rapports de crash.',
    ],
  ),
  LegalSection(
    title: '3. Utilisation et partage',
    paragraphs: [
      'Nous utilisons vos données pour créer des comptes, connecter les agriculteurs aux coopératives, traiter les investissements AfriYield, envoyer des codes de vérification et fournir un support client.',
      'Nous partageons les données uniquement avec Stripe (paiements), Firebase (notifications), Resend (e-mails), votre coopérative, les autorités lorsque la loi l\'exige, et les partenaires AfriYield avec votre consentement.',
    ],
  ),
  LegalSection(
    title: '4. Conservation et vos droits',
    paragraphs: [
      'Les données de compte sont conservées tant que votre compte est actif. Les registres financiers sont conservés sept ans. Les comptes supprimés sont effacés sous trente jours.',
      'Vous pouvez accéder à vos données, les corriger, les supprimer ou en demander la portabilité. Contactez support@woneapp.com ou visitez sahelagriconnect.com/delete-account. WhatsApp : +1 (215) 217-5381.',
    ],
  ),
];

const _agreementEn = [
  LegalSection(
    title: '1. Welcome',
    paragraphs: [
      'This User Agreement governs your use of Sahel AgriConnect. By creating an account you accept this Agreement, our Privacy Policy, and our Terms of Service.',
    ],
  ),
  LegalSection(
    title: '2. Your role',
    paragraphs: [
      'Farmers provide accurate farm data after registration. Cooperatives and investors manage their accounts at sahelagriconnect.com. Government and NGO users require an institutional license and must use data only for authorized purposes within their territory.',
      'Government and NGO users require an institutional license and must use data only for authorized purposes within their territory.',
    ],
  ),
  LegalSection(
    title: '3. Data consent and community',
    paragraphs: [
      'You consent to collection of profile and activity data, agricultural processing, sharing with your cooperative, payment processing via Stripe, push notifications via Firebase, and email via Resend.',
      'All users must provide honest information, respect other users, protect credentials, and report suspicious activity.',
    ],
  ),
];

const _agreementFr = [
  LegalSection(
    title: '1. Bienvenue',
    paragraphs: [
      'Le présent Accord utilisateur régit votre utilisation de Sahel AgriConnect. En créant un compte, vous acceptez cet accord, notre Politique de confidentialité et nos Conditions d\'utilisation.',
    ],
  ),
  LegalSection(
    title: '2. Votre rôle',
    paragraphs: [
      'Les agriculteurs fournissent des données d\'exploitation exactes après inscription. Les coopératives et investisseurs gèrent leurs comptes sur sahelagriconnect.com. Les utilisateurs gouvernementaux et ONG doivent disposer d\'une licence institutionnelle et n\'utiliser les données qu\'à des fins autorisées sur leur territoire.',
      'Les utilisateurs gouvernementaux et ONG doivent disposer d\'une licence institutionnelle et n\'utiliser les données qu\'à des fins autorisées sur leur territoire.',
    ],
  ),
  LegalSection(
    title: '3. Consentement et communauté',
    paragraphs: [
      'Vous consentez à la collecte des données de profil et d\'activité, au traitement agricole, au partage avec votre coopérative, au traitement des paiements via Stripe, aux notifications push via Firebase et aux e-mails via Resend.',
      'Tous les utilisateurs doivent fournir des informations honnêtes, respecter les autres, protéger leurs identifiants et signaler toute activité suspecte.',
    ],
  ),
];
