import type { Metadata } from 'next';
import { dealer, placeLine } from '@/content/dealer';
import { PageIntro } from '@/components/vehicles/PageIntro';
import { ServiceBooking } from '@/components/service/ServiceSections';

export const metadata: Metadata = {
  title: `Book a TVS service in ${placeLine}`,
  description: `Book a free service, a paid periodic service or a repair at an authorised TVS workshop on ${dealer.address.line2} in ${dealer.city}. Factory-trained technicians, genuine parts, warranty kept valid.`,
};

export default function ServicePage() {
  return (
    <section className="section-light">
      <div className="shell py-12 xl:py-20">
        <PageIntro section="service" />
        <ServiceBooking />
      </div>
    </section>
  );
}
