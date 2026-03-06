import React, { useId } from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  showCount?: boolean;
  icon?: React.ReactNode;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, required, hint, showCount, maxLength, icon, className = '', id: providedId, ...props }, ref) => {
    const [count, setCount] = React.useState(0);

    // Generate unique ID for accessibility if not provided
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const countId = `${id}-count`;

    // Build aria-describedby
    const describedBy = [];
    if (hint) describedBy.push(hintId);
    if (error) describedBy.push(errorId);
    if (showCount && maxLength) describedBy.push(countId);
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
        <textarea
          ref={ref}
          id={id}
          maxLength={maxLength}
          className={`form-textarea ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''} ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={ariaDescribedBy}
          aria-required={required}
          onChange={(e) => {
            setCount(e.target.value.length);
            props.onChange?.(e);
          }}
          {...props}
        />
        <div className="flex justify-between items-center mt-2">
          <div className="flex-1">
            {error && (
              <div
                id={errorId}
                role="alert"
                className="flex items-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg"
              >
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
          {showCount && maxLength && (
            <p
              id={countId}
              aria-live="polite"
              className={`text-sm font-medium px-3 py-1 rounded-full flex-shrink-0 ml-2 ${
                count > maxLength * 0.9
                  ? 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30'
                  : count > maxLength * 0.7
                  ? 'text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30'
                  : 'text-text-muted bg-gray-100 dark:bg-gray-700'
              }`}
            >
              {count} / {maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
