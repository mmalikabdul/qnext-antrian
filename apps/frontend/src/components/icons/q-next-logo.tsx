import type { SVGProps } from "react";

const QNextLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"    width="24"
    height="24"

    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" />
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    <path d="m14 14 4 4" />
    <text
        x="12"
        y="12"
        fontFamily="sans-serif"
        fontSize="8"
        fill="currentColor"
        textAnchor="middle"
        dy="2.5"
    >
        Q
    </text>
  </svg>
);

export default QNextLogo;
