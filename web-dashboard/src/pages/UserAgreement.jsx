import { LegalPageLayout } from '../components/LegalPageLayout';
import { USER_AGREEMENT_SECTIONS } from '../data/legalSections';

export default function UserAgreement() {
  return (
    <LegalPageLayout
      titleEn="User Agreement"
      titleFr="Accord utilisateur"
      sections={USER_AGREEMENT_SECTIONS}
      contactEmail="privacy@sahelagriconnect.com"
    />
  );
}
