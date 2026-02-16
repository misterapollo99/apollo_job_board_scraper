import { API_BASE_URL } from '../config';
import { useState, useMemo } from 'react';

export default function StepReview({ jobs, source, onComplete, onBack }) {
  const [selected, setSelected] = useState(() => new Set(jobs.map((_, i) => i)));

  const toggleAll = () => {
    if (selected.size === jobs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(jobs.map((_, i) => i)));
    }
  };

  const toggleOne = (idx) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleContinue = () => {
    const selectedJobs = jobs.filter((_, i) => selected.has(i));
    onComplete(selectedJobs);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-heading font-bold text-2xl text-navy">Review Scraped Data</h2>
          <p className="text-slate-500 text-sm mt-1">
            {jobs.length} companies found
            {source === 'fallback' && (
              <span className="ml-2 text-amber-600 font-medium">(using fallback data)</span>
            )}
          </p>
        </div>
        <button onClick={onBack} className="btn-secondary text-sm">
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>

      {/* Selection bar */}
      <div className="card p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-navy"
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              selected.size === jobs.length
                ? 'bg-accent border-accent text-white'
                : 'border-slate-300'
            }`}>
              {selected.size === jobs.length && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            {selected.size === jobs.length ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-sm text-slate-400">|</span>
          <span className="text-sm font-semibold text-accent">
            {selected.size} of {jobs.length} companies selected for enrichment
          </span>
        </div>

        <button
          onClick={handleContinue}
          disabled={selected.size === 0}
          className="btn-primary text-sm"
        >
          Enrich Selected Companies
          <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>

      {/* Job table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="w-12 px-4 py-3" />
              <th className="w-12 px-4 py-3" />
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Title</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {jobs.map((job, idx) => (
              <tr
                key={idx}
                onClick={() => toggleOne(idx)}
                className={`cursor-pointer transition-colors ${
                  selected.has(idx) ? 'bg-accent/5' : 'hover:bg-slate-50'
                }`}
              >
                <td className="px-4 py-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selected.has(idx)
                      ? 'bg-accent border-accent text-white'
                      : 'border-slate-300'
                  }`}>
                    {selected.has(idx) && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {job.logo ? (
                    <img
                      src={job.logo}
                      alt=""
                      className="w-8 h-8 rounded-lg object-contain bg-slate-50"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                      {(job.company || '?')[0]}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-sm text-navy">{job.company}</span>
                  {job.domain && (
                    <span className="block text-xs text-slate-400">{job.domain}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{job.title}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{job.location}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">
                    {job.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
