export default function Bean({ color, className = 'bean' }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 120 150" className={className} aria-hidden="true">
      <ellipse cx="60" cy="75" rx="46" ry="62" fill={color} className="bean-body" />
      <path d="M60 16 C 40 50, 80 100, 60 134" stroke="rgba(20,10,5,.55)" strokeWidth="6" fill="none" strokeLinecap="round" />
      <ellipse cx="42" cy="52" rx="10" ry="20" fill="rgba(255,255,255,.14)" transform="rotate(-18 42 52)" />
    </svg>
  )
}
