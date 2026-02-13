const express = require('express');
const router = express.Router();
const { scrapeJobBoard } = require('../services/scraper');

router.get('/', async (req, res) => {
  try {
    const categories = req.query.categories
      ? req.query.categories.split(',').map(c => c.trim())
      : undefined;

    const result = await scrapeJobBoard(categories);

    // Store in memory
    req.store.scrapedJobs = result.jobs;

    res.json({
      success: true,
      source: result.source,
      count: result.jobs.length,
      jobs: result.jobs,
    });
  } catch (err) {
    console.error('Scrape endpoint error:', err);
    res.status(500).json({
      success: false,
      error: 'Scraping failed',
      message: err.message,
    });
  }
});

module.exports = router;
