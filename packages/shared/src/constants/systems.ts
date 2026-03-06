export const SYSTEM_OPTIONS = [
  'Infor',
  'Almasons',
  'Picking Device',
  'ShipLinx',
  'Workflow',
  'PCS'
] as const;

export type SystemType = typeof SYSTEM_OPTIONS[number];
