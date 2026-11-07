// The full logo (mark + "COMMUNITY BULLETIN.com"), 403 × 128: public/brand/logo.svg for light
// backgrounds, logo-dark.svg (white "COMMUNITY") for navy ones. "auto" follows the site's dark mode.
export function BrandLogo({ tone = "auto", height = 40, className }: {
  tone?: "light" | "dark" | "auto";
  height?: number;
  className?: string;
}) {
  const width = Math.round((height * 402.6) / 128);
  const img = (src: string, extra = "") => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Community Bulletin" width={width} height={height} className={`shrink-0 ${extra} ${className ?? ""}`} style={{ height, width: "auto" }} />
  );
  if (tone === "light") return img("/brand/logo.svg");
  if (tone === "dark") return img("/brand/logo-dark.svg");
  return (
    <>
      {img("/brand/logo.svg", "dark:hidden")}
      {img("/brand/logo-dark.svg", "hidden dark:block")}
    </>
  );
}
