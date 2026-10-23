interface BrandMarkProps {
  size?: number;
  className?: string;
}

// "CB" monogram — same design as the favicon (src/app/icon.png)
export function BrandMark({ size = 40, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="CommunityBulletin"
    >
      <rect width="512" height="512" rx="112" fill="#1A3A5C" />
      <text
        x="256"
        y="350"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="700"
        fontSize="290"
        letterSpacing="-12"
      >
        <tspan fill="#FFFFFF">C</tspan>
        <tspan fill="#E8563A">B</tspan>
      </text>
    </svg>
  );
}
