import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { incidentSchema, IncidentFormValues } from '../../schemas/incidentSchema';
import { SEVERITY_OPTIONS, SYSTEM_OPTIONS } from '@incident-system/shared';
import { submitIncident } from '../../api/incidents';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { TextArea } from '../common/TextArea';
import { Button } from '../common/Button';
import { FileUpload } from './FileUpload';
import { Header } from '../common/Header';

export const IncidentForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema)
  });

  // Auto-save draft to localStorage
  React.useEffect(() => {
    const subscription = watch((value) => {
      // Only save if at least one field has data
      if (value.affectedArea || value.impactDescription || value.symptoms) {
        localStorage.setItem('incident-draft', JSON.stringify(value));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Load draft on mount
  React.useEffect(() => {
    const draft = localStorage.getItem('incident-draft');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        // Check if draft has meaningful data
        if (parsedDraft.affectedArea || parsedDraft.impactDescription) {
          setShowDraftPrompt(true);
        }
      } catch (e) {
        // Invalid draft, ignore
      }
    }
  }, []);

  const loadDraft = () => {
    const draft = localStorage.getItem('incident-draft');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        reset(parsedDraft);
        setShowDraftPrompt(false);
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('incident-draft');
    setShowDraftPrompt(false);
  };

  const onSubmit = async (data: IncidentFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();

      formData.append('affectedArea', data.affectedArea);
      formData.append('system', data.system);
      formData.append('severity', data.severity);
      formData.append('impactDescription', data.impactDescription);
      formData.append('symptoms', data.symptoms);
      formData.append('startTime', data.startTime);
      formData.append('reporterName', data.reporterName);
      formData.append('reporterContact', data.reporterContact);

      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput?.files) {
        Array.from(fileInput.files).forEach((file) => {
          formData.append('files', file);
        });
      }

      const result = await submitIncident(formData);

      if (result.success) {
        // Clear draft on successful submission
        localStorage.removeItem('incident-draft');
        navigate('/confirmation', { state: { result } });
      } else {
        setSubmitError(result.error || 'Failed to submit incident');
      }
    } catch (error: any) {
      setSubmitError(error.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card-elevated">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6">
            <h1 className="text-3xl font-bold text-white">
              Manufacturing Incident Report
            </h1>
            <p className="mt-2 text-primary-50">
              Please provide detailed information about the incident. All fields marked with{' '}
              <span className="text-yellow-300 font-semibold">*</span> are required.
            </p>
          </div>
          <div className="px-8 py-8">

            {showDraftPrompt && (
              <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-primary-50 border-l-4 border-primary-500 rounded-lg shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">
                          Draft Found
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          You have an unsaved draft. Would you like to continue where you left off?
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex space-x-2">
                    <button
                      type="button"
                      onClick={loadDraft}
                      className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm hover:shadow transition-all"
                    >
                      Load Draft
                    </button>
                    <button
                      type="button"
                      onClick={clearDraft}
                      className="px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-all"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-5">
                <div className="flex items-center space-x-3 pb-3 border-b-2 border-gray-200">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-700 font-bold text-sm">1</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                </div>

                <Input
                  label="Affected Area"
                  placeholder="e.g., Assembly Line 3, Packaging, Conveyor, etc."
                  required
                  {...register('affectedArea')}
                  error={errors.affectedArea?.message}
                />

                <Select
                  label="System"
                  required
                  options={SYSTEM_OPTIONS}
                  {...register('system')}
                  error={errors.system?.message}
                />
              </div>

              {/* Severity Section */}
              <div className="space-y-5">
                <div className="flex items-center space-x-3 pb-3 border-b-2 border-gray-200">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-700 font-bold text-sm">2</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Severity Assessment</h2>
                </div>

                <div className="mb-4">
                  <label className="form-label">
                    Severity Level
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="space-y-3 mt-3">
                    {SEVERITY_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        htmlFor={option.value}
                        className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all duration-200 has-[:checked]:border-primary-600 has-[:checked]:bg-primary-50 has-[:checked]:shadow-sm"
                      >
                        <input
                          type="radio"
                          id={option.value}
                          value={option.value}
                          {...register('severity')}
                          className="mt-0.5 h-5 w-5 text-primary-600 focus:ring-primary-500 focus:ring-2"
                        />
                        <div className="ml-4">
                          <span className="font-semibold text-gray-900 text-base">
                            {option.value}
                          </span>
                          <span className="text-gray-600 text-sm block mt-0.5">
                            {option.label.split(' - ')[1]}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.severity && (
                    <p className="form-error">{errors.severity.message}</p>
                  )}
                </div>
              </div>

              {/* Incident Details Section */}
              <div className="space-y-5">
                <div className="flex items-center space-x-3 pb-3 border-b-2 border-gray-200">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-700 font-bold text-sm">3</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Incident Details</h2>
                </div>
                <TextArea
                  label="Issue Description"
                  placeholder="Describe what was observed at the time of the incident"
                  hint="Maximum 1000 characters"
                  required
                  rows={3}
                  maxLength={1000}
                  showCount
                  {...register('symptoms')}
                  error={errors.symptoms?.message}
                />

                <TextArea
                  label="Impact on Operations"
                  placeholder="Describe the impact on operations, safety, quality, or other areas"
                  hint="20-1000 characters"
                  required
                  rows={4}
                  maxLength={1000}
                  showCount
                  {...register('impactDescription')}
                  error={errors.impactDescription?.message}
                />

                <Input
                  label="Incident Start Time"
                  type="datetime-local"
                  required
                  defaultValue={new Date().toISOString().slice(0, 16)}
                  {...register('startTime')}
                  error={errors.startTime?.message}
                />
              </div>

              {/* Reporter Information Section */}
              <div className="space-y-5">
                <div className="flex items-center space-x-3 pb-3 border-b-2 border-gray-200">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-700 font-bold text-sm">4</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Reporter Information</h2>
                </div>

                <Input
                  label="Reporter Name"
                  placeholder="Your full name"
                  required
                  {...register('reporterName')}
                  error={errors.reporterName?.message}
                />

                <Input
                  label="Email Address"
                  placeholder="Please enter your PING Email"
                  required
                  {...register('reporterContact')}
                  error={errors.reporterContact?.message}
                />
              </div>

              {/* Attachments Section */}
              <div className="space-y-5">
                <div className="flex items-center space-x-3 pb-3 border-b-2 border-gray-200">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-700 font-bold text-sm">5</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Attachments (Optional)</h2>
                </div>

                <FileUpload register={register} error={errors.files as any} />
              </div>

              {submitError && (
                <div className="p-5 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-semibold text-red-800">Submission Error</h3>
                      <p className="text-sm text-red-700 mt-1">{submitError}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-8 border-t-2 border-gray-200 mt-8">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-auto"
                >
                  <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Form
                </Button>
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting Incident...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Submit Incident Report
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
