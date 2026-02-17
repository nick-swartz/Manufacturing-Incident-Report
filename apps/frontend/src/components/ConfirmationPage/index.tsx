import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { SubmissionResponse } from '@incident-system/shared';
import { Button } from '../common/Button';
import { Header } from '../common/Header';

export const ConfirmationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as SubmissionResponse | undefined;
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    if (result?.incidentId) {
      try {
        await navigator.clipboard.writeText(result.incidentId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full card-elevated p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 text-lg mb-6">No submission data found.</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Form
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="card-elevated">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-12 text-center relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full translate-x-20 translate-y-20"></div>

              <div className="relative">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white shadow-lg mb-6 animate-bounce">
                  <svg
                    className="h-12 w-12 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-3">
                  Incident Submitted Successfully!
                </h1>
                <p className="text-green-50 text-lg">{result.message}</p>
              </div>
            </div>

            {/* Main Content */}
            <div className="px-8 py-8 space-y-6">
              {/* Incident Tracking ID Card */}
              <div className="bg-gradient-to-br from-primary-50 to-blue-50 border-2 border-primary-200 rounded-xl p-8 text-center shadow-sm">
                <p className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Your Incident Tracking ID
                </p>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <p className="text-4xl font-bold text-primary-700 font-mono tracking-tight">
                    {result.incidentId}
                  </p>
                  <button
                    onClick={copyToClipboard}
                    className="p-3 rounded-xl bg-white hover:bg-primary-100 border-2 border-primary-300 transition-all shadow-sm hover:shadow-md"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-sm font-medium text-primary-700">
                  {copied ? (
                    <span className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied to clipboard!
                    </span>
                  ) : (
                    'Click the button to copy your ID'
                  )}
                </p>
              </div>

              {/* Status Cards */}
              <div className="grid gap-5">
                {result.jiraTicketKey && result.jiraTicketUrl && (
                  <div className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50 hover:shadow-md transition-shadow">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
                          <svg
                            className="h-7 w-7 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-base font-semibold text-gray-900 mb-1">
                          Jira Ticket Created
                        </p>
                        <p className="text-sm text-gray-600 mb-3">
                          Ticket Number: <span className="font-mono font-bold text-gray-900">{result.jiraTicketKey}</span>
                        </p>
                        <a
                          href={result.jiraTicketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
                        >
                          View in Jira
                          <svg
                            className="ml-2 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {result.teamsPostStatus && (
                  <div className={`border-2 rounded-xl p-6 hover:shadow-md transition-shadow ${
                    result.teamsPostStatus === 'success'
                      ? 'border-green-200 bg-green-50'
                      : 'border-yellow-200 bg-yellow-50'
                  }`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                          result.teamsPostStatus === 'success'
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                        }`}>
                          {result.teamsPostStatus === 'success' ? (
                            <svg
                              className="h-7 w-7 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="h-7 w-7 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-base font-semibold text-gray-900 mb-1">
                          Microsoft Teams Notification
                        </p>
                        <p className="text-sm text-gray-600">
                          {result.teamsPostStatus === 'success'
                            ? 'Successfully posted to your Teams channel'
                            : 'Failed to post to Teams channel'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {result.uploadedFiles && result.uploadedFiles.length > 0 && (
                  <div className="border-2 border-purple-200 rounded-xl p-6 bg-purple-50 hover:shadow-md transition-shadow">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-sm">
                          <svg
                            className="h-7 w-7 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-base font-semibold text-gray-900 mb-3">
                          Attachments Uploaded ({result.uploadedFiles.length})
                        </p>
                        <ul className="space-y-2">
                          {result.uploadedFiles.map((file, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-700 bg-white px-3 py-2 rounded-lg border border-purple-200">
                              <svg
                                className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              <span className="font-medium">{file}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-t-2 border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <Link
                  to="/"
                  className="text-sm font-medium text-primary-600 hover:text-primary-800 flex items-center group transition-colors"
                >
                  <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Home
                </Link>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/')}
                    className="w-full sm:w-auto"
                  >
                    <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Submit Another Incident
                  </Button>
                  {result.jiraTicketUrl && (
                    <a
                      href={result.jiraTicketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto"
                    >
                      <Button className="w-full">
                        <svg className="w-5 h-5 mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Open Jira Ticket
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
