import type { Metadata } from 'next';
import { PageIntro } from '@/components/vehicles/PageIntro';
import { ServiceBooking } from '@/components/service/ServiceSections';

export const metadata: Metadata = {
  title: 'Book a TVS service in Bilaspur',
  description:
    'Book a free service, a paid periodic service or a repair at an authorised TVS workshop on Vyapar Vihar Road, Bilaspur. Factory-trained technicians, genuine parts, warranty kept valid.',
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
