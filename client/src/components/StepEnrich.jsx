import { useState, useEffect, useRef } from 'react';

export default function StepEnrich({ companies, onComplete, onProgress }) {
  const [statuses, setStatuses] = useState(() =>
    companies.map(c => ({ company: c.company, status: 'pending', data: null }))
  );
  const [current, setCurrent] = useState(0);
  const [total] = useState(companies.length);
  const [done, setDone] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const eventSource = new EventSource(
      // We can't use EventSource with POST, so we'll use fetch with streaming
      // Actually, let's use fetch with ReadableStream
    );

    // Use fetch with streaming for POST+SSE
    const runEnrichment = async () => {
      try {
        const res = await fetch('/api/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companies }),
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done: readerDone, value } = await reader.read();
          if (readerDone) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));

                if (event.type === 'progress') {
                  setCurrent(event.current);
                  setStatuses(prev => {
                    const next = [...prev];
                    const idx = next.findIndex(s => s.company === event.company);
                    if (idx >= 0) {
                      next[idx] = { ...next[idx], status: 'enriching' };
                    }
                    return next;
                  });
                }

                if (event.type === 'company_done') {
                  setStatuses(prev => {
                    const next = [...prev];
                    const idx = next.findIndex(s => s.company === event.company);
                    if (idx >= 0) {
                      next[idx] = {
                        ...next[idx],
                        status: event.status === 'complete' ? 'complete' : 'failed',
                        data: event.data,
                      };
                    }
                    return next;
                  });
                }

                if (event.type === 'complete') {
                  setDone(true);
                  // Wait a moment, then advance
                  setTimeout(() => {
                    onComplete(event.results);
                  }, 1500);
                }
              } catch {
                // Skip malformed events
              }
            }
          }
        }
      } catch (err) {
        console.error('Enrichment stream error:', err);
        setDone(true);
      }
    };

    runEnrichment();
  }, [companies, onComplete]);

  const completed = statuses.filter(s => s.status === 'complete' || s.status === 'failed').length;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="font-heading font-bold text-2xl text-navy mb-2">
          Enriching via Apollo.io
        </h2>
        <p className="text-slate-500">
          Looking up company data and calculating ICP scores
        </p>
      </div>

      {/* Progress bar */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-navy">
            {done ? 'Enrichment Complete' : `Enriching ${Math.min(current, total)} of ${total} companies...`}
          </span>
          <span className="text-sm font-bold text-accent">{progressPct}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              done ? 'bg-emerald-500' : 'bg-accent progress-animate'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {done && (
          <p className="text-sm text-emerald-600 font-medium mt-3 text-center">
            All companies processed. Loading results...
          </p>
        )}
      </div>

      {/* Company status list */}
      <div className="card divide-y divide-slate-50">
        {statuses.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 px-5 py-4">
            {/* Status icon */}
            <div className="shrink-0">
              {item.status === 'pending' && (
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                </div>
              )}
              {item.status === 'enriching' && (
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}
              {item.status === 'complete' && (
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {item.status === 'failed' && (
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>

            {/* Company name */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-navy truncate">{item.company}</div>
              <div className="text-xs text-slate-400">
                {item.status === 'pending' && 'Waiting...'}
                {item.status === 'enriching' && 'Fetching data from Apollo...'}
                {item.status === 'complete' && (
                  <span className="text-emerald-600">
                    Enriched — ICP Score: {item.data?.icp_score || 'N/A'}
                  </span>
                )}
                {item.status === 'failed' && (
                  <span className="text-red-500">Enrichment failed</span>
                )}
              </div>
            </div>

            {/* ICP Score preview */}
            {item.status === 'complete' && item.data?.icp_score != null && (
              <div className={`text-lg font-bold ${
                item.data.icp_score >= 80 ? 'text-emerald-600' :
                item.data.icp_score >= 60 ? 'text-amber-500' : 'text-red-500'
              }`}>
                {item.data.icp_score}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
