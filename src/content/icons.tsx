type IconProps = { size?: number };

function baseProps(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: 'false' as const,
  };
}

export function PanelMarkIcon({ size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size)} stroke="none">
      <rect
        x="2.75"
        y="3.75"
        width="18.5"
        height="16.5"
        rx="3.5"
        fill="none"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.6"
      />
      <rect x="12.75" y="6.25" width="5.75" height="11.5" rx="2" fill="#ffffff" />
    </svg>
  );
}

export function XIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function BookmarkIcon({ size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <path d="M6.5 4.5h11a1 1 0 0 1 1 1v14.2a.5.5 0 0 1-.8.4L12 16l-5.7 4.1a.5.5 0 0 1-.8-.4V5.5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export function CheckIcon({ size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <path d="m4.5 12.5 4.5 4.5L19.5 6.5" />
    </svg>
  );
}

export function CopyIcon({ size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" />
    </svg>
  );
}

export function ExternalLinkIcon({ size = 15 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <path d="M14 4h6v6M20 4l-8.5 8.5" />
      <path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
    </svg>
  );
}

export function TrashIcon({ size = 15 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <path d="M4.5 7h15M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

export function EmptyPanelIcon({ size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size)}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M15 4v16" />
    </svg>
  );
}
