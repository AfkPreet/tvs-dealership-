import type { Metadata } from 'next';
import { PageIntro } from '@/components/vehicles/PageIntro';
import { VehicleBrowser } from '@/components/vehicles/VehicleBrowser';
import { byRank } from '@/content/vehicles';

export const metadata: Metadata = {
  title: 'TVS scooters, bikes, mopeds and electric',
  description: `Every TVS model we stock in Bilaspur — ${byRank
    .map((v) => v.name.replace('TVS ', ''))
    .join(', ')} — with ex-showroom and full on-road prices.`,
};

export default function VehiclesPage() {
  return (
    <section className="section-light">
      <div className="shell py-12 xl:py-20">
        <PageIntro section="vehiclesPage" />
        <VehicleBrowser />
      </div>
    </section>
  );
}
