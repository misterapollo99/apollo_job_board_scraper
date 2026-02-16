const axios = require('axios');

const APOLLO_BASE_URL = 'https://api.apollo.io/api/v1';

// Persona title lists
const EXECUTIVE_TITLES = [
  'Founder',
  'Co-Founder',
  'CEO',
  'Chief Executive Officer',
  'President',
  'COO',
  'Chief Operating Officer',
  'CTO',
  'Chief Technology Officer',
  'CFO',
  'Chief Financial Officer',
];

const OPERATIONS_TITLES = [
  'VP Operations',
  'Director Operations',
  'Head of Operations',
  'SVP Operations',
  'VP Business Operations',
  'Director Business Operations',
  'VP Customer Success',
  'Vice President Customer Success',
  'Director Customer Success',
  'Head of Customer Success',
  'SVP Customer Success',
  'Chief Customer Officer',
  'VP Implementation',
  'Director Implementation',
  'Head of Implementation',
  'VP Professional Services',
  'Director Professional Services',
  'Head of Professional Services',
];

function getHeaders(apiKey) {
  return {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  };
}

/**
 * Search for people at a specific company by domain
 * Returns two persona searches: Executives and Operations Leaders
 */
async function searchPeople(domain, apiKey) {
  console.log(`[Apollo People Search] Searching for contacts at domain: "${domain}"`);
  
  const allContacts = [];
  
  try {
    // Search 1: Founders & Executives
    console.log('[Apollo People Search] Searching for Founders & Executives...');
    
    const executivesPayload = {
      q_organization_domains: domain,  // Try as string first
      person_titles: EXECUTIVE_TITLES,
      page: 1,
      per_page: 10,
    };
    
    console.log('[Apollo People Search] Request payload:', JSON.stringify(executivesPayload, null, 2));
    
    const executivesResponse = await axios.post(
      `${APOLLO_BASE_URL}/mixed_people/api_search`,
      executivesPayload,
      {
        headers: getHeaders(apiKey),
        timeout: 15000,
      }
    );

    console.log('[Apollo People Search] Response total_entries:', executivesResponse.data.total_entries);
    console.log('[Apollo People Search] Response people count:', (executivesResponse.data.people || []).length);
    
    // Log first person for debugging
    if (executivesResponse.data.people && executivesResponse.data.people.length > 0) {
      const firstPerson = executivesResponse.data.people[0];
      console.log('[Apollo People Search] Sample person data:', JSON.stringify({
        id: firstPerson.id,
        first_name: firstPerson.first_name,
        last_name_obfuscated: firstPerson.last_name_obfuscated,
        title: firstPerson.title,
        organization: firstPerson.organization,
      }, null, 2));
    }

    const executives = (executivesResponse.data.people || []).map(person => {
      // Construct full name from first_name and last_name_obfuscated
      const fullName = person.first_name && person.last_name_obfuscated 
        ? `${person.first_name} ${person.last_name_obfuscated}`
        : person.first_name || 'Unknown';
      
      return {
        ...person,
        name: fullName, // Add full name field
        persona_type: 'Founder/Executive',
      };
    });
    console.log(`[Apollo People Search] Found ${executives.length} executives`);
    allContacts.push(...executives);

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 150));

    // Search 2: Operations & Implementation Leaders
    console.log('[Apollo People Search] Searching for Operations Leaders...');
    
    const operationsPayload = {
      q_organization_domains: domain,  // Try as string first
      person_titles: OPERATIONS_TITLES,
      page: 1,
      per_page: 25,
    };
    
    console.log('[Apollo People Search] Request payload:', JSON.stringify(operationsPayload, null, 2));
    
    const operationsResponse = await axios.post(
      `${APOLLO_BASE_URL}/mixed_people/api_search`,
      operationsPayload,
      {
        headers: getHeaders(apiKey),
        timeout: 15000,
      }
    );

    console.log('[Apollo People Search] Response total_entries:', operationsResponse.data.total_entries);
    console.log('[Apollo People Search] Response people count:', (operationsResponse.data.people || []).length);

    const operations = (operationsResponse.data.people || []).map(person => {
      // Construct full name from first_name and last_name_obfuscated
      const fullName = person.first_name && person.last_name_obfuscated 
        ? `${person.first_name} ${person.last_name_obfuscated}`
        : person.first_name || 'Unknown';
      
      return {
        ...person,
        name: fullName, // Add full name field
        persona_type: 'Operations Leader',
      };
    });
    console.log(`[Apollo People Search] Found ${operations.length} operations leaders`);
    allContacts.push(...operations);

    // Log organization data for debugging
    console.log('[Apollo People Search] Sample organization data from API:');
    if (allContacts.length > 0) {
      const sample = allContacts[0];
      console.log('  Person:', sample.name);
      console.log('  Organization:', JSON.stringify(sample.organization, null, 2));
    }

    // Since we're using the correct API parameters (q_organization_domains),
    // the API now correctly filters by domain, so no client-side filtering needed
    console.log(`[Apollo People Search] ✓ Total contacts found: ${allContacts.length}`);
    return allContacts;
  } catch (err) {
    console.error(`[Apollo People Search] ERROR for domain "${domain}":`, err.message);
    
    if (err.response) {
      console.error('[Apollo People Search] Error Status:', err.response.status);
      console.error('[Apollo People Search] Error Response Data:', JSON.stringify(err.response.data, null, 2));
      
      if (err.response.status === 429) {
        throw new Error('RATE_LIMITED');
      }
      if (err.response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
    }
    
    throw err;
  }
}

/**
 * Enrich a single person to get email and/or phone
 * Only retrieves the data fields requested to save credits
 */
async function enrichPerson(personId, revealEmail, revealPhone, apiKey) {
  console.log(`[Apollo People Enrich] Enriching person ID: "${personId}" (email: ${revealEmail}, phone: ${revealPhone})`);
  
  try {
    const response = await axios.post(
      `${APOLLO_BASE_URL}/people/enrich`,
      {
        id: personId,
        reveal_personal_emails: revealEmail,
        reveal_phone_number: revealPhone,
      },
      {
        headers: getHeaders(apiKey),
        timeout: 15000,
      }
    );

    const person = response.data.person || null;
    
    if (!person) {
      console.log(`[Apollo People Enrich] ✗ No data returned for person ID "${personId}"`);
      return { email: null, phone: null };
    }

    const result = {
      email: revealEmail ? (person.email || null) : null,
      phone: revealPhone ? (person.phone_numbers?.[0]?.sanitized_number || null) : null,
    };

    console.log(`[Apollo People Enrich] ✓ Enriched person "${personId}": email=${result.email ? 'retrieved' : 'not available'}, phone=${result.phone ? 'retrieved' : 'not available'}`);
    return result;
  } catch (err) {
    console.error(`[Apollo People Enrich] ERROR for person "${personId}":`, err.message);
    
    if (err.response) {
      console.error('[Apollo People Enrich] Error Status:', err.response.status);
      console.error('[Apollo People Enrich] Error Response Data:', JSON.stringify(err.response.data, null, 2));
      
      if (err.response.status === 429) {
        throw new Error('RATE_LIMITED');
      }
      if (err.response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      if (err.response.status === 404) {
        console.log(`[Apollo People Enrich] ✗ 404: Person "${personId}" not found`);
        return { email: null, phone: null };
      }
    }
    
    throw err;
  }
}

module.exports = { searchPeople, enrichPerson };
