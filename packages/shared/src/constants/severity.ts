export enum Severity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export const SEVERITY_OPTIONS = [
  { value: Severity.CRITICAL, label: 'Critical - Production down or major safety issue' },
  { value: Severity.HIGH, label: 'High - Significant impact on operations' },
  { value: Severity.MEDIUM, label: 'Medium - Moderate impact, workaround available' },
  { value: Severity.LOW, label: 'Low - Minor inconvenience' }
] as const;

export const SEVERITY_COLORS = {
  [Severity.CRITICAL]: '#dc2626',
  [Severity.HIGH]: '#ea580c',
  [Severity.MEDIUM]: '#ca8a04',
  [Severity.LOW]: '#16a34a'
} as const;
