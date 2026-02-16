import { API_BASE_URL } from '../config';
const COMPANY_STEPS = [
  { number: 1, label: 'Scrape Jobs', description: 'Fetch job board data' },
  { number: 2, label: 'Review Data', description: 'Select companies' },
  { number: 3, label: 'Enrich', description: 'Apollo enrichment' },
  { number: 4, label: 'Results', description: 'ICP scored dashboard' },
  { number: 5, label: 'Export', description: 'Download CSV' },
];

const PEOPLE_STEPS = [
  { number: 6, label: 'Select Company', description: 'Choose target company' },
  { number: 7, label: 'Find Contacts', description: 'Search decision-makers' },
  { number: 8, label: 'Enrich Contacts', description: 'Get emails & phones' },
  { number: 9, label: 'Export Contacts', description: 'Download contact CSV' },
];

export default function Sidebar({ currentStep, completedSteps, onStepClick }) {
  return (
    <aside className="w-64 bg-navy text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-sm">
            SO
          </div>
          <div>
            <div className="font-heading font-bold text-sm">SimpleOnboard.io</div>
            <div className="text-[10px] text-slate-400 tracking-wider uppercase">Prospect Engine</div>
          </div>
        </div>
      </div>

      {/* Steps */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {/* Company Enrichment Section */}
        <div className="space-y-1 mb-4">
          {COMPANY_STEPS.map((step, idx) => {
            const isActive = currentStep === step.number;
            const isCompleted = completedSteps.has(step.number);
            const isClickable = isCompleted || step.number <= currentStep;

            return (
              <button
                key={step.number}
                onClick={() => isClickable && onStepClick(step.number)}
                className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : isClickable
                    ? 'text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer'
                    : 'text-slate-500 cursor-not-allowed'
                }`}
              >
                {/* Step indicator */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isActive
                      ? 'bg-accent text-white'
                      : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>

                {/* Step text */}
                <div>
                  <div className={`text-sm font-semibold ${isActive ? 'text-white' : ''}`}>
                    {step.label}
                  </div>
                  <div className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                    {step.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-4 py-2 border-t border-b border-white/10">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3">
            People Enrichment
          </div>
        </div>

        {/* People Enrichment Section */}
        <div className="space-y-1">
          {PEOPLE_STEPS.map((step, idx) => {
            const isActive = currentStep === step.number;
            const isCompleted = completedSteps.has(step.number);
            const isClickable = isCompleted || step.number <= currentStep;

            return (
              <button
                key={step.number}
                onClick={() => isClickable && onStepClick(step.number)}
                className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : isClickable
                    ? 'text-slate-300 hover:bg-white/5 hover:text-white cursor-pointer'
                    : 'text-slate-500 cursor-not-allowed'
                }`}
              >
                {/* Step indicator */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isActive
                      ? 'bg-accent text-white'
                      : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>

                {/* Step text */}
                <div>
                  <div className={`text-sm font-semibold ${isActive ? 'text-white' : ''}`}>
                    {step.label}
                  </div>
                  <div className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                    {step.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-slate-500 text-center">
          Powered by Apollo.io API
        </div>
      </div>
    </aside>
  );
}
