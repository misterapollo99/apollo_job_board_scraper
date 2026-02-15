import { useState, useEffect, useRef } from 'react';

export default function StepEnrich({ companies, onComplete, onProgress }) {
  const [statuses, setStatuses] = useState(() =>
    companies.map((c, index) => ({ 
      company: c.company, 
      status: 'pending', 
      data: null,
      originalIndex: index // Track original index for guaranteed mapping
    }))
  );
  const [current, setCurrent] = useState(0);
  const [total] = useState(companies.length);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const startedRef = useRef(false);
  const resultsRef = useRef([]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const runEnrichment = async () => {
      try {
        console.log('[StepEnrich] Starting enrichment for', companies.length, 'companies');
        console.log('[StepEnrich] Companies:', companies.map(c => c.company));
        
        const res = await fetch('/api/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companies }),
        });

        if (!res.ok) {
          let errMsg = `Server error (${res.status})`;
          try {
            const errBody = await res.json();
            errMsg = errBody.error || errMsg;
          } catch {
            // Could not parse error body
          }
          console.error('[StepEnrich] Server returned error:', errMsg);
          setError(errMsg);
          setDone(true);
          return;
        }

        console.log('[StepEnrich] SSE stream connected, reading response...');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let processedCount = 0;

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
                console.log('[StepEnrich] Event received:', event.type, 'company:', event.company || 'N/A', 'index:', event.index);

                if (event.type === 'progress') {
                  setCurrent(event.current);
                  setStatuses(prev => {
                    const next = [...prev];
                    // Try to find by index first (most reliable), then by company name
                    let idx = -1;
                    if (event.index !== undefined && event.index >= 0 && event.index < next.length) {
                      idx = event.index;
                    } else if (event.company) {
                      idx = next.findIndex(s => s.company === event.company);
                    }
                    
                    if (idx >= 0) {
                      console.log(`[StepEnrich] Updating status for "${next[idx].company}" (index ${idx}) to enriching`);
                      next[idx] = { ...next[idx], status: 'enriching' };
                    } else {
                      console.warn('[StepEnrich] Could not find company for progress event:', event);
                    }
                    return next;
                  });
                }

                if (event.type === 'company_done') {
                  processedCount++;
                  setStatuses(prev => {
                    const next = [...prev];
                    // Try to find by index first (most reliable), then by company name
                    let idx = -1;
                    if (event.index !== undefined && event.index >= 0 && event.index < next.length) {
                      idx = event.index;
                    } else if (event.company) {
                      idx = next.findIndex(s => s.company === event.company);
                    }
                    
                    if (idx >= 0) {
                      let newStatus = 'failed';
                      if (event.enrichment_status === 'success') {
                        newStatus = 'complete';
                      } else if (event.enrichment_status === 'not_found') {
                        newStatus = 'not_found';
                      }
                      
                      console.log(`[StepEnrich] Marking "${next[idx].company}" (index ${idx}) as ${newStatus}`);
                      
                      // Ensure we preserve the correct company name from our original list
                      const originalCompanyName = next[idx].company;
                      
                      next[idx] = {
                        ...next[idx],
                        status: newStatus,
                        data: event.data ? {
                          ...event.data,
                          company_name: originalCompanyName // Force correct company name
                        } : null,
                      };
                    } else {
                      console.warn('[StepEnrich] Could not find company for company_done event:', event);
                    }
                    return next;
                  });
                  
                  // Store result with the correct company name
                  if (event.data) {
                    setStatuses(prev => {
                      let idx = -1;
                      if (event.index !== undefined && event.index >= 0 && event.index < prev.length) {
                        idx = event.index;
                      } else if (event.company) {
                        idx = prev.findIndex(s => s.company === event.company);
                      }
                      
                      const correctedData = idx >= 0 ? {
                        ...event.data,
                        company_name: prev[idx].company // Use company name from our state
                      } : event.data;
                      
                      resultsRef.current = [...resultsRef.current, correctedData];
                      return prev;
                    });
                  }
                }

                if (event.type === 'complete') {
                  console.log('[StepEnrich] Enrichment complete:', event.successful, 'succeeded,', event.failed, 'failed');
                  console.log('[StepEnrich] Results:', event.results);
                  setDone(true);
                  
                  // Ensure all results have the correct company names
                  const correctedResults = event.results?.map((result, idx) => {
                    // Try to match by index or find the corresponding company
                    const originalCompany = companies[idx]?.company || 
                                          companies.find(c => c.company === result.company)?.company;
                    return {
                      ...result,
                      company: originalCompany || result.company
                    };
                  }) || resultsRef.current;
                  
                  setTimeout(() => {
                    onComplete(correctedResults);
                  }, 1500);
                }
              } catch (err) {
                console.error('[StepEnrich] Failed to parse event:', line, err);
              }
            }
          }
        }

        // If the stream ended without a 'complete' event, handle gracefully
        setDone(prev => {
          if (!prev) {
            console.warn('[StepEnrich] Stream ended without complete event, using partial results');
            if (resultsRef.current.length > 0) {
              setTimeout(() => onComplete(resultsRef.current), 1500);
            } else {
              setError('Enrichment stream ended unexpectedly with no results.');
            }
            return true;
          }
          return prev;
        });
      } catch (err) {
        console.error('[StepEnrich] Enrichment stream error:', err);
        setError(err.message || 'Connection to enrichment server failed');
        setDone(true);
      }
    };

    runEnrichment();
  }, [companies, onComplete]);

  const handleViewResults = () => {
    const partialResults = resultsRef.current.length > 0
      ? resultsRef.current
      : statuses
          .filter(s => s.data)
          .map(s => s.data);
    onComplete(partialResults);
  };

  const completed = statuses.filter(s => s.status === 'complete' || s.status === 'failed' || s.status === 'not_found').length;
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

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-800">Enrichment Error</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-navy">
            {done
              ? (error ? 'Enrichment Failed' : 'Enrichment Complete')
              : `Enriching ${Math.min(current, total)} of ${total} companies...`}
          </span>
          <span className="text-sm font-bold text-accent">{progressPct}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              done ? (error ? 'bg-red-400' : 'bg-emerald-500') : 'bg-accent progress-animate'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {done && !error && (
          <p className="text-sm text-emerald-600 font-medium mt-3 text-center">
            All companies processed. Loading results...
          </p>
        )}
      </div>

      {/* Fallback button */}
      {done && (
        <div className="text-center mb-6">
          <button
            onClick={handleViewResults}
            className="btn-primary"
          >
            {error ? 'View Partial Results' : 'View Results Now'}
          </button>
        </div>
      )}

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
              {item.status === 'not_found' && (
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                {item.status === 'not_found' && (
                  <span className="text-slate-500">Company not found in Apollo</span>
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
