import React from "react";

export default function FaceGateLogo({ size = 26, showText = true, className = "" }) {
  return (
    <div className={`fg-brand-mark ${className}`} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle glow / backdrop shield */}
          <rect
            x="2"
            y="2"
            width="28"
            height="28"
            rx="8"
            fill="#0f1117"
            stroke="rgba(245, 166, 35, 0.28)"
            strokeWidth="1.2"
          />
          {/* Biometric Aperture Corners / Gate brackets */}
          <path
            d="M7 11V8C7 7.44772 7.44772 7 8 7H11"
            stroke="#f5a623"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M21 7H24C24.5523 7 25 7.44772 25 8V11"
            stroke="#f5a623"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M25 21V24C25 24.5523 24.5523 25 24 25H21"
            stroke="#f5a623"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M11 25H8C7.44772 25 7 24.5523 7 24V21"
            stroke="#f5a623"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          
          {/* Facial contour / biometric nodes */}
          <path
            d="M11.5 14C11.5 11.5147 13.5147 9.5 16 9.5C18.4853 9.5 20.5 11.5147 20.5 14V17C20.5 19.4853 18.4853 21.5 16 21.5C13.5147 21.5 11.5 19.4853 11.5 17V14Z"
            stroke="#e2e8f0"
            strokeWidth="1.4"
            strokeDasharray="2 1.5"
            strokeOpacity="0.75"
          />
          {/* Center scan beam cross & verification pulse */}
          <circle cx="16" cy="15.5" r="2.2" fill="#f5a623" />
          <line x1="12" y1="15.5" x2="20" y2="15.5" stroke="#f5a623" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="16" y1="11.5" x2="16" y2="19.5" stroke="#f5a623" strokeWidth="1" strokeOpacity="0.5" />
        </svg>
      </div>

      {showText && (
        <span
          style={{
            fontWeight: 800,
            fontSize: Math.max(15, size * 0.72),
            letterSpacing: "-0.03em",
            color: "var(--fg-logo-text, #ffffff)",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Face<span style={{ color: "var(--accent, #f5a623)" }}>Gate</span>
          <span
            style={{
              display: "inline-block",
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--accent, #f5a623)",
              marginLeft: 3,
              boxShadow: "0 0 8px rgba(245, 166, 35, 0.8)",
            }}
          />
        </span>
      )}
    </div>
  );
}
