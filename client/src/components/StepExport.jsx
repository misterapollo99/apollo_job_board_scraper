import { useState } from 'react';

export default function StepExport({ companies, onBack }) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const successful = companies.filter(c => c.enrichment_status === 'success');

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/export');
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simpleonboard_prospects_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setDownloaded(true);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-heading font-bold text-2xl text-navy mb-2">
          Export Data
        </h2>
        <p className="text-slate-500">
          Download enriched prospect data as a CSV file
        </p>
      </div>

      <div className="card p-8 text-center">
        {/* File preview icon */}
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>

        <h3 className="font-heading font-bold text-lg text-navy mb-2">
          simpleonboard_prospects_{new Date().toISOString().split('T')[0]}.csv
        </h3>

        <p className="text-sm text-slate-500 mb-6">
          {successful.length} companies with enriched data including ICP scores,
          company details, tech stacks, funding info, and more.
        </p>

        {/* CSV columns preview */}
        <div className="text-left bg-slate-50 rounded-lg p-4 mb-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">CSV Columns</div>
          <div className="flex flex-wrap gap-1.5">
            {[
              'Company Name', 'Domain', 'Industry', 'Employees', 'Annual Revenue',
              'Funding Stage', 'Total Funding', 'Founded Year', 'City', 'State',
              'Country', 'LinkedIn URL', 'Website URL', 'Hiring Role', 'ICP Score',
              'Tech Stack', 'Keywords', 'Description',
            ].map(col => (
              <span key={col} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs text-slate-600">
                {col}
              </span>
            ))}
          </div>
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className={`btn-primary text-base px-8 ${downloaded ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
        >
          {downloading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </span>
          ) : downloaded ? (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Downloaded! Click to Download Again
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download CSV
            </span>
          )}
        </button>

        <button
          onClick={onBack}
          className="block mx-auto mt-4 text-sm text-slate-500 hover:text-navy transition-colors"
        >
          Back to Results
        </button>
      </div>
    </div>
  );
}
