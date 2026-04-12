export const Colors = {
  SUCCESS: 0x57f287,
  DANGER: 0xed4245,
  INFO: 0x5865f2,
  WARNING: 0xfee75c,
  STORY: 0x9b59b6,
  RPG: 0xf1c40f,
} as const;

export type ThemeColor = (typeof Colors)[keyof typeof Colors];
