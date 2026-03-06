import React, { useState, useId } from 'react';
import { UseFormRegister, FieldError } from 'react-hook-form';
import { IncidentFormValues } from '../../schemas/incidentSchema';

interface FileUploadProps {
  register: UseFormRegister<IncidentFormValues>;
  error?: FieldError;
}

export const FileUpload: React.FC<FileUploadProps> = ({ register, error }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const id = useId();
  const fileInputId = `file-upload-${id}`;
  const fileCountId = `file-count-${id}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(files);

      const dataTransfer = new DataTransfer();
      files.forEach(file => dataTransfer.items.add(file));
      const input = document.getElementById(fileInputId) as HTMLInputElement;
      if (input) {
        input.files = dataTransfer.files;
      }
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);

    const dataTransfer = new DataTransfer();
    newFiles.forEach(file => dataTransfer.items.add(file));
    const input = document.getElementById(fileInputId) as HTMLInputElement;
    if (input) {
      input.files = dataTransfer.files;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Handle keyboard-accessible file button click
  const handleButtonClick = () => {
    const input = document.getElementById(fileInputId) as HTMLInputElement;
    input?.click();
  };

  return (
    <div className="mb-4">
      <label htmlFor={fileInputId} className="form-label">
        Attachments
        <span className="text-text-muted text-xs ml-2 font-normal">(Optional - Max 5 files, 10MB each)</span>
      </label>

      <p className="text-sm text-text-muted mb-3">
        You can drag and drop files below, or use the button to select files from your computer
      </p>

      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]'
            : 'border-line hover:border-line-hover bg-surface-card'
        } ${error ? 'border-red-500 dark:border-red-400' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        role="region"
        aria-label="File upload area"
      >
        <input
          id={fileInputId}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,application/pdf,text/plain"
          className="sr-only"
          {...register('files')}
          onChange={handleFileChange}
          aria-describedby={selectedFiles.length > 0 ? fileCountId : undefined}
        />

        <div className="w-16 h-16 mx-auto bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-primary-600 dark:text-primary-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <button
          type="button"
          onClick={handleButtonClick}
          className="px-6 py-3 bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-primary-400 dark:focus:ring-offset-gray-800 min-h-[44px]"
          aria-label="Choose files to upload"
        >
          Choose Files
        </button>

        <p className="block text-sm text-text-muted mt-4">
          or drag and drop files here
        </p>
        <p className="block text-xs text-text-muted mt-2">
          Images (JPG, PNG, GIF), PDF, or Text files
        </p>
      </div>

      {error && (
        <div role="alert" className="mt-3 flex items-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">{error.message}</p>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="mt-5 space-y-3">
          <p id={fileCountId} className="text-sm font-semibold text-text flex items-center" aria-live="polite">
            <svg className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Selected Files ({selectedFiles.length})
          </p>
          <ul className="space-y-3" role="list" aria-label="Selected files">
            {selectedFiles.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {file.type.startsWith('image/') && (
                    <img
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="w-12 h-12 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                      role="presentation"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-text-muted mt-1">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-3 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 min-h-[44px] min-w-[44px]"
                  aria-label={`Remove file ${file.name}`}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
