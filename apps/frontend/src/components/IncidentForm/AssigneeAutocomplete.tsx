import React, { useState, useEffect, useRef } from 'react';
import { getAssignees, Assignee } from '../../api/incidents';

interface AssigneeAutocompleteProps {
  value: string;
  onChange: (email: string) => void;
  error?: string;
}

export const AssigneeAutocomplete: React.FC<AssigneeAutocompleteProps> = ({ value, onChange, error }) => {
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [filteredAssignees, setFilteredAssignees] = useState<Assignee[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch assignees on mount
  useEffect(() => {
    const fetchAssignees = async () => {
      setIsLoading(true);
      const data = await getAssignees();
      setAssignees(data);
      setFilteredAssignees(data);
      setIsLoading(false);
    };
    fetchAssignees();
  }, []);

  // Set input value based on prop value
  useEffect(() => {
    if (value && assignees.length > 0) {
      const assignee = assignees.find(a => a.email === value);
      if (assignee) {
        setInputValue(`${assignee.name} (${assignee.email})`);
      }
    }
  }, [value, assignees]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setInputValue(input);
    setIsOpen(true);

    // Filter assignees based on input
    if (input.trim() === '') {
      setFilteredAssignees(assignees);
      onChange('');
    } else {
      const filtered = assignees.filter(assignee =>
        assignee.name.toLowerCase().includes(input.toLowerCase()) ||
        assignee.email.toLowerCase().includes(input.toLowerCase())
      );
      setFilteredAssignees(filtered);
    }
  };

  const handleSelectAssignee = (assignee: Assignee) => {
    console.log('Assignee selected:', assignee.email);
    setInputValue(`${assignee.name} (${assignee.email})`);
    onChange(assignee.email);
    setIsOpen(false);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setFilteredAssignees(assignees);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor="assignee" className="form-label">
        Assignee <span className="text-text-muted text-xs font-normal">(Optional)</span>
      </label>

      <div className="relative">
        <input
          id="assignee"
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={isLoading ? "Loading assignees..." : "Search by name or email..."}
          disabled={isLoading}
          className={`form-input ${error ? 'border-red-500' : ''}`}
          aria-describedby={error ? 'assignee-error' : undefined}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          autoComplete="off"
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
            aria-label="Clear assignee"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <p id="assignee-error" className="form-error" role="alert">
          <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {isOpen && filteredAssignees.length > 0 && (
        <ul
          className="absolute z-10 w-full mt-1 bg-surface-card border border-line rounded-lg shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {filteredAssignees.map((assignee) => (
            <li key={assignee.email}>
              <button
                type="button"
                onClick={() => handleSelectAssignee(assignee)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 transition-colors"
                role="option"
                aria-selected={value === assignee.email}
              >
                <div className="font-medium text-text">{assignee.name}</div>
                <div className="text-sm text-text-muted">{assignee.email}</div>
                <div className="text-xs text-text-muted capitalize">{assignee.source}</div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isOpen && filteredAssignees.length === 0 && inputValue && (
        <div className="absolute z-10 w-full mt-1 bg-surface-card border border-line rounded-lg shadow-lg p-4 text-center text-text-muted">
          No assignees found matching "{inputValue}"
        </div>
      )}
    </div>
  );
};
