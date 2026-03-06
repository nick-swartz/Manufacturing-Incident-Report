import { Queue } from '../types/incident';

export const QUEUE_OPTIONS: Array<{ value: Queue; label: string; description: string }> = [
  {
    value: 'manufacturing',
    label: 'Manufacturing Incident',
    description: 'Equipment failures, production issues, and manufacturing floor incidents'
  },
  {
    value: 'erp-support',
    label: 'ERP Support Request',
    description: 'ERP system issues, access requests, and business process support'
  }
];

export const QUEUE_LABELS: Record<Queue, string> = {
  manufacturing: 'Manufacturing Incident',
  'erp-support': 'ERP Support Request'
};
