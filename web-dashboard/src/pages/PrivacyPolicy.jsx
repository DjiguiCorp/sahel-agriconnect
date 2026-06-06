import { LegalPageLayout } from '../components/LegalPageLayout';
import { PRIVACY_SECTIONS } from '../data/legalSections';

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout
      titleEn="Privacy Policy"
      titleFr="Politique de confidentialité"
      sections={PRIVACY_SECTIONS}
      contactEmail="privacy@sahelagriconnect.com"
    />
  );
}
