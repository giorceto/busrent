type P = { className?: string; size?: number };

const base = (size = 20) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const LogoMark = ({ className, size = 22 }: P) => (
  <svg {...base(size)} strokeWidth={2} className={className}>
    <rect x="3" y="4" width="18" height="13" rx="3" />
    <path d="M3 11h18M8 17v2M16 17v2" />
  </svg>
);
export const Check = ({ className, size }: P) => (
  <svg {...base(size)} strokeWidth={2.6} className={className}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
export const Cross = ({ className, size }: P) => (
  <svg {...base(size)} strokeWidth={2.6} className={className}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const Search = ({ className, size }: P) => (
  <svg {...base(size)} strokeWidth={2.4} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4-4" />
  </svg>
);
export const Shield = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);
export const Clock = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const Chevron = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);
export const Warning = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3l9 16H3z" />
    <path d="M12 10v4M12 17h.01" />
  </svg>
);

export const BusDrawing = ({ className, width = 140 }: { className?: string; width?: number }) => (
  <svg
    viewBox="0 0 96 48"
    width={width}
    height={width / 2}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinejoin="round"
    aria-hidden
    className={className}
  >
    <rect x="4" y="6" width="88" height="30" rx="6" />
    <path d="M4 20h88M20 6v14M38 6v14M56 6v14M74 6v14" />
    <circle cx="22" cy="38" r="5" fill="#fff" />
    <circle cx="74" cy="38" r="5" fill="#fff" />
  </svg>
);
