import React from "react";

export type IconName =
  | "clock"
  | "home"
  | "menu"
  | "tag"
  | "wifi"
  | "share"
  | "trophy"
  | "gamepad"
  | "users"
  | "plus"
  | "chat"
  | "gift"
  | "arrowDown";

const PATHS: Record<IconName, React.ReactNode> = {
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </>
  ),
  home: <path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10M10 19.5v-5h4v5" />,
  menu: (
    <>
      <path d="M7 3v7a2 2 0 0 0 4 0V3M9 3v18" />
      <path d="M17 21V3c-2.2 1.6-3 4.2-3 7.5h3" />
    </>
  ),
  tag: (
    <>
      <path d="M3.5 12.5 12 4h7.5v7.5L11 20z" />
      <circle cx="15.5" cy="8.5" r="1.3" />
    </>
  ),
  wifi: (
    <>
      <path d="M2.5 9.5a14 14 0 0 1 19 0M5.8 13a9.3 9.3 0 0 1 12.4 0M9 16.4a4.6 4.6 0 0 1 6 0" />
      <circle cx="12" cy="19.4" r="0.9" />
    </>
  ),
  share: (
    <>
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="17.5" cy="5.5" r="2.6" />
      <circle cx="17.5" cy="18.5" r="2.6" />
      <path d="M8.3 10.7l6.9-3.9M8.3 13.3l6.9 3.9" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 5.5H3.8c0 3 1.3 4.7 3.6 5M17 5.5h3.2c0 3-1.3 4.7-3.6 5M12 14v3.5M8.5 20.5h7M9.5 17.5h5" />
    </>
  ),
  gamepad: (
    <>
      <path d="M7.5 7h9a5 5 0 0 1 4.9 4.1l.6 3.6a2.6 2.6 0 0 1-4.6 2l-1.6-2H8.2l-1.6 2a2.6 2.6 0 0 1-4.6-2l.6-3.6A5 5 0 0 1 7.5 7z" />
      <path d="M8 10v3.4M6.3 11.7h3.4" />
      <circle cx="15.2" cy="10.6" r="0.7" />
      <circle cx="17.3" cy="12.8" r="0.7" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.4 2.7-6 6-6s6 2.6 6 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16.5 14.2c2.6.2 4.5 2.4 4.5 5.3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  chat: <path d="M4 5h16v11H10.5L6 20v-4H4z" />,
  gift: (
    <>
      <path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13" />
      <path d="M12 7c-1.2-3.4-5.2-3.6-5.2-1.2C6.800 7 9.500 7 12 7zm0 0c1.200-3.400 5.200-3.600 5.200-1.200C17.200 7 14.500 7 12 7z" />
    </>
  ),
  arrowDown: <path d="M12 4v15M5.5 12.500 12 19l6.500-6.500" />,
};

export const Icon: React.FC<{
  readonly name: IconName;
  readonly size?: number;
  readonly color?: string;
  readonly strokeWidth?: number;
  readonly style?: React.CSSProperties;
}> = ({ name, size = 40, color = "currentColor", strokeWidth = 2.2, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, ...style }}
  >
    {PATHS[name]}
  </svg>
);
