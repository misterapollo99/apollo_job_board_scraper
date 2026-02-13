# SimpleOnboard.io — Prospect Intelligence Engine

A full-stack web application that scrapes a Customer Success job board, enriches hiring companies via Apollo.io's API, scores them against an Ideal Customer Profile (ICP), and displays results in a polished dashboard.

## Quick Start

```bash
npm install
cd client && npm install && cd ..
npm run dev
```

This starts both the Express backend (port 3001) and Vite dev server (port 5173).

## Setup

1. Copy your Apollo.io API key into `.env`:
   ```
   APOLLO_API_KEY=your_key_here
   ```
   Or enter it via the API Settings button in the app UI.

2. Run the app:
   ```bash
   npm run dev
   ```

3. Open http://localhost:5173 in your browser.

## Application Flow

1. **Scrape** — Fetches live job listings from CustomerSuccessSnack job board
2. **Review** — Select which companies to enrich
3. **Enrich** — Look up each company via Apollo.io with real-time progress
4. **Results** — View enriched company cards with ICP scores, funding, tech stacks
5. **Export** — Download everything as a CSV file

## Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Node.js + Express
- **APIs:** Apollo.io REST API, web scraping via Cheerio

## Project Structure

```
├── server/
│   ├── index.js              # Express entry point
│   ├── routes/               # API endpoints (scrape, enrich, export)
│   ├── services/             # Business logic (scraper, apollo client, ICP scoring)
│   └── data/                 # Fallback job data
├── client/
│   ├── src/
│   │   ├── App.jsx           # Main app with wizard/stepper
│   │   └── components/       # All React UI components
│   ├── vite.config.js
│   └── tailwind.config.js
└── package.json
```
