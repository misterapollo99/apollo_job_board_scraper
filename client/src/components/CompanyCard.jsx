import { useState } from 'react';
import ICPScoreBadge from './ICPScoreBadge';

export default function CompanyCard({ company }) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = (status) => {
    if (status === 'pass') return { icon: '\u2705', color: 'text-emerald-600' };
    if (status === 'partial') return { icon: '\u26A0\uFE0F', color: 'text-amber-600' };
    return { icon: '\u274C', color: 'text-red-500' };
  };

  const formatEmployees = (num) => {
    if (!num) return 'N/A';
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatFunding = (printed, raw) => {
    if (printed) return printed;
    if (raw) {
      if (raw >= 1e9) return `$${(raw / 1e9).toFixed(1)}B`;
      if (raw >= 1e6) return `$${(raw / 1e6).toFixed(0)}M`;
      if (raw >= 1e3) return `$${(raw / 1e3).toFixed(0)}K`;
      return `$${raw}`;
    }
    return 'N/A';
  };

  if (company.enrichment_status === 'failed') {
    return (
      <div className="card p-5 opacity-60">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-400 font-bold text-sm">
            {(company.company_name || '?')[0]}
          </div>
          <div>
            <h3 className="font-heading font-bold text-navy">{company.company_name}</h3>
            <p className="text-xs text-red-500">Enrichment failed</p>
          </div>
        </div>
        {company.error && (
          <p className="text-xs text-red-400 mt-2">{company.error}</p>
        )}
      </div>
    );
  }

  if (company.enrichment_status === 'not_found') {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm">
            {(company.company_name || '?')[0]}
          </div>
          <div className="flex-1">
            <h3 className="font-heading font-bold text-navy">{company.company_name}</h3>
            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full font-medium mt-1">
              Enrichment Not Available
            </span>
          </div>
        </div>
        
        {/* Show scraped data */}
        {company.scraped_job_title && (
          <div className="mb-3 px-3 py-2 bg-orange-50 border border-orange-100 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-orange-500 font-medium">Hiring:</span>
              <span className="text-orange-700 font-semibold truncate">{company.scraped_job_title}</span>
            </div>
          </div>
        )}
        
        {company.location && (
          <div className="text-xs text-slate-500 mb-2">
            <span className="font-medium">Location:</span> {company.location}
          </div>
        )}
        
        {company.error && (
          <p className="text-xs text-slate-400 mt-2">{company.error}</p>
        )}
        
        {company.scraped_job_url && (
          <div className="mt-3 pt-3 border-t border-slate-50">
            <a
              href={company.scraped_job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-accent hover:underline"
            >
              View Job Post →
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card-hover">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt=""
                className="w-10 h-10 rounded-lg object-contain bg-slate-50 shrink-0"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
              />
            ) : null}
            <div className={`w-10 h-10 rounded-lg bg-accent/10 items-center justify-center text-accent font-bold text-sm shrink-0 ${company.logo_url ? 'hidden' : 'flex'}`}>
              {(company.company_name || '?')[0]}
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-navy truncate">{company.company_name}</h3>
              <p className="text-xs text-slate-400 truncate">
                {company.industry || 'Unknown Industry'} {company.city ? `\u2022 ${company.city}${company.country ? `, ${company.country}` : ''}` : ''}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <ICPScoreBadge score={company.icp_score} size="sm" />
          </div>
        </div>
      </div>

      {/* ICP Score bar */}
      <div className="px-5 pb-3">
        <ICPScoreBadge score={company.icp_score} />
      </div>

      {/* Key metrics */}
      <div className="px-5 pb-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Employees:</span>
            <span className="font-semibold text-navy">{formatEmployees(company.estimated_num_employees)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Funding:</span>
            <span className="font-semibold text-navy">{formatFunding(company.total_funding_printed, company.total_funding)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Stage:</span>
            <span className="font-semibold text-navy">{company.latest_funding_stage || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400">Founded:</span>
            <span className="font-semibold text-navy">{company.founded_year || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm col-span-2">
            <span className="text-slate-400">Revenue:</span>
            <span className="font-semibold text-navy">{formatFunding(company.annual_revenue_printed, company.annual_revenue)}</span>
          </div>
        </div>
      </div>

      {/* Hiring signal */}
      <div className="mx-5 mb-3 px-3 py-2 bg-orange-50 border border-orange-100 rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-orange-500 font-medium">Hiring:</span>
          <span className="text-orange-700 font-semibold truncate">{company.scraped_job_title}</span>
        </div>
      </div>

      {/* ICP Breakdown */}
      {company.icp_breakdown && company.icp_breakdown.length > 0 && (
        <div className="px-5 pb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-navy transition-colors mb-2"
          >
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            ICP Score Breakdown
          </button>

          {expanded && (
            <div className="space-y-1.5">
              {company.icp_breakdown.map((item, idx) => {
                const { color } = statusIcon(item.status);
                return (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${color}`}>
                        {item.status === 'pass' ? '+' : item.status === 'partial' ? '~' : '-'}
                      </span>
                      <span className="text-slate-600">{item.factor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 truncate max-w-[140px]" title={item.detail}>
                        {item.detail}
                      </span>
                      <span className={`font-bold ${color}`}>+{item.points}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tech stack */}
      {company.technology_names && company.technology_names.length > 0 && expanded && (
        <div className="px-5 pb-3">
          <div className="text-xs font-semibold text-slate-500 mb-1.5">Tech Stack</div>
          <div className="flex flex-wrap gap-1">
            {company.technology_names.slice(0, 12).map((tech, idx) => (
              <span key={idx} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-medium">
                {tech}
              </span>
            ))}
            {company.technology_names.length > 12 && (
              <span className="px-1.5 py-0.5 text-slate-400 text-[10px] font-medium">
                +{company.technology_names.length - 12} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {expanded && company.short_description && (
        <div className="px-5 pb-3">
          <p className="text-xs text-slate-500 leading-relaxed">{company.short_description}</p>
        </div>
      )}

      {/* Action links */}
      <div className="px-5 py-3 border-t border-slate-50 flex items-center gap-3">
        {company.linkedin_url && (
          <a
            href={company.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            View LinkedIn
          </a>
        )}
        {company.website_url && (
          <a
            href={company.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-accent hover:underline"
          >
            View Website
          </a>
        )}
        {company.scraped_job_url && (
          <a
            href={company.scraped_job_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-slate-500 hover:underline ml-auto"
          >
            View Job Post
          </a>
        )}
      </div>
    </div>
  );
}
