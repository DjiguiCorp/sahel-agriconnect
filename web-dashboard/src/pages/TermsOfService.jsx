import { LegalPageLayout } from '../components/LegalPageLayout';
import { TERMS_SECTIONS } from '../data/legalSections';

export default function TermsOfService() {
  return (
    <LegalPageLayout
      titleEn="Terms of Service"
      titleFr="Conditions d'utilisation"
      sections={TERMS_SECTIONS}
      contactEmail="legal@sahelagriconnect.com"
    />
  );
}
