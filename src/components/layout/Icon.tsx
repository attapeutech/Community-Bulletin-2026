interface IconProps {
  size?: number;
  className?: string;
}

export function Icon({ size = 64, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* window background */}
      <rect x="2" y="2" width="60" height="60" rx="12" fill="#E8EFF6" />
      {/* window pane dividers */}
      <line x1="32" y1="2" x2="32" y2="62" stroke="#D0DCE8" strokeWidth="2.5" />
      <line x1="2" y1="32" x2="62" y2="32" stroke="#D0DCE8" strokeWidth="2.5" />
      {/* screen body */}
      <rect x="11" y="9" width="42" height="27" rx="4" fill="#1A3A5C" />
      {/* screen display area */}
      <rect x="14" y="12" width="36" height="21" rx="2.5" fill="#0F3557" />
      {/* ad content lines */}
      <rect x="17" y="15" width="22" height="3.5" rx="1.5" fill="#4A90C4" opacity="0.9" />
      <rect x="17" y="21" width="30" height="2.5" rx="1" fill="#7DB8DC" opacity="0.7" />
      <rect x="17" y="26" width="24" height="2.5" rx="1" fill="#7DB8DC" opacity="0.5" />
      {/* live indicator dot */}
      <circle cx="44" cy="15" r="2.2" fill="#E8563A" />
      {/* wall mount bracket */}
      <rect x="29" y="36" width="6" height="3.5" rx="1" fill="#1A3A5C" />
      {/* community people */}
      <circle cx="19" cy="49" r="5" fill="#1A3A5C" />
      <rect x="13" y="55" width="12" height="8" rx="4" fill="#1A3A5C" />
      <circle cx="32" cy="47" r="6" fill="#E8563A" />
      <rect x="25" y="53" width="14" height="9" rx="5" fill="#E8563A" />
      <circle cx="45" cy="49" r="5" fill="#1A3A5C" />
      <rect x="39" y="55" width="12" height="8" rx="4" fill="#1A3A5C" />
    </svg>
  );
}
