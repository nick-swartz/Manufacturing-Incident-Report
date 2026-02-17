import { z } from 'zod';
import { Severity } from '@incident-system/shared';

export const incidentSchema = z.object({
  affectedArea: z.string()
    .min(1, 'Affected area is required')
    .max(200, 'Affected area must be less than 200 characters'),

  system: z.string()
    .min(1, 'System is required'),

  severity: z.nativeEnum(Severity, {
    errorMap: () => ({ message: 'Please select a severity level' })
  }),

  impactDescription: z.string()
    .min(20, 'Impact description must be at least 20 characters')
    .max(1000, 'Impact description must be less than 1000 characters'),

  symptoms: z.string()
    .min(10, 'Symptoms must be at least 10 characters')
    .max(1000, 'Symptoms must be less than 1000 characters'),

  startTime: z.string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date and time'),

  reporterName: z.string()
    .min(1, 'Reporter name is required')
    .max(100, 'Reporter name must be less than 100 characters'),

  reporterContact: z.string()
    .min(1, 'Contact information is required')
    .max(150, 'Contact information must be less than 150 characters')
    .refine(
      (val) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return emailRegex.test(val) || phoneRegex.test(val);
      },
      'Must be a valid email or phone number'
    ),

  files: z.any().optional()
});

export type IncidentFormValues = z.infer<typeof incidentSchema>;
