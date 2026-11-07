interface BrandMarkProps {
  size?: number;
  className?: string;
}

// The logo mark: "CB" on a screen with a 3D pin (public/brand/logo-mark-256.png)
export function BrandMark({ size = 40, className }: BrandMarkProps) {
  return (
    <img
      src="/brand/logo-mark-256.png"
      width={size}
      height={size}
      alt="Community Bulletin"
      className={className}
      draggable={false}
    />
  );
}
