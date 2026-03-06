import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
  icon?: React.ReactNode;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, required, icon, hint, className = '', id: providedId, ...props }, ref) => {
    // Generate unique ID for accessibility if not provided
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    // Build aria-describedby
    const describedBy = [];
    if (hint) describedBy.push(hintId);
    if (error) describedBy.push(errorId);
    const ariaDescribedBy = describedBy.length > 0 ? describedBy.join(' ') : undefined;

    return (
      <div className="mb-5">
        <label htmlFor={id} className="form-label flex items-center">
          {icon && <span className="mr-2 text-text-muted" aria-hidden="true">{icon}</span>}
          {label}
          {required && <span className="text-red-500 dark:text-red-400 ml-1" aria-hidden="true">*</span>}
        </label>
        {hint && (
          <p id={hintId} className="text-sm text-text-muted mb-2 ml-6">
            {hint}
          </p>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            className={`form-input ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={ariaDescribedBy}
            aria-required={required}
            {...props}
          />
        </div>
        {error && (
          <div
            id={errorId}
            role="alert"
            className="mt-2 flex items-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg"
          >
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
