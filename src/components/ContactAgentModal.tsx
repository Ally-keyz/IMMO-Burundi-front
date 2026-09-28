import { useState } from 'react';
import { MessageCircle, Phone, UserRound } from 'lucide-react';
import type { AgentSummary } from '@immo/shared-types';
import { useLanguage } from '../contexts/LanguageContext';
import { telUrl, whatsappChatUrl } from '../lib/whatsapp';
import Modal from './Modal';

interface ContactAgentModalProps {
  open: boolean;
  onClose: () => void;
  agent?: AgentSummary;
  /** Property this conversation is about — pre-fills the WhatsApp message. */
  propertyTitle?: string;
  /** Shown under the title, e.g. "Your request was sent". */
  note?: string;
}

function initials(agent: AgentSummary | undefined): string {
  const first = agent?.firstName?.[0];
  const last = agent?.lastName?.[0];
  return `${first ?? ''}${last ?? ''}`.toUpperCase() || 'A';
}

/** Contact dialog: shows the agent's number and opens a direct WhatsApp chat. */
export default function ContactAgentModal({
  open,
  onClose,
  agent,
  propertyTitle,
  note,
}: ContactAgentModalProps): JSX.Element {
  const { t, language } = useLanguage();
  const [draft, setDraft] = useState('');

  const name = agent ? `${agent.firstName} ${agent.lastName}`.trim() : t('contact.agent');
  const phone = agent?.phone;
  const baseMessage = propertyTitle
    ? t('contact.whatsappProperty', { title: propertyTitle })
    : t('contact.whatsappGeneric');
  const message = draft.trim() || baseMessage;
  const chatUrl = whatsappChatUrl(phone, message);
  const callUrl = telUrl(phone);

  return (
    <Modal open={open} onClose={onClose} title={t('contact.chatTitle')} size="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {agent?.photoUrl ? (
            <img src={agent.photoUrl} alt={name} className="h-14 w-14 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
              {initials(agent)}
            </span>
          )}
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-semibold text-gray-900">
              <UserRound className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
              <span className="truncate">{name}</span>
            </p>
            {agent?.agencyName ? <p className="truncate text-xs text-gray-500">{agent.agencyName}</p> : null}
            {phone ? (
              <a href={callUrl ?? undefined} className="block truncate font-mono text-sm font-semibold text-brand-700 hover:underline">
                {phone}
              </a>
            ) : (
              <p className="text-xs text-gray-500">{t('contact.noPhone')}</p>
            )}
          </div>
        </div>

        {note ? <p className="rounded-xl bg-verified/10 p-3 text-sm text-verified">{note}</p> : null}

        <div>
          <label htmlFor="contact-agent-message" className="label">{t('contact.message')}</label>
          <textarea
            id="contact-agent-message"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={baseMessage}
            className="input"
          />
        </div>

        {chatUrl ? (
          <a href={chatUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {t('contact.whatsappCta')}
          </a>
        ) : (
          <p className="rounded-xl bg-gray-100 p-3 text-sm text-gray-600">{t('contact.noPhone')}</p>
        )}

        {callUrl && phone ? (
          <a href={callUrl} className="btn-outline w-full">
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span>{t('contact.callCta')}</span>
            <span className="font-mono font-semibold">{phone}</span>
          </a>
        ) : null}

        <p className="text-center text-xs text-gray-400">
          {language === 'fr'
            ? 'Votre numéro est partagé uniquement avec cet agent.'
            : language === 'sw'
              ? 'Nambari yako itaambikwa kwa wakala huyu pekee.'
              : 'Your number is shared only with this agent.'}
        </p>
      </div>
    </Modal>
  );
}
