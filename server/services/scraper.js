const axios = require('axios');
const cheerio = require('cheerio');
const FALLBACK_JOBS = require('../data/fallback');

const TARGET_URL = 'https://jobs.customersuccesssnack.com/';

const DEFAULT_CATEGORIES = [
  'onboarding specialist',
  'implementation specialist',
  'customer success manager',
  'solutions architect',
  'director of customer success',
  'head of customer success',
];

async function scrapeJobBoard(categories = DEFAULT_CATEGORIES) {
  try {
    console.log(`Scraping ${TARGET_URL}...`);

    const response = await axios.get(TARGET_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const jobs = [];

    // Try multiple selectors for Jobboardly-powered boards
    const selectors = [
      '.job-listing',
      '.job-item',
      '.job-card',
      '[data-job]',
      'li.job',
      '.jobs-list li',
      '.job-list li',
      'a[href*="/jobs/"]',
      '.listing',
      '.job',
      'article',
    ];

    let jobElements = $([]);

    // Try each selector until we find job listings
    for (const selector of selectors) {
      const found = $(selector);
      if (found.length > 0) {
        jobElements = found;
        console.log(`Found ${found.length} elements with selector: ${selector}`);
        break;
      }
    }

    // If no specific selectors work, try to find links that look like job postings
    if (jobElements.length === 0) {
      // Look for any list items or anchor tags that contain job-like content
      $('a').each((i, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().toLowerCase();
        if (
          href.includes('/job') ||
          href.includes('/position') ||
          href.includes('/career') ||
          text.includes('specialist') ||
          text.includes('manager') ||
          text.includes('architect') ||
          text.includes('success') ||
          text.includes('implementation') ||
          text.includes('onboarding')
        ) {
          jobElements = jobElements.add(el);
        }
      });
    }

    if (jobElements.length === 0) {
      // Broader approach: find all list items or divs that seem to be job cards
      $('li, div, article').each((i, el) => {
        const text = $(el).text().toLowerCase();
        const hasJobTitle = categories.some(cat => text.includes(cat.toLowerCase()));
        if (hasJobTitle && text.length > 30 && text.length < 1000) {
          jobElements = jobElements.add(el);
        }
      });
    }

    console.log(`Processing ${jobElements.length} potential job elements...`);

    jobElements.each((i, el) => {
      const $el = $(el);
      const text = $el.text().trim();

      // Extract job URL
      let url = '';
      if ($el.is('a')) {
        url = $el.attr('href') || '';
      } else {
        const link = $el.find('a').first();
        url = link.attr('href') || '';
      }
      if (url && !url.startsWith('http')) {
        url = new URL(url, TARGET_URL).href;
      }

      // Extract job title - look for headings or strong text
      let title = '';
      const titleEl = $el.find('h2, h3, h4, .job-title, .title, strong').first();
      if (titleEl.length) {
        title = titleEl.text().trim();
      } else if ($el.is('a')) {
        title = text.split('\n')[0].trim();
      }

      // Extract company name
      let company = '';
      const companyEl = $el.find('.company, .company-name, .employer, [class*="company"]').first();
      if (companyEl.length) {
        company = companyEl.text().trim();
      } else {
        // Try to find company name from text structure
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length >= 2) {
          // Often company is the second line or after the title
          company = lines[1] || '';
        }
      }

      // Extract location
      let location = '';
      const locationEl = $el.find('.location, .job-location, [class*="location"]').first();
      if (locationEl.length) {
        location = locationEl.text().trim();
      }

      // Extract job type
      let type = 'Full-time';
      const typeEl = $el.find('.job-type, .type, [class*="type"], .badge').first();
      if (typeEl.length) {
        type = typeEl.text().trim();
      }

      // Extract logo
      let logo = '';
      const imgEl = $el.find('img').first();
      if (imgEl.length) {
        logo = imgEl.attr('src') || '';
        if (logo && !logo.startsWith('http')) {
          logo = new URL(logo, TARGET_URL).href;
        }
      }

      if (title || company) {
        jobs.push({
          company: company || 'Unknown Company',
          title: title || 'Unknown Title',
          location: location || 'Remote',
          type: type || 'Full-time',
          url: url || TARGET_URL,
          logo: logo || '',
          domain: '',
        });
      }
    });

    // Filter by categories if any jobs were found
    const lowerCategories = categories.map(c => c.toLowerCase());
    let filteredJobs = jobs.filter(job => {
      const titleLower = job.title.toLowerCase();
      return lowerCategories.some(cat => titleLower.includes(cat) || cat.includes(titleLower));
    });

    // If filtering removes everything, keep all jobs
    if (filteredJobs.length === 0 && jobs.length > 0) {
      filteredJobs = jobs;
    }

    // Deduplicate by company name
    const seen = new Set();
    const deduped = filteredJobs.filter(job => {
      const key = job.company.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`Scraped ${deduped.length} unique jobs after dedup`);

    if (deduped.length === 0) {
      console.log('No jobs found from scraping, using fallback data');
      return { jobs: FALLBACK_JOBS, source: 'fallback' };
    }

    return { jobs: deduped, source: 'live' };
  } catch (err) {
    console.error('Scraping failed:', err.message);
    console.log('Using fallback data');
    return { jobs: FALLBACK_JOBS, source: 'fallback' };
  }
}

module.exports = { scrapeJobBoard, DEFAULT_CATEGORIES };
