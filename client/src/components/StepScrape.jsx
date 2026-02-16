import { API_BASE_URL } from '../config';
import { useState } from 'react';

const ALL_CATEGORIES = [
  'Onboarding Specialist',
  'Implementation Specialist',
  'Customer Success Manager',
  'Solutions Architect',
  'Director of Customer Success',
  'Head of Customer Success',
];

export default function StepScrape({ onComplete }) {
  const [selectedCategories, setSelectedCategories] = useState(new Set(ALL_CATEGORIES));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const handleScrape = async () => {
    setLoading(true);
    setError(null);

    try {
      const cats = Array.from(selectedCategories).join(',');
      const res = await fetch(`/api/scrape?categories=${encodeURIComponent(cats)}`);
      const data = await res.json();

      if (data.success && data.jobs && data.jobs.length > 0) {
        onComplete(data.jobs, data.source);
      } else {
        setError('No jobs found. Please try again.');
      }
    } catch (err) {
      setError('Failed to connect to server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="font-heading font-bold text-2xl text-navy mb-2">
          Scrape Job Board
        </h2>
        <p className="text-slate-500">
          Discover companies hiring for onboarding & customer success roles
        </p>
      </div>

      {/* Target board card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-accent to-cyan-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-heading font-bold text-navy">CustomerSuccessSnack Job Board</h3>
            <a
              href="https://jobs.customersuccesssnack.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:underline"
            >
              jobs.customersuccesssnack.com
            </a>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-5">
          This niche job board focuses on Customer Success, Onboarding, and Implementation roles.
          We'll scrape it to identify companies that are actively hiring — a strong buying signal for SimpleOnboard.io.
        </p>

        {/* Category filters */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-700">Filter by Role Category</label>
            <button
              onClick={() => {
                if (selectedCategories.size === ALL_CATEGORIES.length) {
                  setSelectedCategories(new Set());
                } else {
                  setSelectedCategories(new Set(ALL_CATEGORIES));
                }
              }}
              className="text-xs text-accent hover:underline font-medium"
            >
              {selectedCategories.size === ALL_CATEGORIES.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedCategories.has(cat)
                    ? 'bg-accent/10 text-accent border border-accent/30'
                    : 'bg-slate-100 text-slate-500 border border-transparent hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Scrape button */}
        <button
          onClick={handleScrape}
          disabled={loading || selectedCategories.size === 0}
          className="btn-primary w-full text-base"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Scraping Job Board...
            </span>
          ) : (
            'Start Scrape'
          )}
        </button>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: '1', title: 'Scrape', desc: 'Fetch live job listings from the CS job board' },
          { icon: '2', title: 'Enrich', desc: 'Look up each company via Apollo.io API' },
          { icon: '3', title: 'Score', desc: 'Score against our Ideal Customer Profile' },
        ].map(item => (
          <div key={item.icon} className="text-center p-4">
            <div className="w-8 h-8 rounded-full bg-accent/10 text-accent font-bold text-sm flex items-center justify-center mx-auto mb-2">
              {item.icon}
            </div>
            <div className="text-sm font-semibold text-navy">{item.title}</div>
            <div className="text-xs text-slate-400 mt-1">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
