import type { Metadata } from 'next';
import { dealer, dealerFullName, placeLine } from '@/content/dealer';
import {
  AboutIntro,
  AboutStory,
  AboutOpening,
  AboutTeam,
  AboutVisit,
} from '@/components/about/AboutSections';

export const metadata: Metadata = {
  title: 'About the showroom',
  description: `${dealerFullName}. A TVS showroom on ${dealer.address.line2} in ${placeLine}, selling, registering and servicing two-wheelers in the same building.`,
  alternates: { canonical: '/about/' },
};

export default function AboutPage() {
  return (
    <>
      <AboutIntro />
      <AboutStory />
      <AboutOpening />
      <AboutTeam />
      <AboutVisit />
    </>
  );
}
