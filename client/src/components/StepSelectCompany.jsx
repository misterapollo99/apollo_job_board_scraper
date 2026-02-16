import { API_BASE_URL } from '../config';
import { useState, useMemo } from 'react';
import ICPScoreBadge from './ICPScoreBadge';

export default function StepSelectCompany({ companies, onSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Filter to only successfully enriched companies
  const enrichedCompanies = useMemo(() => {
    return companies
      .filter(c => c.enrichment_status === 'success')
      .sort((a, b) => (b.icp_score || 0) - (a.icp_score || 0));
  }, [companies]);

  // Filter companies by search query
  const filteredCompanies = useMemo(() => {
    if (!searchQuery) return enrichedCompanies;
    const query = searchQuery.toLowerCase();
    return enrichedCompanies.filter(
      c =>
        c.company_name?.toLowerCase().includes(query) ||
        c.apollo_matched_name?.toLowerCase().includes(query) ||
        c.domain?.toLowerCase().includes(query) ||
        c.industry?.toLowerCase().includes(query)
    );
  }, [enrichedCompanies, searchQuery]);

  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
  };

  const handleContinue = () => {
    if (selectedCompany) {
      onSelect(selectedCompany);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Select Company for Contact Search</h1>
        <p className="text-slate-600">
          Choose a company to find decision-makers and operations leaders. Companies are sorted by ICP score.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-2xl font-bold text-slate-900">{enrichedCompanies.length}</div>
          <div className="text-sm text-slate-600">Available Companies</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-2xl font-bold text-slate-900">
            {enrichedCompanies.filter(c => c.icp_score >= 70).length}
          </div>
          <div className="text-sm text-slate-600">High ICP Score (70+)</div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-2xl font-bold text-slate-900">
            {selectedCompany ? '1' : '0'}
          </div>
          <div className="text-sm text-slate-600">Selected</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search companies by name, domain, or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-11 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Showing {filteredCompanies.length} of {enrichedCompanies.length} companies
        </div>
      </div>

      {/* Company List */}
      <div className="space-y-3 mb-6">
        {filteredCompanies.map((company) => {
          const isSelected = selectedCompany?.domain === company.domain;
          
          return (
            <button
              key={company.domain}
              onClick={() => handleSelectCompany(company)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-accent bg-accent/5'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Company Name & Logo */}
                  <div className="flex items-center gap-3 mb-2">
                    {company.logo_url ? (
                      <img
                        src={company.logo_url}
                        alt={company.apollo_matched_name || company.company_name}
                        className="w-10 h-10 rounded object-contain bg-white border border-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center">
                        <span className="text-slate-400 font-semibold text-sm">
                          {(company.apollo_matched_name || company.company_name)?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {company.apollo_matched_name || company.company_name}
                      </h3>
                      <p className="text-sm text-slate-600 truncate">{company.domain}</p>
                    </div>
                  </div>

                  {/* Company Details */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    {company.industry && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        {company.industry}
                      </span>
                    )}
                    {company.estimated_num_employees && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        {company.estimated_num_employees.toLocaleString()} employees
                      </span>
                    )}
                    {company.city && company.country && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {company.city}, {company.country}
                      </span>
                    )}
                  </div>
                </div>

                {/* ICP Score */}
                <div className="shrink-0">
                  <ICPScoreBadge score={company.icp_score} />
                </div>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="mt-3 pt-3 border-t border-accent/20">
                  <div className="flex items-center gap-2 text-accent font-medium text-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Selected for contact search
                  </div>
                </div>
              )}
            </button>
          );
        })}

        {filteredCompanies.length === 0 && (
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-slate-600">No companies found matching your search.</p>
          </div>
        )}
      </div>

      {/* Selected Company Summary Card */}
      {selectedCompany && (
        <div className="bg-gradient-to-r from-accent/10 to-accent/5 rounded-lg border-2 border-accent/30 p-6 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Selected Company
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-600 mb-1">Company</div>
              <div className="font-medium text-slate-900">
                {selectedCompany.apollo_matched_name || selectedCompany.company_name}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">Domain</div>
              <div className="font-medium text-slate-900">{selectedCompany.domain}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">Industry</div>
              <div className="font-medium text-slate-900">{selectedCompany.industry || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">ICP Score</div>
              <div>
                <ICPScoreBadge score={selectedCompany.icp_score} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!selectedCompany}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            selectedCompany
              ? 'bg-accent text-white hover:bg-accent-dark'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Find Contacts at {selectedCompany?.apollo_matched_name || selectedCompany?.company_name || 'Company'}
        </button>
      </div>
    </div>
  );
}
