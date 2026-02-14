function calculateICPScore(company) {
  let score = 0;
  const breakdown = [];

  // 1. Industry Match (0 or 20 points)
  const saasKeywords = [
    'software', 'saas', 'information technology', 'internet',
    'computer software', 'technology', 'cloud', 'platform',
  ];
  const industryMatch = saasKeywords.some(kw =>
    (company.industry || '').toLowerCase().includes(kw)
  );
  if (industryMatch) {
    score += 20;
    breakdown.push({ factor: 'Industry Match', points: 20, status: 'pass', detail: `SaaS/Software (${company.industry})` });
  } else {
    breakdown.push({ factor: 'Industry Match', points: 0, status: 'fail', detail: company.industry || 'Unknown' });
  }

  // 2. Employee Count — sweet spot 100-2000 (0, 5, 10, or 15 points)
  const emp = company.estimated_num_employees || 0;
  if (emp >= 100 && emp <= 2000) {
    score += 15;
    breakdown.push({ factor: 'Employee Count', points: 15, status: 'pass', detail: `${emp.toLocaleString()} employees (ideal range)` });
  } else if (emp > 2000 && emp <= 5000) {
    score += 10;
    breakdown.push({ factor: 'Employee Count', points: 10, status: 'partial', detail: `${emp.toLocaleString()} employees (larger than ideal)` });
  } else if (emp >= 50 && emp < 100) {
    score += 5;
    breakdown.push({ factor: 'Employee Count', points: 5, status: 'partial', detail: `${emp.toLocaleString()} employees (smaller than ideal)` });
  } else {
    breakdown.push({ factor: 'Employee Count', points: 0, status: 'fail', detail: `${emp.toLocaleString()} employees` });
  }

  // 3. Funding Stage — Series B+ preferred (0, 5, or 15 points)
  const fundingStage = (company.latest_funding_stage || '').toLowerCase();
  const strongFunding = ['series b', 'series c', 'series d', 'series e', 'series f', 'ipo', 'public'];
  const okFunding = ['series a', 'seed', 'grant', 'pre-seed'];
  if (strongFunding.some(s => fundingStage.includes(s))) {
    score += 15;
    breakdown.push({ factor: 'Funding Stage', points: 15, status: 'pass', detail: company.latest_funding_stage });
  } else if (okFunding.some(s => fundingStage.includes(s))) {
    score += 5;
    breakdown.push({ factor: 'Funding Stage', points: 5, status: 'partial', detail: company.latest_funding_stage });
  } else {
    breakdown.push({ factor: 'Funding Stage', points: 0, status: 'fail', detail: company.latest_funding_stage || 'Unknown' });
  }

  // 4. Annual Revenue — $10M+ preferred (0, 5, or 10 points)
  const rev = company.annual_revenue || 0;
  if (rev >= 10000000) {
    score += 10;
    breakdown.push({ factor: 'Revenue Signal', points: 10, status: 'pass', detail: company.annual_revenue_printed || `$${(rev / 1000000).toFixed(0)}M` });
  } else if (rev >= 1000000) {
    score += 5;
    breakdown.push({ factor: 'Revenue Signal', points: 5, status: 'partial', detail: company.annual_revenue_printed || `$${(rev / 1000000).toFixed(1)}M` });
  } else {
    breakdown.push({ factor: 'Revenue Signal', points: 0, status: 'fail', detail: rev > 0 ? `$${rev.toLocaleString()}` : 'Unknown' });
  }

  // 5. Tech Stack Fit — uses CRM/CS tools SimpleOnboard integrates with (0-15 points)
  const techNames = (company.technology_names || []).map(t => t.toLowerCase());
  const targetTech = {
    salesforce: 5,
    hubspot: 5,
    gainsight: 5,
    intercom: 3,
    zendesk: 3,
    totango: 5,
    churnzero: 5,
    freshworks: 3,
    jira: 2,
    slack: 1,
    segment: 2,
  };
  let techScore = 0;
  const matchedTech = [];
  for (const [tech, points] of Object.entries(targetTech)) {
    if (techNames.some(t => t.includes(tech))) {
      techScore += points;
      matchedTech.push(tech);
    }
  }
  techScore = Math.min(techScore, 15);
  score += techScore;
  breakdown.push({
    factor: 'Tech Stack Fit',
    points: techScore,
    status: techScore >= 10 ? 'pass' : techScore > 0 ? 'partial' : 'fail',
    detail: matchedTech.length > 0 ? `Uses: ${matchedTech.join(', ')}` : 'No matching integrations found',
  });

  // 6. Hiring Signal — always 20 points (they're on a CS job board)
  score += 20;
  breakdown.push({ factor: 'Hiring Signal', points: 20, status: 'pass', detail: `Hiring: ${company.scraped_job_title}` });

  // 7. Recent Funding — funded within last 24 months (0 or 10 points)
  if (company.latest_funding_round_date) {
    const fundingDate = new Date(company.latest_funding_round_date);
    const monthsAgo = (Date.now() - fundingDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo <= 24) {
      score += 10;
      breakdown.push({ factor: 'Recent Funding', points: 10, status: 'pass', detail: `Funded ${Math.round(monthsAgo)} months ago` });
    } else {
      breakdown.push({ factor: 'Recent Funding', points: 0, status: 'fail', detail: `Funded ${Math.round(monthsAgo)} months ago` });
    }
  } else {
    breakdown.push({ factor: 'Recent Funding', points: 0, status: 'fail', detail: 'No funding data' });
  }

  // Max possible: 20+15+15+10+15+20+10 = 105, normalize to 100
  const normalizedScore = Math.min(Math.round((score / 105) * 100), 100);

  return { score: normalizedScore, rawScore: score, maxScore: 105, breakdown };
}

module.exports = { calculateICPScore };
