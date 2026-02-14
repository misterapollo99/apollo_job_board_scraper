require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const scrapeRoutes = require('./routes/scrape');
const enrichRoutes = require('./routes/enrich');
const exportRoutes = require('./routes/export');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory data store for the session
const store = {
  scrapedJobs: [],
  enrichedCompanies: [],
  apolloApiKey: process.env.APOLLO_API_KEY || '',
};

// Make store available to routes
app.use((req, res, next) => {
  req.store = store;
  next();
});

// API routes
app.use('/api/scrape', scrapeRoutes);
app.use('/api/enrich', enrichRoutes);
app.use('/api/export', exportRoutes);

// API key management
app.get('/api/config', (req, res) => {
  res.json({
    hasApiKey: !!req.store.apolloApiKey && req.store.apolloApiKey !== 'your_apollo_api_key_here',
  });
});

app.post('/api/config/api-key', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || !apiKey.trim()) {
    return res.status(400).json({ error: 'API key is required' });
  }
  req.store.apolloApiKey = apiKey.trim();
  res.json({ success: true, hasApiKey: true });
});

app.post('/api/config/test-key', async (req, res) => {
  const key = req.store.apolloApiKey;
  if (!key || key === 'your_apollo_api_key_here') {
    return res.status(400).json({ error: 'No API key configured' });
  }

  try {
    const axios = require('axios');
    const response = await axios.get('https://api.apollo.io/api/v1/auth/health', {
      headers: {
        'x-api-key': key,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      timeout: 10000,
    });
    res.json({ success: true, message: 'API key is valid' });
  } catch (err) {
    if (err.response && err.response.status === 401) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    // Some Apollo endpoints return 200 even for valid keys on different routes
    // Try an org search as a test
    try {
      const axios = require('axios');
      const response = await axios.post(
        'https://api.apollo.io/api/v1/organizations/search',
        { organization_name: 'Apollo', page: 1, per_page: 1 },
        {
          headers: {
            'x-api-key': key,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
          timeout: 10000,
        }
      );
      res.json({ success: true, message: 'API key is valid' });
    } catch (err2) {
      if (err2.response && err2.response.status === 401) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      res.json({ success: true, message: 'API key accepted (could not fully verify)' });
    }
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Apollo API Key: ${store.apolloApiKey && store.apolloApiKey !== 'your_apollo_api_key_here' ? 'Configured' : 'Not set'}`);
});
