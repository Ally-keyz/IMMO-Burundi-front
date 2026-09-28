import { useMemo, useState } from 'react';
import {
  Calendar,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  Send,
  User,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AgentSummary, ListingType } from '@immo/shared-types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { enquiriesApi, rentalApplicationsApi, getApiErrorMessage } from '../lib/api';
import { defaultContactMessage, whatsappChatUrl } from '../lib/whatsapp';
import Modal from './Modal';

interface ContactActionsProps {
  propertyId: string;
  agent?: AgentSummary;
  listingType: ListingType;
}

interface ActionButtonProps {
  onClick?: () => void;
  href?: string;
  label: string;
  icon: JSX.Element;
  primary?: boolean;
  disabled?: boolean;
}

export default function ContactActions({ propertyId, agent, listingType }: ContactActionsProps): JSX.Element {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [contactOpen, setContactOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  /* Direct agent chat — `wa.me/?text=` has no recipient, the number must be in the path. */
  const waLink = useMemo(
    () =>
      whatsappChatUrl(
        agent?.phone,
        `Hello${agent ? ` ${agent.firstName}` : ''}, I'm interested in property ${propertyId} on IMMO BURUNDI.`,
      ) ?? undefined,
    [agent, propertyId],
  );

  const requireLogin = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/property/${propertyId}` } });
      return true;
    }
    return false;
  };

  const scrollToVisit = () => {
    document.getElementById('visit-widget')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const submitContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (requireLogin()) return;
    const fd = new FormData(e.currentTarget);
    setSending(true);
    setFeedback(null);
    try {
      await enquiriesApi.create({
        propertyId,
        agentId: agent?.id,
        subject: String(fd.get('subject') ?? t('modal.contact.title')),
        /* Optional for the user — the API still needs a non-empty body. */
        message: String(fd.get('message') ?? '').trim() || defaultContactMessage(undefined, language),
        preferredContact: 'EMAIL',
      });
      setFeedback({ ok: true, text: t('modal.contact.sendSuccess') });
      e.currentTarget.reset();
    } catch (err) {
      setFeedback({ ok: false, text: getApiErrorMessage(err) });
    } finally {
      setSending(false);
    }
  };

  const submitApply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (requireLogin()) return;
    const fd = new FormData(e.currentTarget);
    setSending(true);
    setFeedback(null);
    try {
      await rentalApplicationsApi.create({
        propertyId,
        message: String(fd.get('message') ?? ''),
        monthlyIncome: Number(fd.get('income')) || undefined,
        employmentStatus: String(fd.get('employment') ?? ''),
        references: String(fd.get('references') ?? ''),
      });
      setFeedback({ ok: true, text: t('apply.submitted') });
      e.currentTarget.reset();
    } catch (err) {
      setFeedback({ ok: false, text: getApiErrorMessage(err) });
    } finally {
      setSending(false);
    }
  };

  const isRental = listingType === 'RENT' || listingType === 'LEASE';

  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton
        onClick={() => {
          if (requireLogin()) return;
          setContactOpen(true);
        }}
        label={t('property.contactAgent')}
        icon={<User className="h-4 w-4" />}
        primary
      />
      <ActionButton href={waLink} label={t('property.whatsapp')} icon={<MessageCircle className="h-4 w-4" />} />
      <ActionButton
        onClick={() => {
          if (requireLogin()) return;
          setContactOpen(true);
        }}
        label={t('property.call')}
        icon={<Phone className="h-4 w-4" />}
      />
      <ActionButton
        onClick={() => {
          if (requireLogin()) return;
          setContactOpen(true);
        }}
        label={t('property.message')}
        icon={<Mail className="h-4 w-4" />}
      />
      <ActionButton onClick={scrollToVisit} label={t('property.requestVisit')} icon={<Calendar className="h-4 w-4" />} />
      {isRental ? (
        <ActionButton
          onClick={() => {
            if (requireLogin()) return;
            setApplyOpen(true);
          }}
          label={t('property.applyRent')}
          icon={<FileText className="h-4 w-4" />}
        />
      ) : null}

      {/* Contact / message modal */}
      <Modal open={contactOpen} onClose={() => setContactOpen(false)} title={t('modal.contact.title')}>
        <form onSubmit={submitContact} className="space-y-4">
          <div>
            <label htmlFor="ca-message" className="label">{t('modal.contact.message')}</label>
            <textarea
              id="ca-message"
              name="message"
              rows={5}
              required
              className="input"
              placeholder={t('modal.contact.message')}
            />
          </div>
          <input type="hidden" name="subject" defaultValue={t('modal.contact.title')} />
          {feedback ? (
            <p role="alert" className={`rounded-xl p-3 text-sm ${feedback.ok ? 'bg-verified/10 text-verified' : 'bg-notVerified/10 text-notVerified'}`}>
              {feedback.text}
            </p>
          ) : null}
          <button type="submit" disabled={sending} className="btn-primary w-full">
            <Send className="h-4 w-4" />
            {sending ? t('common.loading') : t('common.send')}
          </button>
        </form>
      </Modal>

      {/* Apply to rent modal */}
      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} title={t('modal.apply.title')}>
        <form onSubmit={submitApply} className="space-y-4">
          <div>
            <label htmlFor="app-income" className="label">
              <span className="inline-flex items-center gap-1.5"><Wallet className="h-4 w-4" /> {t('modal.apply.income')}</span>
            </label>
            <input id="app-income" name="income" type="number" min={0} className="input" inputMode="numeric" />
          </div>
          <div>
            <label htmlFor="app-employment" className="label">{t('modal.apply.employment')}</label>
            <input id="app-employment" name="employment" className="input" />
          </div>
          <div>
            <label htmlFor="app-references" className="label">{t('modal.apply.references')}</label>
            <input id="app-references" name="references" className="input" />
          </div>
          <div>
            <label htmlFor="app-message" className="label">{t('modal.contact.message')}</label>
            <textarea id="app-message" name="message" rows={4} className="input" />
          </div>
          {feedback ? (
            <p role="alert" className={`rounded-xl p-3 text-sm ${feedback.ok ? 'bg-verified/10 text-verified' : 'bg-notVerified/10 text-notVerified'}`}>
              {feedback.text}
            </p>
          ) : null}
          <button type="submit" disabled={sending} className="btn-primary w-full">
            <Send className="h-4 w-4" />
            {sending ? t('common.loading') : t('property.applyRent')}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function ActionButton({
  onClick,
  href,
  label,
  icon,
  primary = false,
  disabled = false,
}: ActionButtonProps): JSX.Element {
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={disabled}
        className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
          primary ? 'btn-primary' : 'btn-outline'
        }`}
      >
        {icon}
        {label}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium ${primary ? 'btn-primary' : 'btn-outline'}`}
    >
      {icon}
      {label}
    </button>
  );
}