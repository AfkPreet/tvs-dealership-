import { cardImage, type Vehicle } from '@/content/vehicles';

/**
 * A model's photograph, or a deliberate stand-in when there isn't one.
 *
 * Official photography is collected per model and per colour by the asset
 * pipeline. Until a model has a picture, this renders a typeset plate on ink
 * rather than a broken image or an empty box — it reads as a design choice, the
 * layout does not shift when the real photo lands, and nobody is shown a bike
 * that is not the one they clicked.
 */
export function VehiclePhoto({
  vehicle,
  src,
  eager = false,
  sizes,
  className = '',
  ratio = 'aspect-[5/3]',
}: {
  vehicle: Vehicle;
  /** Overrides the model's own image — used by the colour stage. */
  src?: string;
  eager?: boolean;
  sizes?: string;
  className?: string;
  ratio?: string;
}) {
  const image = src ?? cardImage(vehicle);

  if (!image) {
    return (
      <div
        className={`${ratio} flex w-full flex-col items-center justify-center gap-3 bg-ink px-6 text-center ${className}`}
        data-photo-placeholder
      >
        <span aria-hidden="true" className="block h-px w-10 bg-[color:var(--tvs-red)]" />
        <span className="font-display text-2xl font-bold leading-none tracking-tightest text-white">
          {vehicle.name}
        </span>
        <span aria-hidden="true" className="block h-px w-10 bg-[color:var(--tvs-red)]" />
      </div>
    );
  }

  return (
    <img
      src={image}
      alt=""
      width={1600}
      height={960}
      loading={eager ? 'eager' : 'lazy'}
      // The hero photo on a model page is the LCP element; everything else waits.
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      sizes={sizes}
      className={`${ratio} w-full bg-ink object-cover ${className}`}
    />
  );
}
