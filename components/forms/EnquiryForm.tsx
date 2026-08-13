'use client';

import { useId, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/lib/locale';
import { dealer } from '@/content/dealer';
import { byRank } from '@/content/vehicles';
import { buildMessage, whatsappLink, type EnquiryKind } from '@/lib/whatsapp';

type Variant = 'lead' | 'finance' | 'service';

type Props = {
  variant?: Variant;
  /** Pre-selects the model — used on model detail pages. */
  defaultModel?: string;
  kind?: EnquiryKind;
  onInk?: boolean;
};

type Status = 'idle' | 'sending' | 'sent';

const PHONE_RE = /^[6-9]\d{9}$/;

/**
 * Every enquiry submits twice.
 *
 * 1. A POST to Web3Forms, so there is a permanent record the dealership can go
 *    back to even if a WhatsApp thread gets buried.
 * 2. A WhatsApp deep link with the enquiry already written out, so replying is
 *    one tap from the showroom floor.
 *
 * The WhatsApp window is opened inside the click handler, before any await, so
 * it is still inside the user gesture and never hits a popup blocker. The POST
 * runs with `keepalive` so it completes even as the browser hands off to the
 * WhatsApp app.
 *
 * No email field, and no OTP. This audience does not check email, and OTP adds
 * friction and cost for a dealership that has not yet had a lead-quality
 * problem — it is a phase-2 addition, not a launch requirement.
 */
export function EnquiryForm({ variant = 'lead', defaultModel, kind, onInk = false }: Props) {
  const { copy, locale } = useLocale();
  const pathname = usePathname();
  const uid = useId();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [model, setModel] = useState(defaultModel ?? '');
  const [date, setDate] = useState('');
  const [serviceType, setServiceType] = useState<'free' | 'paid' | 'repair'>('free');
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<{ name?: string; phone?: string; date?: string }>({});
  const [sentLink, setSentLink] = useState('');

  const enquiryKind: EnquiryKind =
    kind ?? (variant === 'service' ? 'service' : variant === 'finance' ? 'finance' : 'testRide');

  const payload = () => ({
    kind: enquiryKind,
    name,
    phone,
    model: model || undefined,
    date: variant === 'service' && date ? date : undefined,
    serviceType: variant === 'service' ? copy.service.types[serviceType] : undefined,
    sourcePath: pathname,
    locale,
  });

  function validate() {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = copy.form.errors.name;
    if (!PHONE_RE.test(phone.replace(/\D/g, ''))) next.phone = copy.form.errors.phone;
    if (variant === 'service' && !date) next.date = copy.form.errors.date;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;

    const data = payload();
    const link = whatsappLink(data);

    // Opened synchronously, inside the gesture, so the browser allows it.
    window.open(link, '_blank', 'noopener,noreferrer');
    setSentLink(link);
    setStatus('sending');

    try {
      await fetch(dealer.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          access_key: dealer.formAccessKey,
          subject: `Website enquiry — ${model || 'general'} — ${name}`,
          from_name: `${dealer.name} website`,
          name,
          phone: `+91${phone.replace(/\D/g, '')}`,
          model: model || '—',
          enquiry_type: enquiryKind,
          service_type: variant === 'service' ? serviceType : undefined,
          preferred_date: variant === 'service' ? date : undefined,
          page: pathname,
          language: locale,
          message: buildMessage(data),
        }),
      });
    } catch {
      // The WhatsApp message has already gone out — a failed POST costs the
      // record, not the lead, so it must never block the confirmation.
    }

    setStatus('sent');
  }

  const labelClass = onInk ? 'text-[color:var(--on-ink-muted)]' : 'text-[color:var(--ink-muted)]';
  // Error text has to clear 4.5:1 against whichever ground the form sits on.
  const errorClass = onInk ? 'text-tvsred-onink' : 'text-tvsred-onlight';
  const fieldClass = onInk
    ? 'field border-white/20 bg-graphite text-white placeholder:text-white/40 focus:border-white'
    : 'field';

  if (status === 'sent') {
    return (
      <div
        className={`rounded-sm border p-6 ${onInk ? 'border-white/15 bg-graphite' : 'border-rule bg-mist'}`}
        role="status"
      >
        <p className="font-display text-xl font-bold tracking-tightest">{copy.form.successHeading}</p>
        <p className={`mt-2 text-sm ${labelClass}`}>{copy.form.successBody}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={sentLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            {copy.form.successFallback}
          </a>
          <button
            type="button"
            className={onInk ? 'btn btn-on-ink' : 'btn btn-secondary'}
            onClick={() => {
              setStatus('idle');
              setName('');
              setPhone('');
            }}
          >
            {copy.actions.sendAgain}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <div>
        <label htmlFor={`${uid}-name`} className={`mb-1.5 block text-sm font-medium ${labelClass}`}>
          {copy.form.name}
        </label>
        <input
          id={`${uid}-name`}
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={copy.form.namePlaceholder}
          className={fieldClass}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? `${uid}-name-error` : undefined}
        />
        {errors.name ? (
          <p id={`${uid}-name-error`} className={`mt-1.5 text-sm font-medium ${errorClass}`}>
            {errors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${uid}-phone`} className={`mb-1.5 block text-sm font-medium ${labelClass}`}>
          {copy.form.phone}
        </label>
        <div className="flex">
          <span
            aria-hidden
            className={`inline-flex min-h-[52px] items-center rounded-l-sm border border-r-0 px-3 text-sm ${
              onInk ? 'border-white/20 bg-white/5 text-white/70' : 'border-rule bg-mist text-[color:var(--ink-muted)]'
            }`}
          >
            {copy.form.phonePrefix}
          </span>
          <input
            id={`${uid}-phone`}
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder={copy.form.phonePlaceholder}
            className={`${fieldClass} tnum rounded-l-none`}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? `${uid}-phone-error` : undefined}
          />
        </div>
        {errors.phone ? (
          <p id={`${uid}-phone-error`} className={`mt-1.5 text-sm font-medium ${errorClass}`}>
            {errors.phone}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${uid}-model`} className={`mb-1.5 block text-sm font-medium ${labelClass}`}>
          {variant === 'service' ? copy.form.vehicleModel : copy.form.model}
        </label>
        <select
          id={`${uid}-model`}
          name="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className={fieldClass}
        >
          <option value="">{copy.form.modelAny}</option>
          {byRank.map((vehicle) => (
            <option key={vehicle.slug} value={vehicle.name}>
              {vehicle.name}
            </option>
          ))}
        </select>
      </div>

      {variant === 'service' ? (
        <>
          <div>
            <label htmlFor={`${uid}-date`} className={`mb-1.5 block text-sm font-medium ${labelClass}`}>
              {copy.form.date}
            </label>
            <input
              id={`${uid}-date`}
              name="date"
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)}
              className={fieldClass}
              aria-invalid={errors.date ? true : undefined}
              aria-describedby={errors.date ? `${uid}-date-error` : undefined}
            />
            {errors.date ? (
              <p id={`${uid}-date-error`} className={`mt-1.5 text-sm font-medium ${errorClass}`}>
                {errors.date}
              </p>
            ) : null}
          </div>

          <fieldset>
            <legend className={`mb-1.5 block text-sm font-medium ${labelClass}`}>{copy.service.typeLabel}</legend>
            <div className="grid gap-2">
              {(['free', 'paid', 'repair'] as const).map((type) => (
                <label
                  key={type}
                  className={`tap flex cursor-pointer items-center gap-3 rounded-sm border px-4 py-3 text-sm ${
                    serviceType === type
                      ? 'border-ink bg-mist font-medium'
                      : 'border-rule bg-white text-[color:var(--ink-muted)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="serviceType"
                    value={type}
                    checked={serviceType === type}
                    onChange={() => setServiceType(type)}
                    className="h-4 w-4 accent-[color:var(--tvs-red)]"
                  />
                  {copy.service.types[type]}
                </label>
              ))}
            </div>
          </fieldset>
        </>
      ) : null}

      <button type="submit" className="btn btn-primary mt-2 w-full" disabled={status === 'sending'}>
        {status === 'sending'
          ? copy.actions.sending
          : variant === 'service'
            ? copy.actions.bookSlot
            : copy.actions.submit}
      </button>

      <p className={`text-xs leading-relaxed ${labelClass}`}>{copy.form.privacy}</p>
    </form>
  );
}
