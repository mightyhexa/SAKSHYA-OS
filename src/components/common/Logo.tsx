import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const SakshyaLogo: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="shieldGrad" x1="24" y1="4" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14213D" />
          <stop offset="1" stopColor="#0B132B" />
        </linearGradient>
        <linearGradient id="goldAccent" x1="16" y1="14" x2="32" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FCA311" />
          <stop offset="1" stopColor="#E87722" />
        </linearGradient>
      </defs>

      {/* Outer Protective Shield */}
      <path
        d="M24 4L8 10V22C8 32.5 14.8 42.1 24 44C33.2 42.1 40 32.5 40 22V10L24 4Z"
        fill="url(#shieldGrad)"
        stroke="#E87722"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Inner Guard Contour */}
      <path
        d="M24 8L12 13V22C12 30.2 17.1 37.8 24 39.5C30.9 37.8 36 30.2 36 22V13L24 8Z"
        stroke="#2E8B57"
        strokeWidth="1.5"
        strokeDasharray="2 2"
        fill="none"
        opacity="0.8"
      />

      {/* Keyhole: Circular top */}
      <circle cx="24" cy="20" r="4.2" fill="url(#goldAccent)" stroke="#FFFFFF" strokeWidth="1" />

      {/* Keyhole: Flared bottom slot */}
      <path
        d="M22.2 22.8L20.8 30.5C20.6 31.4 21.3 32.2 22.2 32.2H25.8C26.7 32.2 27.4 31.4 27.2 30.5L25.8 22.8H22.2Z"
        fill="url(#goldAccent)"
        stroke="#FFFFFF"
        strokeWidth="1"
      />

      {/* Center cryptographic pin dot */}
      <circle cx="24" cy="20" r="1.5" fill="#14213D" />
    </svg>
  );
};
