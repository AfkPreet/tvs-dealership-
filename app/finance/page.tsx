import type { Metadata } from 'next';
import { PageIntro } from '@/components/vehicles/PageIntro';
import { EmiCalculator } from '@/components/finance/EmiCalculator';
import { TradeoffExplainer, FinanceEnquiry } from '@/components/finance/FinanceSections';

export const metadata: Metadata = {
  title: 'TVS two-wheeler finance and EMI calculator, Bilaspur',
  description:
    'Work out your monthly EMI on any TVS model with a proper reducing-balance calculator. Documents checklist, down payment guidance and an on-site finance desk. All figures indicative.',
};

export default function FinancePage() {
  return (
    <>
      <section className="section-light">
        <div className="shell py-12 xl:py-20">
          <PageIntro section="finance" />
          <div className="mt-10">
            <EmiCalculator />
          </div>
        </div>
      </section>
      <TradeoffExplainer />
      <FinanceEnquiry />
    </>
  );
}
