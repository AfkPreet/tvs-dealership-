import { cardImage, imageSize, imageSrcSet, type Vehicle } from '@/content/vehicles';

/**
 * A model's photograph, or a deliberate stand-in when there isn't one.
 *
 * Official photography is collected per model and per colour by the asset
 * pipeline. Until a model has a picture, this renders a typeset plate on ink
 * rather than a broken image or an empty box — it reads as a design choice, the
 * layout does not shift when the real photo lands, and nobody is shown a bike
 * that is not the one they clicked.
 *
 * TVS shoots on white. Putting those on the near-black card ground would show a
 * white rectangle with a bike in it, so the photograph gets its own light plate
 * and the dark surface frames it. The plate is the design, not a workaround: it
 * is the same treatment a printed price list uses.
 */
export function VehiclePhoto({
  vehicle,
  src,
  eager = false,
  priority = false,
  sizes,
  className = '',
  ratio = 'aspect-[5/3]',
}: {
  vehicle: Vehicle;
  /** Overrides the model's own image — used by the colour stage. */
  src?: string;
  /** Load immediately rather than when scrolled to. */
  eager?: boolean;
  /** Ask the browser to fetch this ahead of everything else. LCP only. */
  priority?: boolean;
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

  const { width, height } = imageSize(image);

  return (
    <img
      src={image}
      srcSet={imageSrcSet(image)}
      alt=""
      width={width}
      height={height}
      loading={eager ? 'eager' : 'lazy'}
      // Eager and high-priority are different questions. A rail card must not
      // wait for a sideways scroll, but it is not the largest thing on the
      // screen either, and marking five of them high would push the real
      // candidate down the queue.
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      sizes={sizes}
      // `contain`, not `cover`: these are studio shots of a whole vehicle and
      // cropping one to fill a box cuts a wheel off.
      className={`${ratio} photo-ground w-full object-contain ${className}`}
    />
  );
}
