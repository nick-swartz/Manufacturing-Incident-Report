import { Request, Response, NextFunction } from 'express';
import { Severity } from '@incident-system/shared';
import { createError } from './errorHandler';

export function validateIncidentData(req: Request, res: Response, next: NextFunction): void {
  const { affectedArea, system, severity, impactDescription, symptoms, startTime, reporterName, reporterContact } = req.body;

  if (!affectedArea || typeof affectedArea !== 'string' || affectedArea.trim().length === 0) {
    return next(createError('Affected area is required', 400));
  }

  if (!system || typeof system !== 'string' || system.trim().length === 0) {
    return next(createError('System is required', 400));
  }

  if (!severity || !Object.values(Severity).includes(severity as Severity)) {
    return next(createError('Valid severity level is required', 400));
  }

  if (!impactDescription || typeof impactDescription !== 'string' || impactDescription.length < 20 || impactDescription.length > 1000) {
    return next(createError('Impact description must be between 20 and 1000 characters', 400));
  }

  if (!symptoms || typeof symptoms !== 'string' || symptoms.length < 10) {
    return next(createError('Symptoms must be at least 10 characters', 400));
  }

  if (!startTime || isNaN(Date.parse(startTime))) {
    return next(createError('Valid start time is required', 400));
  }

  if (!reporterName || typeof reporterName !== 'string' || reporterName.trim().length === 0) {
    return next(createError('Reporter name is required', 400));
  }

  if (!reporterContact || typeof reporterContact !== 'string' || reporterContact.trim().length === 0) {
    return next(createError('Reporter contact is required', 400));
  }

  next();
}
