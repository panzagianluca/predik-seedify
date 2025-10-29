'use client'

interface LogoSpinnerProps {
  size?: number
  className?: string
}

export function LogoSpinner({ size = 80, className = '' }: LogoSpinnerProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 223 223"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Static circle */}
        <circle
          cx="111.5"
          cy="111.5"
          r="99.1111"
          stroke="currentColor"
          strokeWidth="24.7778"
          className="text-electric-purple"
        />

        {/* Orbiting curved line using SVG animateTransform */}
        <g>
          <path
            d="M52.1906 132.852C61.6799 151.831 71.1693 161.32 90.148 170.809"
            stroke="currentColor"
            strokeWidth="24.7778"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-electric-purple"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 111.5 111.5"
            to="360 111.5 111.5"
            dur="1.2s"
            repeatCount="indefinite"
            calcMode="spline"
            keyTimes="0;1"
            keySplines="0.45 0 0.55 1"
          />
        </g>
      </svg>
    </div>
  )
}
