import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  showCount?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, required, hint, showCount, maxLength, className = '', ...props }, ref) => {
    const [count, setCount] = React.useState(0);

    return (
      <div className="mb-4">
        <label className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {hint && <p className="text-sm text-gray-500 mb-1">{hint}</p>}
        <textarea
          ref={ref}
          maxLength={maxLength}
          className={`form-textarea ${error ? 'border-red-500' : ''} ${className}`}
          onChange={(e) => {
            setCount(e.target.value.length);
            props.onChange?.(e);
          }}
          {...props}
        />
        <div className="flex justify-between items-center mt-1">
          <div>{error && <p className="form-error">{error}</p>}</div>
          {showCount && maxLength && (
            <p className={`text-sm ${count > maxLength * 0.9 ? 'text-orange-600' : 'text-gray-500'}`}>
              {count}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
