// Deterministic, lightweight product placeholder.
// Each product gets a unique gradient based on its imageHue so the storefront
// looks intentional without needing real photos. Will be replaced with
// uploaded product images in a later wave.

type Props = {
  hue: number;
  label: string;
  className?: string;
};

export function ProductImage({ hue, label, className }: Props) {
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const bg = `linear-gradient(135deg, hsl(${hue} 35% 92%), hsl(${(hue + 30) % 360} 25% 80%))`;
  const fg = `hsl(${hue} 30% 28%)`;

  return (
    <div
      aria-hidden
      className={
        "relative flex h-full w-full items-center justify-center overflow-hidden " +
        (className ?? "")
      }
      style={{ background: bg }}
    >
      <span
        className="font-display text-3xl font-bold tracking-tight opacity-60"
        style={{ color: fg }}
      >
        {initials}
      </span>
    </div>
  );
}
