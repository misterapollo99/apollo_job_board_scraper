import { API_BASE_URL } from '../config';
import { useState } from 'react';

export default function ApiKeyModal({ onClose, onSave }) {
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleTest = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);

    try {
      // Save key first
      await fetch(`${API_BASE_URL}/api/config/api-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      // Test it
      const res = await fetch(`${API_BASE_URL}/api/config/test-key`, { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setTestResult({ success: true, message: data.message });
      } else {
        setTestResult({ success: false, message: data.error || 'Test failed' });
      }
    } catch {
      setTestResult({ success: false, message: 'Connection error' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/config/api-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      if (res.ok) {
        onSave(apiKey.trim());
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-lg text-navy">API Settings</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Apollo.io API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Apollo API key..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            />
            <p className="text-xs text-slate-400 mt-1">
              Get your API key from{' '}
              <a
                href="https://app.apollo.io/#/settings/integrations/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Apollo.io Settings
              </a>
            </p>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg text-sm ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {testResult.message}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleTest}
              disabled={!apiKey.trim() || testing}
              className="btn-secondary text-sm flex-1"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim() || saving}
              className="btn-primary text-sm flex-1"
            >
              {saving ? 'Saving...' : 'Save Key'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
