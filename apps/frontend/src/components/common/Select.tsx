import React, { useId } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  required?: boolean;
  options: readonly string[] | { value: string; label: string }[];
  icon?: React.ReactNode;
  hint?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, required, options, icon, hint, className = '', id: providedId, ...props }, ref) => {
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
          <select
            ref={ref}
            id={id}
            className={`form-select ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={ariaDescribedBy}
            aria-required={required}
            {...props}
          >
            <option value="">Select an option...</option>
            {options.map((option) => {
              if (typeof option === 'string') {
                return (
                  <option key={option} value={option}>
                    {option}
                  </option>
                );
              }
              return (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              );
            })}
          </select>
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

Select.displayName = 'Select';
