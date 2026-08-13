'use client';

import { useId, useMemo, useState } from 'react';
import { useLocale } from '@/lib/locale';
import { byRank } from '@/content/vehicles';
import { calculateEmi, EMI_DEFAULTS } from '@/lib/emi';
import { formatINR } from '@/lib/format';
import { NumberRoll } from '@/components/ui/NumberRoll';

const PRICE_MIN = 40_000;
const PRICE_MAX = 2_00_000;

/**
 * The working EMI calculator.
 *
 * Reducing-balance, updating live, no submit button. Everything here is
 * presented as indicative: it is not an offer, a quote or an approval, and the
 * disclaimer says so in both languages.
 *
 * The inputs deliberately carry no motion. The one thing that moves is the
 * output figure, because seeing it change is what confirms the input landed.
 */
export function EmiCalculator() {
  const { copy } = useLocale();
  const uid = useId();

  const [price, setPrice] = useState(byRank[0].onRoad.total);
  const [downPayment, setDownPayment] = useState(Math.round(byRank[0].onRoad.total * 0.2));
  const [months, setMonths] = useState(EMI_DEFAULTS.months);
  const [rate, setRate] = useState(EMI_DEFAULTS.annualRate);

  const result = useMemo(
    () => calculateEmi({ price, downPayment: Math.min(downPayment, price), months, annualRate: rate }),
    [price, downPayment, months, rate],
  );

  const downPercent = price > 0 ? Math.round((Math.min(downPayment, price) / price) * 100) : 0;

  const setVehicle = (slug: string) => {
    const vehicle = byRank.find((v) => v.slug === slug);
    if (!vehicle) return;
    setPrice(vehicle.onRoad.total);
    setDownPayment(Math.round(vehicle.onRoad.total * 0.2));
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)] xl:gap-12">
      <div>
        <h2 className="text-2xl font-extrabold md:text-3xl">{copy.finance.calcHeading}</h2>

        <div className="mt-6 grid gap-6">
          <div>
            <label htmlFor={`${uid}-vehicle`} className="mb-1.5 block text-sm font-medium">
              {copy.form.model}
            </label>
            <select
              id={`${uid}-vehicle`}
              className="field"
              defaultValue={byRank[0].slug}
              onChange={(e) => setVehicle(e.target.value)}
            >
              {byRank.map((vehicle) => (
                <option key={vehicle.slug} value={vehicle.slug}>
                  {vehicle.name} — {formatINR(vehicle.onRoad.total)}
                </option>
              ))}
            </select>
          </div>

          <SliderField
            id={`${uid}-price`}
            label={copy.finance.price}
            value={price}
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={500}
            display={formatINR(price)}
            onChange={(next) => {
              setPrice(next);
              if (downPayment > next) setDownPayment(next);
            }}
          />

          <SliderField
            id={`${uid}-down`}
            label={copy.finance.downPayment}
            value={Math.min(downPayment, price)}
            min={0}
            max={price}
            step={500}
            display={formatINR(Math.min(downPayment, price))}
            hint={copy.finance.downPaymentPercent(downPercent)}
            onChange={setDownPayment}
          />

          <fieldset>
            <legend className="mb-2 block text-sm font-medium">{copy.finance.tenure}</legend>
            <div className="grid grid-cols-4 gap-2">
              {EMI_DEFAULTS.tenureOptions.map((option) => (
                <label
                  key={option}
                  className={`tap flex cursor-pointer items-center justify-center rounded-sm border text-sm font-medium ${
                    months === option ? 'border-ink bg-ink text-white' : 'border-rule bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="tenure"
                    value={option}
                    checked={months === option}
                    onChange={() => setMonths(option)}
                    className="sr-only"
                  />
                  <span className="tnum">{option}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-[color:var(--ink-muted)]">{copy.finance.months}</p>
          </fieldset>

          <SliderField
            id={`${uid}-rate`}
            label={copy.finance.rate}
            value={rate}
            min={EMI_DEFAULTS.rateMin}
            max={EMI_DEFAULTS.rateMax}
            step={0.1}
            display={`${rate.toFixed(1)}%`}
            hint={copy.finance.perAnnum}
            onChange={setRate}
          />
        </div>
      </div>

      <div className="xl:sticky xl:top-28">
        <div className="rounded-sm border border-rule bg-white p-6 xl:p-8">
          <p className="eyebrow text-[color:var(--ink-muted)]">{copy.finance.emi}</p>
          <p
            data-testid="emi-output"
            className="mt-2 font-display text-5xl font-extrabold tracking-tightest text-tvsred-onlight xl:text-6xl"
          >
            <NumberRoll value={result.emi} />
          </p>

          <dl className="mt-6">
            <div className="sheet-row">
              <dt className="text-sm text-[color:var(--ink-muted)]">{copy.finance.loanAmount}</dt>
              <dd className="tnum font-medium">{formatINR(result.principal)}</dd>
            </div>
            <div className="sheet-row">
              <dt className="text-sm text-[color:var(--ink-muted)]">{copy.finance.totalInterest}</dt>
              <dd className="tnum font-medium">
                <NumberRoll value={result.totalInterest} />
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t-2 border-ink pt-4">
              <dt className="font-semibold">{copy.finance.totalPayable}</dt>
              <dd className="tnum font-display text-2xl font-bold tracking-tightest">
                <NumberRoll value={result.totalPayable + Math.min(downPayment, price)} />
              </dd>
            </div>
          </dl>

          <p className="mt-5 text-xs leading-relaxed text-[color:var(--ink-muted)]">{copy.finance.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}

function SliderField({
  id,
  label,
  value,
  min,
  max,
  step,
  display,
  hint,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  hint?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <span className="tnum font-display text-lg font-bold tracking-tightest">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="tap h-11 w-full cursor-pointer accent-[color:var(--tvs-red)]"
      />
      {hint ? <p className="mt-1 text-xs text-[color:var(--ink-muted)]">{hint}</p> : null}
    </div>
  );
}
