import { API_BASE_URL } from '../config';
import { useState } from 'react';

export default function StepExportContacts({ contacts, selectedCompany, creditsUsed, onBack }) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/people/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts,
          company: selectedCompany,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export contacts');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedCompany.domain.replace(/\./g, '_')}_contacts_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      setExportError(error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const enrichedContacts = contacts.filter(
    (c) => c.emailStatus === 'retrieved' || c.phoneStatus === 'retrieved'
  );
  const notEnrichedContacts = contacts.filter(
    (c) => c.emailStatus === 'not_retrieved' && c.phoneStatus === 'not_retrieved'
  );

  const emailsRetrieved = contacts.filter((c) => c.emailStatus === 'retrieved').length;
  const phonesRetrieved = contacts.filter((c) => c.phoneStatus === 'retrieved').length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="text-accent hover:text-accent-dark mb-4 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Contacts
        </button>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Export Contacts</h1>
        <p className="text-slate-600">
          Download all contacts from{' '}
          <span className="font-semibold">{selectedCompany.apollo_matched_name || selectedCompany.company_name}</span>{' '}
          with their enriched data.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-3xl font-bold text-slate-900">{contacts.length}</div>
          <div className="text-sm text-slate-600">Total Contacts</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-3xl font-bold text-emerald-600">{enrichedContacts.length}</div>
          <div className="text-sm text-slate-600">Enriched</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-3xl font-bold text-blue-600">{emailsRetrieved}</div>
          <div className="text-sm text-slate-600">Emails Retrieved</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-3xl font-bold text-purple-600">{phonesRetrieved}</div>
          <div className="text-sm text-slate-600">Phones Retrieved</div>
        </div>
      </div>

      {/* Credits Summary */}
      <div className="bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg border border-accent/20 p-6 mb-8">
        <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          Credit Usage Summary
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-slate-600 mb-1">Emails Retrieved</div>
            <div className="text-2xl font-bold text-accent">{creditsUsed.emails}</div>
          </div>
          <div>
            <div className="text-sm text-slate-600 mb-1">Phones Retrieved</div>
            <div className="text-2xl font-bold text-accent">{creditsUsed.phones}</div>
          </div>
          <div>
            <div className="text-sm text-slate-600 mb-1">Total Credits</div>
            <div className="text-2xl font-bold text-accent">{creditsUsed.emails + (creditsUsed.phones * 8)}</div>
          </div>
        </div>
      </div>

      {/* Export Details */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
        <h2 className="font-semibold text-slate-900 mb-4">Export Details</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <div className="font-medium text-slate-900">All contacts included</div>
              <div className="text-slate-600">
                CSV will contain all {contacts.length} contacts, including those without enriched data
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <div className="font-medium text-slate-900">Enrichment status tracked</div>
              <div className="text-slate-600">
                Each row shows whether email/phone was retrieved, not retrieved, or not available
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <div className="font-medium text-slate-900">Company context included</div>
              <div className="text-slate-600">
                Company name, domain, ICP score, industry, and employee count for each contact
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSV Columns Preview */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
        <h2 className="font-semibold text-slate-900 mb-4">CSV Columns</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <span className="text-slate-700">Company Name</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <span className="text-slate-700">Company Domain</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <span className="text-slate-700">Company ICP Score</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <span className="text-slate-700">Company Industry</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <span className="text-slate-700">Company Employees</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <span className="text-slate-700">Contact Full Name</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <span className="text-slate-700">Contact Title</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <span className="text-slate-700">Contact Seniority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <span className="text-slate-700">Contact Email</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <span className="text-slate-700">Contact Phone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <span className="text-slate-700">Contact LinkedIn URL</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <span className="text-slate-700">Contact Department</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <span className="text-slate-700">Persona Type</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <span className="text-slate-700">Email Status</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent"></div>
            <span className="text-slate-700">Phone Status</span>
          </div>
        </div>
      </div>

      {/* Warning for un-enriched contacts */}
      {notEnrichedContacts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <div className="font-medium text-amber-900 mb-1">
                {notEnrichedContacts.length} contact{notEnrichedContacts.length !== 1 ? 's' : ''} without enrichment
              </div>
              <div className="text-sm text-amber-700">
                These contacts will be included in the CSV with blank email and phone fields. You can enrich them later by
                going back to the previous step.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="flex justify-center">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-8 py-4 bg-accent text-white rounded-lg font-semibold text-lg hover:bg-accent-dark disabled:bg-slate-300 disabled:cursor-not-allowed transition-all inline-flex items-center gap-3 shadow-lg hover:shadow-xl"
        >
          {isExporting ? (
            <>
              <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export {contacts.length} Contact{contacts.length !== 1 ? 's' : ''} to CSV
            </>
          )}
        </button>
      </div>

      {exportError && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg text-center">
          Error: {exportError}
        </div>
      )}
    </div>
  );
}
