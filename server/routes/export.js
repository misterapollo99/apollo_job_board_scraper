const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const data = req.store.enrichedCompanies;

  if (!data || data.length === 0) {
    return res.status(400).json({ error: 'No enriched data available for export' });
  }

  const headers = [
    'Company Name',
    'Domain',
    'Industry',
    'Employees',
    'Annual Revenue',
    'Funding Stage',
    'Total Funding',
    'Founded Year',
    'City',
    'State',
    'Country',
    'LinkedIn URL',
    'Website URL',
    'Hiring Role',
    'ICP Score',
    'Tech Stack',
    'Keywords',
    'Company Description',
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = data.map(company => [
    escapeCsv(company.company_name),
    escapeCsv(company.domain),
    escapeCsv(company.industry),
    escapeCsv(company.estimated_num_employees),
    escapeCsv(company.annual_revenue_printed || company.annual_revenue),
    escapeCsv(company.latest_funding_stage),
    escapeCsv(company.total_funding_printed || company.total_funding),
    escapeCsv(company.founded_year),
    escapeCsv(company.city),
    escapeCsv(company.state),
    escapeCsv(company.country),
    escapeCsv(company.linkedin_url),
    escapeCsv(company.website_url),
    escapeCsv(company.scraped_job_title),
    escapeCsv(company.icp_score),
    escapeCsv((company.technology_names || []).join('; ')),
    escapeCsv((company.keywords || []).join('; ')),
    escapeCsv(company.short_description || company.seo_description),
  ]);

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

  const date = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="simpleonboard_prospects_${date}.csv"`);
  res.send(csv);
});

module.exports = router;
