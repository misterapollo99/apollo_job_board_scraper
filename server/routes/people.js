const express = require('express');
const router = express.Router();
const { searchPeople, enrichPerson } = require('../services/apolloPeople');

/**
 * POST /api/people/search
 * Search for people at a specific company domain
 */
router.post('/search', async (req, res) => {
  const { domain } = req.body;

  console.log('[people/search] POST /api/people/search called for domain:', domain);

  if (!domain) {
    console.log('[people/search] Error: No domain provided');
    return res.status(400).json({ error: 'Domain is required' });
  }

  const apiKey = req.store.apolloApiKey;
  if (!apiKey || apiKey === 'your_apollo_api_key_here') {
    console.log('[people/search] Error: Apollo API key not configured');
    return res.status(400).json({ error: 'Apollo API key not configured. Please set it in API Settings.' });
  }

  try {
    const contacts = await searchPeople(domain, apiKey);
    
    console.log(`[people/search] ✓ Search successful: ${contacts.length} contacts found`);
    res.json({ contacts });
  } catch (err) {
    console.error('[people/search] Error:', err.message);
    
    if (err.message === 'RATE_LIMITED') {
      return res.status(429).json({ error: 'Apollo API rate limit exceeded. Please try again in a moment.' });
    }
    if (err.message === 'UNAUTHORIZED') {
      return res.status(401).json({ error: 'Invalid Apollo API key. Please check your API settings.' });
    }
    
    res.status(500).json({ error: 'Failed to search for people. Please try again.' });
  }
});

/**
 * POST /api/people/enrich
 * Enrich a single person to get email and/or phone
 */
router.post('/enrich', async (req, res) => {
  const { personId, revealEmail, revealPhone } = req.body;

  console.log('[people/enrich] POST /api/people/enrich called for person:', personId);

  if (!personId) {
    console.log('[people/enrich] Error: No personId provided');
    return res.status(400).json({ error: 'Person ID is required' });
  }

  if (!revealEmail && !revealPhone) {
    console.log('[people/enrich] Error: Must request at least one data type');
    return res.status(400).json({ error: 'Must request at least email or phone' });
  }

  const apiKey = req.store.apolloApiKey;
  if (!apiKey || apiKey === 'your_apollo_api_key_here') {
    console.log('[people/enrich] Error: Apollo API key not configured');
    return res.status(400).json({ error: 'Apollo API key not configured. Please set it in API Settings.' });
  }

  // Add delay to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 150));

  try {
    const result = await enrichPerson(personId, revealEmail, revealPhone, apiKey);
    
    console.log(`[people/enrich] ✓ Enrichment successful for person ${personId}`);
    res.json(result);
  } catch (err) {
    console.error('[people/enrich] Error:', err.message);
    
    if (err.message === 'RATE_LIMITED') {
      return res.status(429).json({ error: 'Apollo API rate limit exceeded. Please try again in a moment.' });
    }
    if (err.message === 'UNAUTHORIZED') {
      return res.status(401).json({ error: 'Invalid Apollo API key. Please check your API settings.' });
    }
    
    res.status(500).json({ error: 'Failed to enrich person. Please try again.' });
  }
});

/**
 * POST /api/people/export
 * Export contacts to CSV
 */
router.post('/export', async (req, res) => {
  const { contacts, company } = req.body;

  console.log('[people/export] POST /api/people/export called with', contacts?.length || 0, 'contacts');

  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    console.log('[people/export] Error: No contacts provided');
    return res.status(400).json({ error: 'No contacts provided' });
  }

  if (!company) {
    console.log('[people/export] Error: No company provided');
    return res.status(400).json({ error: 'Company information required' });
  }

  try {
    // Build CSV headers
    const headers = [
      'Company Name',
      'Company Domain',
      'Company ICP Score',
      'Company Industry',
      'Company Employees',
      'Contact Full Name',
      'Contact Title',
      'Contact Seniority Level',
      'Contact Email',
      'Contact Phone',
      'Contact LinkedIn URL',
      'Contact Department',
      'Persona Type',
      'Email Status',
      'Phone Status',
    ];

    // Build CSV rows
    const rows = contacts.map(contact => {
      const emailStatus = contact.emailStatus === 'retrieved' ? 'Retrieved' : 
                         contact.emailStatus === 'not_available' ? 'Not Available' : 'Not Retrieved';
      const phoneStatus = contact.phoneStatus === 'retrieved' ? 'Retrieved' : 
                         contact.phoneStatus === 'not_available' ? 'Not Available' : 'Not Retrieved';

      return [
        company.apollo_matched_name || company.company_name || '',
        company.domain || '',
        company.icp_score || '',
        company.industry || '',
        company.estimated_num_employees || '',
        contact.name || '',
        contact.title || '',
        contact.seniority || '',
        contact.emailValue || '',
        contact.phoneValue || '',
        contact.linkedin_url || '',
        (contact.departments || []).join('; '),
        contact.personaType || '',
        emailStatus,
        phoneStatus,
      ];
    });

    // Escape CSV fields
    const escapeField = (field) => {
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build CSV content
    const csvContent = [
      headers.map(escapeField).join(','),
      ...rows.map(row => row.map(escapeField).join(',')),
    ].join('\n');

    console.log(`[people/export] ✓ CSV generated with ${contacts.length} rows`);

    // Send CSV file
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${company.domain.replace(/\./g, '_')}_contacts_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error('[people/export] Error:', err.message);
    res.status(500).json({ error: 'Failed to export contacts. Please try again.' });
  }
});

module.exports = router;
