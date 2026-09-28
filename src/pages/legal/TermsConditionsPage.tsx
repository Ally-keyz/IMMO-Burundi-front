import { useLanguage } from '../../contexts/LanguageContext';
import LegalLayout from './LegalLayout';

export default function TermsConditionsPage(): JSX.Element {
  const { t } = useLanguage();
  return (
    <LegalLayout title={t('legal.terms.title')} updated="January 2026">
      <p>
        By accessing or using IMMO BURUNDI you agree to these Terms &amp; Conditions. Please read them carefully before
        using the marketplace.
      </p>

      <h2>1. The service</h2>
      <p>
        IMMO BURUNDI is a marketplace that connects property owners, agents, buyers, tenants and investors. We are not
        a party to any transaction between users.
      </p>

      <h2>2. Accounts</h2>
      <ul>
        <li>You must provide accurate information when creating an account.</li>
        <li>You are responsible for keeping your password confidential.</li>
        <li>We may suspend accounts that breach these terms or applicable law.</li>
      </ul>

      <h2>3. Listings</h2>
      <ul>
        <li>Owners and agents must have the right to advertise the properties they list.</li>
        <li>Listings must not be misleading, duplicated or fraudulent.</li>
        <li>We may remove or archive listings that violate these terms.</li>
      </ul>

      <h2>4. Verification</h2>
      <p>
        Verification reflects a review of the documents provided. It does not constitute a guarantee of ownership or
        legal title. See our Verification Disclaimer for details.
      </p>

      <h2>5. Payments and promotions</h2>
      <p>
        Paid services such as verification and promotion are subject to separate pricing and are non-refundable except
        where required by law.
      </p>

      <h2>6. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, IMMO BURUNDI is not liable for losses arising from transactions between
        users or from reliance on listing information.
      </p>

      <h2>7. Changes</h2>
      <p>We may update these terms from time to time. Continued use constitutes acceptance of the updated terms.</p>
    </LegalLayout>
  );
}