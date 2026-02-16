import { API_BASE_URL } from '../config';
import { useState, useCallback } from 'react';
import ContactCard from './ContactCard';

export default function StepFindContacts({ selectedCompany, onComplete, onBack }) {
  const [contacts, setContacts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [creditsUsed, setCreditsUsed] = useState({ emails: 0, phones: 0 });

  const handleSearch = async () => {
    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/people/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: selectedCompany.domain,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search for contacts');
      }

      const data = await response.json();
      
      // Transform contacts into the format we need
      const formattedContacts = data.contacts.map((c) => ({
        id: c.id,
        name: c.name || (c.first_name ? `${c.first_name} ${c.last_name_obfuscated || ''}`.trim() : 'Unknown'),
        first_name: c.first_name,
        last_name: c.last_name_obfuscated || c.last_name,
        title: c.title,
        linkedin_url: c.linkedin_url,
        seniority: c.seniority,
        departments: c.departments || [],
        personaType: c.persona_type,
        emailStatus: 'not_retrieved',
        phoneStatus: 'not_retrieved',
        emailValue: null,
        phoneValue: null,
      }));

      setContacts(formattedContacts);
      setHasSearched(true);
    } catch (error) {
      console.error('Contact search error:', error);
      setSearchError(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleEnrichEmail = useCallback(async (contactId) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, emailStatus: 'enriching' } : c))
    );

    try {
      const response = await fetch(`${API_BASE_URL}/api/people/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: contactId,
          revealEmail: true,
          revealPhone: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to enrich contact');
      }

      const data = await response.json();

      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactId
            ? {
                ...c,
                emailStatus: data.email ? 'retrieved' : 'not_available',
                emailValue: data.email,
              }
            : c
        )
      );

      if (data.email) {
        setCreditsUsed((prev) => ({ ...prev, emails: prev.emails + 1 }));
      }
    } catch (error) {
      console.error('Email enrichment error:', error);
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, emailStatus: 'not_available' } : c))
      );
    }
  }, []);

  const handleEnrichPhone = useCallback(async (contactId) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, phoneStatus: 'enriching' } : c))
    );

    try {
      const response = await fetch(`${API_BASE_URL}/api/people/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: contactId,
          revealEmail: false,
          revealPhone: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to enrich contact');
      }

      const data = await response.json();

      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactId
            ? {
                ...c,
                phoneStatus: data.phone ? 'retrieved' : 'not_available',
                phoneValue: data.phone,
              }
            : c
        )
      );

      if (data.phone) {
        setCreditsUsed((prev) => ({ ...prev, phones: prev.phones + 1 }));
      }
    } catch (error) {
      console.error('Phone enrichment error:', error);
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, phoneStatus: 'not_available' } : c))
      );
    }
  }, []);

  const executives = contacts.filter((c) => c.personaType === 'Founder/Executive');
  const operations = contacts.filter((c) => c.personaType === 'Operations Leader');

  const totalCredits = creditsUsed.emails + (creditsUsed.phones * 8);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="text-accent hover:text-accent-dark mb-4 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Company Selection
        </button>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Find Contacts</h1>
        <p className="text-slate-600">
          Search for decision-makers and operations leaders at{' '}
          <span className="font-semibold">{selectedCompany.apollo_matched_name || selectedCompany.company_name}</span>
        </p>
      </div>

      {/* Company Summary */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          {selectedCompany.logo_url && (
            <img
              src={selectedCompany.logo_url}
              alt={selectedCompany.apollo_matched_name || selectedCompany.company_name}
              className="w-16 h-16 rounded object-contain bg-white border border-slate-200"
            />
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">
              {selectedCompany.apollo_matched_name || selectedCompany.company_name}
            </h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
              <span>{selectedCompany.domain}</span>
              {selectedCompany.industry && <span>• {selectedCompany.industry}</span>}
              {selectedCompany.estimated_num_employees && (
                <span>• {selectedCompany.estimated_num_employees.toLocaleString()} employees</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {!hasSearched ? (
        /* Search CTA */
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <svg
            className="w-16 h-16 text-slate-300 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to Find Decision-Makers?</h3>
          <p className="text-slate-600 mb-6">
            We'll search for executives and operations leaders at this company.
            <br />
            <span className="text-sm">This search uses minimal credits and returns basic info only.</span>
          </p>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-dark disabled:bg-slate-300 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
          >
            {isSearching ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Searching...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Find Contacts at {selectedCompany.apollo_matched_name || selectedCompany.company_name}
              </>
            )}
          </button>
          {searchError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              Error: {searchError}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Credit Tracker */}
          <div className="bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg border border-accent/20 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Credits Used</h3>
                <p className="text-sm text-slate-600">
                  {totalCredits} total ({creditsUsed.emails} email{creditsUsed.emails !== 1 ? 's' : ''} × 1, {creditsUsed.phones} phone{creditsUsed.phones !== 1 ? 's' : ''} × 8)
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-accent">{totalCredits}</div>
                <div className="text-xs text-slate-600">credits</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-2xl font-bold text-slate-900">{contacts.length}</div>
              <div className="text-sm text-slate-600">Total Contacts</div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-2xl font-bold text-slate-900">{executives.length}</div>
              <div className="text-sm text-slate-600">Executives</div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-2xl font-bold text-slate-900">{operations.length}</div>
              <div className="text-sm text-slate-600">Operations Leaders</div>
            </div>
          </div>

          {/* Executives Section */}
          {executives.length > 0 && (
            <div className="mb-8">
              <div className="border-t border-b border-slate-300 bg-slate-50 py-3 px-4 mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Founders & Executives ({executives.length} found)
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {executives.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onEnrichEmail={handleEnrichEmail}
                    onEnrichPhone={handleEnrichPhone}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Operations Leaders Section */}
          {operations.length > 0 && (
            <div className="mb-8">
              <div className="border-t border-b border-slate-300 bg-slate-50 py-3 px-4 mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Operations & Implementation Leaders ({operations.length} found)
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {operations.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onEnrichEmail={handleEnrichEmail}
                    onEnrichPhone={handleEnrichPhone}
                  />
                ))}
              </div>
            </div>
          )}

          {contacts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <svg
                className="w-12 h-12 text-slate-300 mx-auto mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-slate-600">
                No contacts found for this company. Try another company or check back later.
              </p>
            </div>
          )}

          {/* Export Button */}
          {contacts.length > 0 && (
            <div className="flex justify-end mt-6">
              <button
                onClick={() => onComplete(contacts, selectedCompany, creditsUsed)}
                className="px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-dark transition-all inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export Contacts to CSV
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
