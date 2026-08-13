import { Hero } from '@/components/home/Hero';
import {
  ModelShortlist,
  EmiTeaser,
  WhyBuyHere,
  LocationSection,
  EnquirySection,
} from '@/components/home/HomeSections';

/**
 * Section order is the business priority order: capture the lead, show what to
 * buy, kill the affordability objection, build credibility, say where we are,
 * and end on an action.
 *
 * Service is deliberately not here. It gets one quiet link in the nav and one in
 * the footer — it will matter in month nine, not month one.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ModelShortlist />
      <EmiTeaser />
      <WhyBuyHere />
      <LocationSection />
      <EnquirySection />
    </>
  );
}
