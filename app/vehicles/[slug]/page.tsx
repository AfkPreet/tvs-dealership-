import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { vehicles, getVehicle, priceFrom } from '@/content/vehicles';
import { formatINR } from '@/lib/format';
import { VehicleDetail } from '@/components/vehicles/VehicleDetail';

type Params = { params: Promise<{ slug: string }> };

/** One statically exported page per model. */
export function generateStaticParams() {
  return vehicles.map((vehicle) => ({ slug: vehicle.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = getVehicle(slug);
  if (!vehicle) return {};

  return {
    title: `${vehicle.name} price, specs and on-road cost`,
    description: `${vehicle.name} from ${formatINR(priceFrom(vehicle))} ex-showroom, ${formatINR(
      vehicle.onRoad.total,
    )} on-road in Bilaspur. Full breakdown, variants, specifications and indicative EMI. ${vehicle.tagline.en}`,
  };
}

export default async function VehiclePage({ params }: Params) {
  const { slug } = await params;
  const vehicle = getVehicle(slug);
  if (!vehicle) notFound();

  return <VehicleDetail vehicle={vehicle} />;
}
