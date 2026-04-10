import { useMemo, useState } from "react";

export function buildFaviconCandidates(domain: string): string[] {
  const safeDomain = domain.trim();
  return [
    `https://icons.duckduckgo.com/ip3/${safeDomain}.ico`,
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(safeDomain)}&sz=64`,
    `https://icon.horse/icon/${safeDomain}`,
  ];
}

interface FaviconIconProps {
  domain: string;
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  fallbackClassName?: string;
}

export function FaviconIcon({
  domain,
  name,
  size = 20,
  className = "",
  style,
  fallbackClassName = "",
}: FaviconIconProps) {
  const candidates = useMemo(() => buildFaviconCandidates(domain), [domain]);
  const [idx, setIdx] = useState(0);

  if (idx >= candidates.length) {
    return (
      <div
        className={`flex items-center justify-center font-bold text-gray-700 shadow-sm bg-white/40 ${fallbackClassName}`}
        style={{ width: size, height: size, borderRadius: size * 0.25, fontSize: size * 0.45, ...style }}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={candidates[idx]}
      alt={name}
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: size * 0.2, ...style }}
      onError={() => setIdx((prev) => prev + 1)}
      draggable={false}
    />
  );
}

