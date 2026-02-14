import { useState, useEffect, useRef } from 'react';

export default function StepEnrich({ companies, onComplete }) {
  const [statuses, setStatuses] = useState(() =>
    companies.map(c => ({ company: c.company, status: 'pending', data: null }))
  );
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const startedRef = useRef(false);
  const resultsRef = useRef([]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const runEnrichment = async () => {
      try {
        const res = await fetch('/api/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companies }),
        });

        if (!res.ok) {
          setError(`Server error (${res.status})`);
          setDone(true);
          return;
        }

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
                  if (event.data) {
                    resultsRef.current = [...resultsRef.current, event.data];
                  }
                }

                if (event.type === 'complete') {
                  setDone(true);
                  setTimeout(() => onComplete(event.results), 1000);
                }
              } catch {
                // Skip malformed lines
              }
            }
          }
        }
      } catch (err) {
        setError(err.message || 'Connection failed');
        setDone(true);
      }
    };

    runEnrichment();
  }, [companies, onComplete]);

  const completed = statuses.filter(s => s.status === 'complete' || s.status === 'failed').length;
  const progressPct = companies.length > 0 ? Math.round((completed / companies.length) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="font-bold text-2xl text-center mb-4">Enriching Companies...</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <p>{completed} / {companies.length} processed ({progressPct}%)</p>
      {done && !error && <p>All done!</p>}
    </div>
  );
}