/**
 * Decorative illustration shown when no real photo is available
 * (ข้าวกะเพราไก่ on a ceramic plate over green-grey linen).
 *
 * Drawn as inline SVG so the prototype needs no binary asset. It is
 * presentation-only, so it is exposed to assistive tech via `alt`.
 */
export function FoodPhoto({
  alt,
  className = '',
}: {
  alt: string
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 400 300"
      role="img"
      aria-label={alt}
      className={`h-full w-full ${className}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <title>{alt}</title>
      {/* linen backdrop */}
      <rect width="400" height="300" fill="#D9DED2" />
      <g stroke="#C8CFC0" strokeWidth="6" opacity="0.5">
        {Array.from({ length: 14 }).map((_, i) => (
          <line key={i} x1={-40 + i * 34} y1={0} x2={40 + i * 34} y2={300} />
        ))}
      </g>

      {/* plate */}
      <circle cx="200" cy="150" r="112" fill="#F2F1EC" />
      <circle cx="200" cy="150" r="112" fill="none" stroke="#DAD8CF" strokeWidth="3" />
      <circle cx="200" cy="150" r="92" fill="#FBFAF6" />

      {/* rice mound */}
      <path
        d="M120 168c0-30 36-52 80-52s80 22 80 52c0 20-20 30-80 30s-80-10-80-30z"
        fill="#FBFBF6"
        stroke="#E7E6DE"
        strokeWidth="2"
      />

      {/* basil chicken */}
      <g>
        <ellipse cx="205" cy="150" rx="62" ry="40" fill="#8A5A32" />
        <ellipse cx="196" cy="142" rx="34" ry="22" fill="#9C6A3C" />
        <ellipse cx="226" cy="160" rx="24" ry="16" fill="#7C4F2C" />
        {/* basil leaves */}
        <g fill="#4C7A3F">
          <ellipse cx="176" cy="132" rx="12" ry="7" transform="rotate(-25 176 132)" />
          <ellipse cx="228" cy="128" rx="12" ry="7" transform="rotate(20 228 128)" />
          <ellipse cx="244" cy="158" rx="11" ry="6" transform="rotate(35 244 158)" />
          <ellipse cx="170" cy="166" rx="11" ry="6" transform="rotate(-10 170 166)" />
        </g>
        {/* chilli */}
        <path
          d="M232 120c10 2 20 8 24 14"
          stroke="#B23A2E"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* fried egg */}
      <g>
        <ellipse cx="268" cy="196" rx="42" ry="30" fill="#FBFAF4" stroke="#E7E6DE" strokeWidth="2" />
        <circle cx="268" cy="194" r="16" fill="#E9B33F" />
        <circle cx="263" cy="189" r="5" fill="#F2CC70" opacity="0.9" />
      </g>
    </svg>
  )
}
