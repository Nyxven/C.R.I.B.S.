export function Logo({ size = 40, animate = false, white = false }: { size?: number; animate?: boolean; white?: boolean }) {
  const stroke = white ? "#fff" : "url(#cribsGrad)";
  const dash = animate ? { strokeDasharray: 200, strokeDashoffset: 200, animation: "draw 1.4s ease forwards" } : {};
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" role="img" aria-label="C.R.I.B.S. logo">
      <defs>
        <linearGradient id="cribsGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8E7BD1" /><stop offset=".5" stopColor="#EF7E9E" /><stop offset="1" stopColor="#F1743E" />
        </linearGradient>
      </defs>
      <path
        d="M10 15.3c-3.7 0-6.3 2.8-6.3 6.3s2.7 6.3 6.3 6.3c3 0 5-1.7 7-4.3l6-8c2-2.6 4-4.3 7-4.3 3.7 0 6.3 2.8 6.3 6.3s-2.7 6.3-6.3 6.3c-3 0-5-1.7-7-4.3"
        stroke={stroke} strokeWidth="3" strokeLinecap="round" style={dash}
      />
      <circle cx="20" cy="11" r="2.3" fill={stroke} style={animate ? { animation: "floaty 2s ease-in-out infinite" } : {}} />
    </svg>
  );
}
