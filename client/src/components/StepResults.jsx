import { useState, useMemo } from 'react';
import CompanyCard from './CompanyCard';

export default function StepResults({ companies, onExport }) {
  const [sortBy, setSortBy] = useState('icp_score');
  const [sortDir, setSortDir] = useState('desc');

  const successfulCompanies = useMemo(
    () => companies.filter(c => c.enrichment_status === 'success'),
    [companies]
  );

  const sorted = useMemo(() => {
    const arr = [...successfulCompanies];
    arr.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'icp_score':
          aVal = a.icp_score || 0;
          bVal = b.icp_score || 0;
          break;
        case 'employees':
          aVal = a.estimated_num_employees || 0;
          bVal = b.estimated_num_employees || 0;
          break;
        case 'funding':
          aVal = a.total_funding || 0;
          bVal = b.total_funding || 0;
          break;
        case 'name':
          aVal = (a.company_name || '').toLowerCase();
          bVal = (b.company_name || '').toLowerCase();
          return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        default:
          aVal = a.icp_score || 0;
          bVal = b.icp_score || 0;
      }
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
    return arr;
  }, [successfulCompanies, sortBy, sortDir]);

  const failedCompanies = companies.filter(c => c.enrichment_status === 'failed');

  // Summary stats
  const avgScore = successfulCompanies.length > 0
    ? Math.round(successfulCompanies.reduce((sum, c) => sum + (c.icp_score || 0), 0) / successfulCompanies.length)
    : 0;

  const topIndustry = useMemo(() => {
    const counts = {};
    successfulCompanies.forEach(c => {
      if (c.industry) {
        counts[c.industry] = (counts[c.industry] || 0) + 1;
      }
    });
    let best = 'N/A';
    let max = 0;
    for (const [ind, count] of Object.entries(counts)) {
      if (count > max) { max = count; best = ind; }
    }
    return best;
  }, [successfulCompanies]);

  const withFunding = successfulCompanies.filter(c => c.total_funding && c.total_funding > 0).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-2xl text-navy">Enriched Results</h2>
          <p className="text-slate-500 text-sm mt-1">
            {successfulCompanies.length} companies enriched and scored
            {failedCompanies.length > 0 && (
              <span className="text-red-500 ml-1">({failedCompanies.length} failed)</span>
            )}
          </p>
        </div>
        <button onClick={onExport} className="btn-primary">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export to CSV
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Companies</div>
          <div className="text-2xl font-bold text-navy">{successfulCompanies.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Avg ICP Score</div>
          <div className={`text-2xl font-bold ${avgScore >= 80 ? 'text-emerald-600' : avgScore >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
            {avgScore}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Top Industry</div>
          <div className="text-sm font-bold text-navy truncate" title={topIndustry}>{topIndustry}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">With Funding</div>
          <div className="text-2xl font-bold text-navy">{withFunding}</div>
        </div>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-slate-500">Sort by:</span>
        {[
          { key: 'icp_score', label: 'ICP Score' },
          { key: 'employees', label: 'Company Size' },
          { key: 'funding', label: 'Funding' },
          { key: 'name', label: 'Name' },
        ].map(opt => (
          <button
            key={opt.key}
            onClick={() => {
              if (sortBy === opt.key) {
                setSortDir(d => d === 'desc' ? 'asc' : 'desc');
              } else {
                setSortBy(opt.key);
                setSortDir('desc');
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              sortBy === opt.key
                ? 'bg-navy text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {opt.label}
            {sortBy === opt.key && (
              <span className="ml-1">{sortDir === 'desc' ? '\u2193' : '\u2191'}</span>
            )}
          </button>
        ))}
      </div>

      {/* Company cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((company, idx) => (
          <CompanyCard key={idx} company={company} />
        ))}
      </div>

      {/* Failed companies */}
      {failedCompanies.length > 0 && (
        <div className="mt-8">
          <h3 className="font-heading font-semibold text-lg text-slate-400 mb-3">Failed Enrichments</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {failedCompanies.map((company, idx) => (
              <CompanyCard key={idx} company={company} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
