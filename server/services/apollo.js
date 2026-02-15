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
  console.log(`[Apollo Search] Searching for company: "${companyName}"`);
  
  try {
    const response = await axios.post(
      `${APOLLO_BASE_URL}/organizations/search`,
      {
        q_organization_name: companyName,
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
      const org = orgs[0];
      const domain = org.primary_domain || (org.website_url ? org.website_url.replace(/^https?:\/\//, '').replace(/\/.*$/, '') : null);
      console.log(`[Apollo Search] ✓ Found: "${org.name}" with domain: "${domain}"`);
      return { domain, orgName: org.name };
    }
    
    console.log(`[Apollo Search] ✗ No results for "${companyName}"`);
    return null;
  } catch (err) {
    console.error(`[Apollo Search] ERROR for "${companyName}":`, err.message);
    
    // Detailed error logging for debugging
    if (err.response) {
      console.error('[Apollo Search] Error Status:', err.response.status);
      console.error('[Apollo Search] Error Status Text:', err.response.statusText);
      console.error('[Apollo Search] Error Response Data:', JSON.stringify(err.response.data, null, 2));
      console.error('[Apollo Search] Error Response Headers:', err.response.headers);
    }
    
    // Log the request that caused the error
    console.error('[Apollo Search] Failed Request Details:');
    console.error('  URL:', `${APOLLO_BASE_URL}/organizations/search`);
    console.error('  Headers:', {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'x-api-key': apiKey?.substring(0, 10) + '...' + apiKey?.substring(apiKey.length - 4)
    });
    console.error('  Body:', JSON.stringify({
      q_organization_name: companyName,
      page: 1,
      per_page: 1,
    }, null, 2));
    
    return null;
  }
}

async function enrichOrganization(domain, apiKey) {
  console.log(`[Apollo Enrichment] Calling API for domain: "${domain}"`);
  
  try {
    const response = await axios.get(`${APOLLO_BASE_URL}/organizations/enrich`, {
      headers: getHeaders(apiKey),
      params: { domain },
      timeout: 15000,
    });

    const org = response.data.organization || null;
    if (org) {
      console.log(`[Apollo Enrichment] ✓ Returned: "${org.name}" for domain "${domain}"`);
    } else {
      console.log(`[Apollo Enrichment] ✗ No organization found for domain "${domain}"`);
    }
    return org;
  } catch (err) {
    if (err.response) {
      if (err.response.status === 429) {
        throw new Error('RATE_LIMITED');
      }
      if (err.response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      if (err.response.status === 404) {
        console.log(`[Apollo Enrichment] ✗ 404: Domain "${domain}" not found in Apollo`);
        return null;
      }
    }
    console.error(`[Apollo Enrichment] ERROR for "${domain}":`, err.message);
    return null;
  }
}

function guessDomains(companyName) {
  // Generate multiple domain guesses
  const cleaned = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  
  const guesses = [
    `${cleaned}.com`,
    `${cleaned}.io`,
    `${cleaned}.ai`,
  ];
  
  // Also try without removing spaces (for companies like "do it" -> "doit.com")
  const spaceless = companyName.toLowerCase().replace(/\s+/g, '');
  if (spaceless !== cleaned) {
    guesses.push(`${spaceless}.com`);
  }
  
  return [...new Set(guesses)]; // Remove duplicates
}

async function resolveDomain(companyName, knownDomain, apiKey) {
  console.log(`\n[Domain Resolution] Starting for company: "${companyName}"`);
  
  // If we already have a domain from the scraper, validate it first
  if (knownDomain) {
    console.log(`[Domain Resolution] Using scraped domain: "${knownDomain}"`);
    return { domain: knownDomain, source: 'scraped', searchedOrgName: null };
  }

  // Step 1: Try Apollo Organization Search
  const searchResult = await searchOrganization(companyName, apiKey);
  if (searchResult && searchResult.domain) {
    console.log(`[Domain Resolution] ✓ Using domain from Apollo Search: "${searchResult.domain}"`);
    return { 
      domain: searchResult.domain, 
      source: 'apollo_search',
      searchedOrgName: searchResult.orgName 
    };
  }

  // Step 2: Try domain guesses
  const guesses = guessDomains(companyName);
  console.log(`[Domain Resolution] Apollo search failed, trying domain guesses: ${guesses.join(', ')}`);
  
  for (const guess of guesses) {
    console.log(`[Domain Resolution] Trying guess: "${guess}"`);
    
    try {
      // Try to enrich with this domain
      const testOrg = await enrichOrganization(guess, apiKey);
      
      if (testOrg && testOrg.name) {
        // IMPORTANT: Also check if the returned domain matches our guess
        // This prevents Apollo from returning a random/popular domain
        const returnedDomain = (testOrg.primary_domain || testOrg.website_url || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
        const ourGuess = guess.toLowerCase();
        
        const domainMatches = returnedDomain === ourGuess || returnedDomain.endsWith(ourGuess) || ourGuess.endsWith(returnedDomain);
        
        // Validate if the returned org matches our company
        const isMatch = validateCompanyMatch(companyName, testOrg.name);
        console.log(`[Domain Resolution] Enrichment for "${guess}" returned: "${testOrg.name}" (domain: ${returnedDomain}) — Name Match: ${isMatch ? 'YES' : 'NO'}, Domain Match: ${domainMatches ? 'YES' : 'NO'}`);
        
        if (isMatch && domainMatches) {
          console.log(`[Domain Resolution] ✓ Using validated guess: "${guess}"`);
          return { domain: guess, source: 'guess_validated', searchedOrgName: testOrg.name };
        } else if (!domainMatches) {
          console.log(`[Domain Resolution] ⚠️  REJECTED: Apollo returned different domain "${returnedDomain}" when we searched "${guess}" - likely wrong company`);
        }
      }
    } catch (err) {
      console.log(`[Domain Resolution] Guess "${guess}" failed: ${err.message}`);
    }
  }

  // Step 3: Nothing worked
  console.log(`[Domain Resolution] ✗ Could not resolve domain for "${companyName}"`);
  return { domain: null, source: 'failed', searchedOrgName: null };
}

/**
 * Validates if the enriched organization matches the company we searched for
 * Uses fuzzy matching to allow variations like "Haddock" vs "Haddock Inc"
 * but rejects obvious mismatches like "haddock" vs "Google"
 */
function validateCompanyMatch(searchedCompany, apolloOrgName) {
  if (!apolloOrgName) return false;
  
  const searched = searchedCompany.toLowerCase().trim();
  const returned = apolloOrgName.toLowerCase().trim();
  
  // Exact match
  if (searched === returned) return true;
  
  // Check if one contains the other (fuzzy match)
  // "haddock" matches "haddock inc" or "haddock.io"
  if (returned.includes(searched) || searched.includes(returned)) {
    return true;
  }
  
  // Extract core company name by removing common suffixes
  const suffixes = [' inc', ' llc', ' ltd', ' corporation', ' corp', ' co', '.io', '.com', '.ai'];
  let searchedCore = searched;
  let returnedCore = returned;
  
  for (const suffix of suffixes) {
    searchedCore = searchedCore.replace(suffix, '');
    returnedCore = returnedCore.replace(suffix, '');
  }
  
  // Compare cores
  if (searchedCore === returnedCore) return true;
  if (returnedCore.includes(searchedCore) || searchedCore.includes(returnedCore)) {
    return true;
  }
  
  // No match
  return false;
}

async function enrichCompany(job, apiKey) {
  console.log(`\n======================================`);
  console.log(`[enrichCompany] Starting enrichment for: "${job.company}"`);
  
  // Resolve domain
  const domainResult = await resolveDomain(job.company, job.domain, apiKey);
  
  if (!domainResult.domain) {
    console.log(`[enrichCompany] ✗ Final status for "${job.company}": NOT_FOUND (no valid domain)`);
    return {
      scraped_job_title: job.title,
      scraped_job_url: job.url,
      company_name: job.company,
      location: job.location,
      domain: null,
      enrichment_status: 'not_found',
      error: 'Could not resolve domain for this company',
    };
  }

  console.log(`[enrichCompany] Resolved domain: "${domainResult.domain}" (source: ${domainResult.source})`);

  // Add delay for rate limiting
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Enrich via Apollo
  console.log(`[enrichCompany] Calling Apollo Enrichment API for domain: "${domainResult.domain}"`);
  let retries = 0;
  let org = null;

  while (retries < 3) {
    try {
      org = await enrichOrganization(domainResult.domain, apiKey);
      break;
    } catch (err) {
      if (err.message === 'RATE_LIMITED' && retries < 2) {
        const backoff = Math.pow(2, retries + 1) * 1000;
        console.log(`[enrichCompany] Rate limited, waiting ${backoff}ms before retry...`);
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
    console.log(`[enrichCompany] ✗ Apollo Enrichment returned no data for domain: "${domainResult.domain}"`);
    console.log(`[enrichCompany] ✗ Final status for "${job.company}": NOT_FOUND (enrichment failed)`);
    return {
      scraped_job_title: job.title,
      scraped_job_url: job.url,
      company_name: job.company,
      location: job.location,
      domain: domainResult.domain,
      enrichment_status: 'not_found',
      error: 'Apollo enrichment returned no data for this domain',
    };
  }

  console.log(`[enrichCompany] Apollo Enrichment returned: "${org.name}"`);

  // VALIDATE: Check if Apollo returned data for the correct company
  // Skip validation if we already validated during domain guessing
  let isMatch = domainResult.source === 'guess_validated';
  
  if (!isMatch) {
    isMatch = validateCompanyMatch(job.company, org.name);
    console.log(`[enrichCompany] Validation: "${job.company}" vs "${org.name}" — Match: ${isMatch ? 'YES' : 'NO'}`);
  } else {
    console.log(`[enrichCompany] Validation: Skipped (already validated during domain resolution)`);
  }
  
  if (!isMatch) {
    console.log(`[enrichCompany] ✗ MISMATCH: Apollo returned "${org.name}" but we searched for "${job.company}"`);
    console.log(`[enrichCompany] ✗ Final status for "${job.company}": NOT_FOUND (name mismatch)`);
    return {
      scraped_job_title: job.title,
      scraped_job_url: job.url,
      company_name: job.company,
      location: job.location,
      domain: domainResult.domain,
      enrichment_status: 'not_found',
      error: `Apollo returned data for "${org.name}" instead of "${job.company}"`,
    };
  }

  console.log(`[enrichCompany] ✓✓✓ Match validated: "${job.company}" → "${org.name}"`);
  console.log(`[enrichCompany] ✓ Final status for "${job.company}": SUCCESS`);
  
  return {
    scraped_job_title: job.title,
    scraped_job_url: job.url,
    company_name: job.company,
    location: job.location,
    apollo_matched_name: org.name,
    domain: org.primary_domain || domainResult.domain,
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
