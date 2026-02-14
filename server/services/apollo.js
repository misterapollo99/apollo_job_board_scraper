const axios = require('axios');

const APOLLO_BASE_URL = 'https://api.apollo.io/api/v1';

function getHeaders(apiKey) {
  return {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  };
}

async function searchOrganization(companyName, apiKey) {
  try {
    const response = await axios.post(
      `${APOLLO_BASE_URL}/organizations/search`,
      {
        organization_name: companyName,
        page: 1,
        per_page: 1,
      },
      {
        headers: getHeaders(apiKey),
        timeout: 15000,
      }
    );

    const orgs = response.data.organizations || [];
    if (orgs.length > 0) {
      return orgs[0].primary_domain || orgs[0].website_url || null;
    }
    return null;
  } catch (err) {
    console.error(`Organization search failed for "${companyName}":`, err.message);
    return null;
  }
}

async function enrichOrganization(domain, apiKey) {
  try {
    const response = await axios.get(`${APOLLO_BASE_URL}/organizations/enrich`, {
      headers: getHeaders(apiKey),
      params: { domain },
      timeout: 15000,
    });

    return response.data.organization || null;
  } catch (err) {
    if (err.response) {
      if (err.response.status === 429) {
        throw new Error('RATE_LIMITED');
      }
      if (err.response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
    }
    console.error(`Enrichment failed for "${domain}":`, err.message);
    return null;
  }
}

function guessDomain(companyName) {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .concat('.com');
}

async function resolveDomain(companyName, knownDomain, apiKey) {
  // If we already have a domain, use it
  if (knownDomain) {
    return knownDomain;
  }

  // Try Apollo org search first
  const searchDomain = await searchOrganization(companyName, apiKey);
  if (searchDomain) {
    // Clean up the domain
    let domain = searchDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    return domain;
  }

  // Fallback: guess the domain
  return guessDomain(companyName);
}

async function enrichCompany(job, apiKey) {
  // Resolve domain
  const domain = await resolveDomain(job.company, job.domain, apiKey);

  // Add delay for rate limiting
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Enrich via Apollo
  let retries = 0;
  let org = null;

  while (retries < 3) {
    try {
      org = await enrichOrganization(domain, apiKey);
      break;
    } catch (err) {
      if (err.message === 'RATE_LIMITED' && retries < 2) {
        const backoff = Math.pow(2, retries + 1) * 1000;
        console.log(`Rate limited, waiting ${backoff}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        retries++;
      } else if (err.message === 'UNAUTHORIZED') {
        throw new Error('Invalid Apollo API key');
      } else {
        break;
      }
    }
  }

  if (!org) {
    return {
      scraped_job_title: job.title,
      scraped_job_url: job.url,
      company_name: job.company,
      domain: domain,
      enrichment_status: 'failed',
      error: 'Could not enrich this company',
    };
  }

  return {
    scraped_job_title: job.title,
    scraped_job_url: job.url,
    company_name: org.name || job.company,
    domain: org.primary_domain || domain,
    website_url: org.website_url,
    industry: org.industry,
    estimated_num_employees: org.estimated_num_employees,
    annual_revenue: org.annual_revenue,
    annual_revenue_printed: org.annual_revenue_printed,
    total_funding: org.total_funding,
    total_funding_printed: org.total_funding_printed,
    latest_funding_stage: org.latest_funding_stage,
    latest_funding_round_date: org.latest_funding_round_date,
    founded_year: org.founded_year,
    short_description: org.short_description,
    logo_url: org.logo_url,
    linkedin_url: org.linkedin_url,
    city: org.city,
    state: org.state,
    country: org.country,
    keywords: org.keywords || [],
    technology_names: org.technology_names || [],
    seo_description: org.seo_description,
    enrichment_status: 'success',
  };
}

module.exports = { enrichCompany, searchOrganization, enrichOrganization, resolveDomain };
