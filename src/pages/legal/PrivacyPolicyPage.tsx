import { useLanguage } from '../../contexts/LanguageContext';
import LegalLayout from './LegalLayout';

export default function PrivacyPolicyPage(): JSX.Element {
  const { t } = useLanguage();
  return (
    <LegalLayout title={t('legal.privacy.title')} updated="January 2026">
      <p>
        IMMO BURUNDI ("we", "us") is committed to protecting the privacy of everyone who uses our real estate
        marketplace. This policy explains what data we collect, why we collect it, and the choices you have.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>Account details such as your name, phone number, email address, preferred language and currency.</li>
        <li>Property information you submit, including photos, documents and location details.</li>
        <li>Usage data such as pages viewed and searches performed, used to improve the service.</li>
      </ul>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To create and secure your account and to authenticate you.</li>
        <li>To display and promote properties and to connect you with agents.</li>
        <li>To verify documents and to detect fraud or misuse.</li>
        <li>To send service notifications and, where permitted, marketing messages.</li>
      </ul>

      <h2>3. Viewer privacy</h2>
      <p>
        We never reveal the identity of viewers to property owners or agents through analytics. Owners and agents
        receive aggregated, anonymised statistics only.
      </p>

      <h2>4. Sharing</h2>
      <p>
        We do not sell your personal data. We may share data with service providers who help us operate the platform,
        and with authorities where required by law.
      </p>

      <h2>5. Your rights</h2>
      <p>
        You may access, correct or delete your account information at any time from your dashboard, or by contacting
        our support team.
      </p>

      <h2>6. Contact</h2>
      <p>For any privacy question, contact us at hello@immoburundi.bi.</p>
    </LegalLayout>
  );
}