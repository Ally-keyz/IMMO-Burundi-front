import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import LegalLayout from './LegalLayout';

export default function VerificationDisclaimerPage(): JSX.Element {
  const { t } = useLanguage();
  return (
    <LegalLayout title={t('legal.verification.title')} updated="January 2026">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="!mt-0">
          IMMO BURUNDI verifies documents as provided and does not guarantee ownership. Independent legal due diligence
          is always recommended before any transaction.
        </p>
      </div>

      <h2>What verification means</h2>
      <p>
        Our verification team reviews the documents that an owner or agent provides, such as the land title, sale
        agreement, proof of payment and property tax records. Each document is marked as verified, partial or failed.
      </p>

      <h2>Verification levels</h2>
      <ul>
        <li>
          <span className="inline-flex items-center gap-1.5 font-medium text-verified">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Fully verified
          </span>{' '}
          — all key documents were provided and checked successfully.
        </li>
        <li>
          <span className="inline-flex items-center gap-1.5 font-medium text-verified">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Verified
          </span>{' '}
          — the essential documents were checked successfully.
        </li>
        <li>
          <span className="inline-flex items-center gap-1.5 font-medium text-partial">
            <Info className="h-4 w-4" aria-hidden="true" /> Partial
          </span>{' '}
          — some documents were provided or could not be fully confirmed.
        </li>
        <li>
          <span className="inline-flex items-center gap-1.5 font-medium text-notVerified">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Not verified
          </span>{' '}
          — verification has not been completed.
        </li>
      </ul>

      <h2>Limits of verification</h2>
      <p>
        Verification is a documentary check, not a legal title search. It does not confirm the identity, capacity or
        good faith of any party, and it does not transfer or guarantee ownership. Always seek independent legal advice.
      </p>
    </LegalLayout>
  );
}