import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { incidentSchema, IncidentFormValues } from '../../schemas/incidentSchema';
import { SEVERITY_OPTIONS, SYSTEM_OPTIONS, AFFECTED_AREAS, QUEUE_OPTIONS } from '@incident-system/shared';
import { submitIncident } from '../../api/incidents';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { TextArea } from '../common/TextArea';
import { Button } from '../common/Button';
import { FileUpload } from './FileUpload';
import { AssigneeAutocomplete } from './AssigneeAutocomplete';
import { Header } from '../common/Header';

// Helper function to get local datetime in correct format
const getLocalDateTimeString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const IncidentForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors }
  } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      startTime: getLocalDateTimeString(),
      assigneeEmail: ''
    }
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

    // Load saved reporter info or use authenticated user info
    if (isAuthenticated && user) {
      // Pre-fill with authenticated user info
      setValue('reporterName', user.name);
      setValue('reporterContact', user.email);
    } else {
      // Load saved reporter info for guest users
      const savedReporter = localStorage.getItem('reporter-info');
      if (savedReporter) {
        try {
          const { reporterName, reporterContact } = JSON.parse(savedReporter);
          if (reporterName) setValue('reporterName', reporterName);
          if (reporterContact) setValue('reporterContact', reporterContact);
        } catch (e) {
          // Invalid saved info, ignore
        }
      }
    }
  }, [setValue, isAuthenticated, user]);

  // Calculate form progress
  React.useEffect(() => {
    const subscription = watch((value) => {
      const fields = [
        value.queue,
        value.affectedArea,
        value.system,
        value.severity,
        value.symptoms,
        value.impactDescription,
        value.startTime,
        value.reporterName,
        value.reporterContact
      ];
      const filledFields = fields.filter(field => field && field.toString().trim().length > 0).length;
      const progress = Math.round((filledFields / fields.length) * 100);
      setFormProgress(progress);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

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
    console.log('Form data on submit:', data);
    console.log('Assignee email:', data.assigneeEmail);
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();

      formData.append('queue', data.queue);
      formData.append('affectedArea', data.affectedArea);
      formData.append('system', data.system);
      formData.append('severity', data.severity);
      formData.append('impactDescription', data.impactDescription);
      formData.append('symptoms', data.symptoms);
      formData.append('startTime', data.startTime);
      formData.append('reporterName', data.reporterName);
      formData.append('reporterContact', data.reporterContact);

      // Add assignee if provided
      if (data.assigneeEmail) {
        console.log('Adding assigneeEmail to FormData:', data.assigneeEmail);
        formData.append('assigneeEmail', data.assigneeEmail);
      } else {
        console.log('No assigneeEmail to add - value is:', data.assigneeEmail);
      }

      // Log all FormData entries for debugging
      console.log('FormData contents:');
      formData.forEach((value, key) => {
        console.log(`  ${key}:`, value);
      });

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

        // Save reporter info for future use
        localStorage.setItem('reporter-info', JSON.stringify({
          reporterName: data.reporterName,
          reporterContact: data.reporterContact
        }));

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="card-elevated overflow-hidden">
          <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-700 dark:via-primary-800 dark:to-gray-900 px-6 sm:px-8 py-8 sm:py-10">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary-900/30 rounded-full blur-3xl"></div>
            </div>

            {/* Content */}
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center space-x-4 sm:space-x-6 w-full sm:w-auto">
                {/* PING Logo */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl p-2.5 sm:p-3 ring-4 ring-white/20 flex-shrink-0">
                  <img src="/Pinglogo.png" alt="PING Logo" className="w-full h-full object-contain" />
                </div>

                {/* Title Section */}
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                    Manufacturing Incident Report
                  </h1>
                  <p className="mt-2 sm:mt-3 text-primary-100 text-sm sm:text-base leading-relaxed">
                    Please provide detailed information about the incident. All fields marked with{' '}
                    <span className="text-yellow-300 font-bold">*</span> are required.
                  </p>
                </div>
              </div>

              {/* Alert Icon - decorative */}
              <div className="hidden xl:flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex-shrink-0">
                <svg className="w-9 h-9 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="px-8 py-10 bg-gradient-to-b from-background-card to-background dark:from-gray-800 dark:to-gray-900">

            {/* Auth Status Indicator */}
            {isAuthenticated && user && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Logged in as {user.name}
                    </span>
                    <span className="ml-2 text-xs text-blue-700 dark:text-blue-300">({user.email})</span>
                  </div>
                </div>
              </div>
            )}

            {!isAuthenticated && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Submitting as guest
                  </span>
                </div>
              </div>
            )}

            {/* Progress Indicator */}
            <div className="mb-8" role="region" aria-label="Form completion progress">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-text">Form Progress</span>
                <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{formProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${formProgress}%` }}
                  role="progressbar"
                  aria-valuenow={formProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Form ${formProgress}% complete`}
                >
                  {formProgress > 10 && (
                    <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  )}
                </div>
              </div>
              {formProgress === 100 && (
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-2 flex items-center" role="status">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  All required fields completed - Ready to submit!
                </p>
              )}
            </div>

            {showDraftPrompt && (
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 via-primary-50 to-blue-50 dark:from-blue-900/20 dark:via-primary-900/20 dark:to-blue-900/20 border-2 border-primary-300 dark:border-primary-700 rounded-xl shadow-lg" role="alert">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500 rounded-xl flex items-center justify-center mr-4 shadow-md">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-text">
                            Draft Found
                          </h3>
                          <span className="px-2 py-1 text-xs font-bold text-primary-700 dark:text-primary-300 bg-primary-200 dark:bg-primary-800 rounded-full">
                            Auto-saved
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                          You have an unsaved draft from a previous session. Would you like to continue where you left off?
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={loadDraft}
                      className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 dark:hover:from-primary-600 dark:hover:to-primary-700 shadow-md hover:shadow-lg transition-all active:scale-95 min-h-[44px]"
                      aria-label="Load saved draft"
                    >
                      Load Draft
                    </button>
                    <button
                      type="button"
                      onClick={clearDraft}
                      className="px-5 py-2.5 text-sm font-bold bg-surface-card text-text-secondary border-2 border-line rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-line-hover shadow-sm hover:shadow-md transition-all active:scale-95 min-h-[44px]"
                      aria-label="Discard saved draft"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Queue Selection Section */}
              <fieldset className="space-y-6 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 p-6 rounded-xl shadow-md border-2 border-primary-200 dark:border-primary-700">
                <legend className="sr-only">Queue Selection</legend>
                <div className="flex items-center space-x-4 pb-4 border-b-2 border-primary-200 dark:border-primary-700">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-blue-600 dark:from-primary-500 dark:to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-black text-text">Select Support Queue</h2>
                    <p className="text-sm text-text-secondary mt-1">Choose the appropriate queue for your request</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {QUEUE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      htmlFor={`queue-${option.value}`}
                      className="flex items-start p-5 border-2 border-primary-200 dark:border-primary-700 bg-white dark:bg-gray-800 rounded-xl cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-lg has-[:checked]:border-primary-600 dark:has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 dark:has-[:checked]:bg-primary-900/30 has-[:checked]:shadow-xl transition-all duration-200"
                    >
                      <input
                        type="radio"
                        id={`queue-${option.value}`}
                        value={option.value}
                        {...register('queue')}
                        className="mt-1 h-5 w-5 text-primary-600 dark:text-primary-400 focus:ring-primary-500 focus:ring-2 min-h-[20px] min-w-[20px]"
                      />
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-text text-lg">{option.label}</span>
                          <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-text-secondary text-sm block mt-1.5 leading-relaxed">{option.description}</span>
                      </div>
                    </label>
                  ))}
                </div>

                {errors.queue && (
                  <div role="alert" className="mt-3 flex items-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{errors.queue.message}</span>
                  </div>
                )}
              </fieldset>

              {/* Basic Information Section */}
              <fieldset className="space-y-6 bg-surface-card dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <legend className="sr-only">Basic Information - Step 1</legend>
                <div className="flex items-center space-x-4 pb-4 border-b-2 border-primary-100 dark:border-primary-800">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500 rounded-xl flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-text">Basic Information</h2>
                    <p className="text-sm text-text-muted mt-0.5">Where and what system is affected</p>
                  </div>
                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full">Step 1</span>
                </div>

                <Select
                  label="Affected Area"
                  required
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                  hint="Select the physical location or department where the incident occurred"
                  options={AFFECTED_AREAS}
                  {...register('affectedArea')}
                  error={errors.affectedArea?.message}
                />

                <Select
                  label="System"
                  required
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  }
                  hint="Select the system or application that was affected"
                  options={SYSTEM_OPTIONS}
                  {...register('system')}
                  error={errors.system?.message}
                />
              </fieldset>

              {/* Severity Section */}
              <fieldset className="space-y-6 bg-surface-card dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <legend className="sr-only">Severity Assessment - Step 2</legend>
                <div className="flex items-center space-x-4 pb-4 border-b-2 border-primary-100 dark:border-primary-800">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-text">Severity Assessment</h2>
                    <p className="text-sm text-text-muted mt-0.5">How critical is this incident?</p>
                  </div>
                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full">Step 2</span>
                </div>

                <div>
                  <legend className="form-label flex items-center">
                    <svg className="w-4 h-4 text-text-muted mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Severity Level
                    <span className="text-red-500 dark:text-red-400 ml-1" aria-hidden="true">*</span>
                  </legend>
                  <div className="space-y-3 mt-3" role="radiogroup" aria-required="true" aria-label="Severity level">
                    {SEVERITY_OPTIONS.map((option, index) => {
                      const severityColors = [
                        { border: 'border-red-300 dark:border-red-700', bg: 'bg-red-50 dark:bg-red-900/20', hover: 'hover:border-red-500 dark:hover:border-red-600 hover:bg-red-100 dark:hover:bg-red-900/30', checked: 'has-[:checked]:border-red-600 dark:has-[:checked]:border-red-500 has-[:checked]:bg-red-50 dark:has-[:checked]:bg-red-900/30 has-[:checked]:shadow-md', icon: 'text-red-600 dark:text-red-400' },
                        { border: 'border-orange-300 dark:border-orange-700', bg: 'bg-orange-50 dark:bg-orange-900/20', hover: 'hover:border-orange-500 dark:hover:border-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30', checked: 'has-[:checked]:border-orange-600 dark:has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50 dark:has-[:checked]:bg-orange-900/30 has-[:checked]:shadow-md', icon: 'text-orange-600 dark:text-orange-400' },
                        { border: 'border-yellow-300 dark:border-yellow-700', bg: 'bg-yellow-50 dark:bg-yellow-900/20', hover: 'hover:border-yellow-500 dark:hover:border-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/30', checked: 'has-[:checked]:border-yellow-600 dark:has-[:checked]:border-yellow-500 has-[:checked]:bg-yellow-50 dark:has-[:checked]:bg-yellow-900/30 has-[:checked]:shadow-md', icon: 'text-yellow-600 dark:text-yellow-400' },
                        { border: 'border-blue-300 dark:border-blue-700', bg: 'bg-blue-50 dark:bg-blue-900/20', hover: 'hover:border-blue-500 dark:hover:border-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30', checked: 'has-[:checked]:border-blue-600 dark:has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/30 has-[:checked]:shadow-md', icon: 'text-blue-600 dark:text-blue-400' }
                      ];
                      const colors = severityColors[index] || severityColors[0];

                      return (
                        <label
                          key={option.value}
                          htmlFor={option.value}
                          className={`group flex items-start p-5 border-2 ${colors.border} ${colors.bg} rounded-xl cursor-pointer ${colors.hover} ${colors.checked} transition-all duration-200`}
                        >
                          <input
                            type="radio"
                            id={option.value}
                            value={option.value}
                            {...register('severity')}
                            className="mt-0.5 h-5 w-5 text-primary-600 dark:text-primary-400 focus:ring-primary-500 focus:ring-2 min-h-[20px] min-w-[20px]"
                            aria-describedby={`${option.value}-description`}
                          />
                          <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-text text-base">
                                {option.value}
                              </span>
                              <svg className={`w-5 h-5 ${colors.icon}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span id={`${option.value}-description`} className="text-text-secondary group-hover:text-white dark:group-hover:text-white text-sm block mt-1.5 leading-relaxed">
                              {option.label.split(' - ')[1]}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {errors.severity && (
                    <div role="alert" className="mt-3 flex items-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium">{errors.severity.message}</p>
                    </div>
                  )}
                </div>
              </fieldset>

              {/* Incident Details Section */}
              <fieldset className="space-y-6 bg-surface-card dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <legend className="sr-only">Incident Details - Step 3</legend>
                <div className="flex items-center space-x-4 pb-4 border-b-2 border-primary-100 dark:border-primary-800">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-xl flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-text">Incident Details</h2>
                    <p className="text-sm text-text-muted mt-0.5">Describe what happened and its impact</p>
                  </div>
                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full">Step 3</span>
                </div>
                <TextArea
                  label="Issue Description"
                  placeholder="Describe what was observed at the time of the incident... What happened? What did you see or notice?"
                  hint="Provide a clear description of the incident"
                  required
                  rows={4}
                  maxLength={1000}
                  showCount
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  }
                  {...register('symptoms')}
                  error={errors.symptoms?.message}
                />

                <TextArea
                  label="Impact on Operations"
                  placeholder="Describe the impact on operations, safety, quality, or other areas... How is this affecting production? Are there safety concerns?"
                  hint="Explain how this incident is affecting your work"
                  required
                  rows={4}
                  maxLength={1000}
                  showCount
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                  {...register('impactDescription')}
                  error={errors.impactDescription?.message}
                />

                <Input
                  label="Incident Start Time"
                  type="datetime-local"
                  required
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  hint="When did this incident begin? (defaults to current time)"
                  {...register('startTime')}
                  error={errors.startTime?.message}
                />
              </fieldset>

              {/* Reporter Information Section */}
              <fieldset className="space-y-6 bg-surface-card dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <legend className="sr-only">Reporter Information - Step 4</legend>
                <div className="flex items-center space-x-4 pb-4 border-b-2 border-primary-100 dark:border-primary-800">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-text">Reporter Information</h2>
                    <p className="text-sm text-text-muted mt-0.5">Who is reporting this incident?</p>
                  </div>
                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full">Step 4</span>
                </div>

                <Input
                  label="Reporter Name"
                  placeholder="Enter your full name"
                  required
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                  hint="Your first and last name"
                  {...register('reporterName')}
                  error={errors.reporterName?.message}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="your.name@company.com"
                  required
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                  hint="Your PING email address for follow-up communication"
                  {...register('reporterContact')}
                  error={errors.reporterContact?.message}
                />

                <AssigneeAutocomplete
                  value={watch('assigneeEmail') || ''}
                  onChange={(email) => setValue('assigneeEmail', email)}
                  error={errors.assigneeEmail?.message}
                />
              </fieldset>

              {/* Attachments Section */}
              <div className="space-y-6 bg-surface-card dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-4 pb-4 border-b-2 border-primary-100 dark:border-primary-800">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-400 dark:to-green-500 rounded-xl flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-text">Attachments</h2>
                    <p className="text-sm text-text-muted mt-0.5">Upload photos, documents, or other files (Optional)</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">Optional</span>
                </div>

                <FileUpload register={register} error={errors.files as any} />
              </div>

              {submitError && (
                <div role="alert" aria-live="assertive" className="p-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-xl shadow-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-red-500 dark:bg-red-600 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-base font-bold text-red-900 dark:text-red-100">Submission Error</h3>
                      <p className="text-sm text-red-800 dark:text-red-200 mt-1 leading-relaxed">{submitError}</p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-2">Please try again or contact IT support if the problem persists.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-10 mt-10 border-t-2 border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-auto order-2 sm:order-1"
                  aria-label="Reset form to initial state"
                >
                  <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Form
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto sm:px-8 order-1 sm:order-2 shadow-lg hover:shadow-xl"
                  aria-label={isSubmitting ? 'Submitting incident report' : 'Submit incident report'}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
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
                      <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
      </main>
    </div>
  );
};
