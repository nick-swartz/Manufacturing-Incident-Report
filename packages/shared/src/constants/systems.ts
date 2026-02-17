export const SYSTEM_OPTIONS = [
  'ERP System',
  'MES (Manufacturing Execution System)',
  'SCADA',
  'Quality Management System',
  'Warehouse Management System',
  'Inventory Management',
  'Production Planning',
  'Equipment Monitoring',
  'Safety Systems',
  'Environmental Controls',
  'Network Infrastructure',
  'Database Systems',
  'Other'
] as const;

export type SystemType = typeof SYSTEM_OPTIONS[number];
