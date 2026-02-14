const express = require('express');
const router = express.Router();
const { enrichCompany } = require('../services/apollo');
const { calculateICPScore } = require('../services/scoring');

router.post('/', async (req, res) => {
  const { companies } = req.body;

  console.log('[enrich] POST /api/enrich called with', companies?.length || 0, 'companies');

  if (!companies || !Array.isArray(companies) || companies.length === 0) {
    console.log('[enrich] Error: No companies provided');
    return res.status(400).json({ error: 'No companies provided' });
  }

  const apiKey = req.store.apolloApiKey;
  if (!apiKey || apiKey === 'your_apollo_api_key_here') {
    console.log('[enrich] Error: Apollo API key not configured');
    return res.status(400).json({ error: 'Apollo API key not configured. Please set it in API Settings.' });
  }

  // Set up SSE for real-time progress
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send initial keepalive to confirm connection
  res.write(':ok\n\n');

  const enrichedResults = [];

  for (let i = 0; i < companies.length; i++) {
    const job = companies[i];
    console.log(`[enrich] Processing company ${i + 1}/${companies.length}: ${job.company}`);

    // Send progress update
    res.write(
      `data: ${JSON.stringify({
        type: 'progress',
        current: i + 1,
        total: companies.length,
        company: job.company,
        status: 'enriching',
      })}\n\n`
    );

    try {
      const enrichedData = await enrichCompany(job, apiKey);

      // Calculate ICP score
      const icpResult = calculateICPScore(enrichedData);
      enrichedData.icp_score = icpResult.score;
      enrichedData.icp_breakdown = icpResult.breakdown;
      enrichedData.icp_raw_score = icpResult.rawScore;
      enrichedData.icp_max_score = icpResult.maxScore;

      enrichedResults.push(enrichedData);
      console.log(`[enrich] Company ${job.company}: ${enrichedData.enrichment_status}, ICP score: ${icpResult.score}`);

      res.write(
        `data: ${JSON.stringify({
          type: 'company_done',
          current: i + 1,
          total: companies.length,
          company: job.company,
          status: enrichedData.enrichment_status === 'success' ? 'complete' : 'failed',
          data: enrichedData,
        })}\n\n`
      );
    } catch (err) {
      console.error(`[enrich] Company ${job.company} failed:`, err.message);
      const failedEntry = {
        scraped_job_title: job.title,
        scraped_job_url: job.url,
        company_name: job.company,
        domain: job.domain || '',
        enrichment_status: 'failed',
        error: err.message,
        icp_score: 0,
        icp_breakdown: [],
      };
      enrichedResults.push(failedEntry);

      res.write(
        `data: ${JSON.stringify({
          type: 'company_done',
          current: i + 1,
          total: companies.length,
          company: job.company,
          status: 'failed',
          error: err.message,
          data: failedEntry,
        })}\n\n`
      );
    }
  }

  // Store enriched data
  req.store.enrichedCompanies = enrichedResults;

  console.log(`[enrich] All done. ${enrichedResults.filter(r => r.enrichment_status === 'success').length} succeeded, ${enrichedResults.filter(r => r.enrichment_status === 'failed').length} failed`);

  // Send completion event
  res.write(
    `data: ${JSON.stringify({
      type: 'complete',
      total: companies.length,
      successful: enrichedResults.filter(r => r.enrichment_status === 'success').length,
      failed: enrichedResults.filter(r => r.enrichment_status === 'failed').length,
      results: enrichedResults,
    })}\n\n`
  );

  res.end();
});

module.exports = router;
