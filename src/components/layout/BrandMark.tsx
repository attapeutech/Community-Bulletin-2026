interface BrandMarkProps {
  size?: number;
  className?: string;
}

// The logo mark: "CB" on a screen with a pin (public/brand/logo-mark.svg, same as the favicon)
export function BrandMark({ size = 40, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Community Bulletin"
    >
      <rect width="128" height="128" rx="26" fill="#1A3A5C" />
      <g transform="translate(0 -1.8)">
        <rect x="20" y="38" width="88" height="58" rx="9" fill="none" stroke="#FFFFFF" strokeWidth="4" />
        <rect x="56" y="96" width="16" height="8" fill="#FFFFFF" />
        <rect x="46" y="103" width="36" height="6" rx="3" fill="#FFFFFF" />
        <path fill="#FFFFFF" d="M52.908 80.504Q48.228 80.504 45.492 77.894Q42.756 75.284 42.756 70.424V64.376Q42.756 59.516 45.492 56.906Q48.228 54.296 52.908 54.296Q57.552 54.296 60.09 56.834Q62.628 59.372 62.628 63.8V64.016H57.948V63.656Q57.948 61.424 56.706 59.984Q55.464 58.544 52.908 58.544Q50.388 58.544 48.948 60.092Q47.508 61.64 47.508 64.304V70.496Q47.508 73.124 48.948 74.69Q50.388 76.256 52.908 76.256Q55.464 76.256 56.706 74.798Q57.948 73.34 57.948 71.144V70.496H62.628V71.0Q62.628 75.428 60.09 77.966Q57.552 80.504 52.908 80.504Z" />
        <path fill="#E8563A" d="M64.796 80.0V75.824H68.108V58.976H64.796V54.8H77.756Q80.06 54.8 81.77 55.574Q83.48 56.348 84.434 57.77Q85.388 59.192 85.388 61.172V61.532Q85.388 63.26 84.74 64.358Q84.092 65.456 83.21 66.05Q82.328 66.644 81.536 66.896V67.544Q82.328 67.76 83.264 68.354Q84.2 68.948 84.866 70.064Q85.532 71.18 85.532 72.98V73.34Q85.532 75.428 84.56 76.922Q83.588 78.416 81.878 79.208Q80.168 80.0 77.9 80.0ZM72.86 75.68H77.324Q78.872 75.68 79.826 74.924Q80.78 74.168 80.78 72.764V72.404Q80.78 71.0 79.844 70.244Q78.908 69.488 77.324 69.488H72.86ZM72.86 65.168H77.252Q78.728 65.168 79.682 64.412Q80.636 63.656 80.636 62.324V61.964Q80.636 60.596 79.7 59.858Q78.764 59.12 77.252 59.12H72.86Z" />
        <g transform="translate(64 44) rotate(45) scale(0.52)" fill="#E8563A" stroke="#FFFFFF" strokeWidth="4.5" strokeLinejoin="round">
          <path d="M-3.5 -16 L3.5 -16 L0 0 Z" fill="#AEB8C8" />
          <ellipse cx="0" cy="-18" rx="16" ry="5" />
          <path d="M-9 -20 C-8 -28 -7 -33 -6 -38 L6 -38 C7 -33 8 -28 9 -20 C5 -17.5 -5 -17.5 -9 -20 Z" />
          <ellipse cx="0" cy="-41" rx="12" ry="5" />
        </g>
      </g>
    </svg>
  );
}
