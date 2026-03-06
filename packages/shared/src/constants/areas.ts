export const AFFECTED_AREAS = [
  'Assembly Line 1',
  'Assembly Line 2',
  'Assembly Line 3',
  'Assembly Line 4',
  'Packaging Department',
  'Quality Control',
  'Warehouse - Receiving',
  'Warehouse - Shipping',
  'Conveyor System A',
  'Conveyor System B',
  'Paint Shop',
  'Machining Department',
  'Welding Station',
  'Raw Materials Storage',
  'Finished Goods Storage',
  'Maintenance Workshop',
  'Loading Dock',
  'Production Floor - East',
  'Production Floor - West',
  'Break Room',
  'Office Area',
  'Other'
] as const;

export type AffectedArea = typeof AFFECTED_AREAS[number];
