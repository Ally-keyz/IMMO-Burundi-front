import { useLanguage } from '../../contexts/LanguageContext';
import LegalLayout from './LegalLayout';

export default function CookiePolicyPage(): JSX.Element {
  const { t } = useLanguage();
  return (
    <LegalLayout title={t('legal.cookies.title')} updated="January 2026">
      <p>
        This Cookie Policy explains how IMMO BURUNDI uses cookies and similar technologies to recognise you when you
        visit our marketplace.
      </p>

      <h2>1. What are cookies</h2>
      <p>
        Cookies are small text files stored on your device. They help us keep you signed in, remember your language and
        currency preferences, and understand how the platform is used.
      </p>

      <h2>2. Cookies we use</h2>
      <ul>
        <li><strong>Essential cookies</strong> — required for authentication and security.</li>
        <li><strong>Preference cookies</strong> — remember your language and currency choices.</li>
        <li><strong>Analytics cookies</strong> — help us understand aggregate usage so we can improve the service.</li>
      </ul>

      <h2>3. Managing cookies</h2>
      <p>
        You can control or delete cookies through your browser settings. Disabling essential cookies may prevent you
        from signing in or using parts of the marketplace.
      </p>

      <h2>4. Contact</h2>
      <p>If you have questions about this policy, contact us at hello@immoburundi.bi.</p>
    </LegalLayout>
  );
}