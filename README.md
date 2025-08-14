# VoiceAI Outreach Platform

A complete cold outreach system for Voice AI services targeting dental practices and other professional services. Includes lead scraping, email campaigns, tracking, and a Next.js dashboard.

## Stack

- **Scraper**: Python + SerpAPI for lead generation
- **App**: Next.js 14 + App Router, TypeScript
- **Database**: PostgreSQL + Prisma
- **Queue**: BullMQ (Redis) for email scheduling
- **Mailer**: Nodemailer (SMTP)
- **UI**: Tailwind CSS + shadcn/ui components

## Features

- 🔍 Lead scraping from Google Maps (dental practices)
- 📧 Multi-step email sequences with templates
- 📊 Campaign management dashboard
- 📈 Email tracking (opens, unsubscribes)
- ⏰ Automated sequence scheduling
- 🎯 Lead enrollment and management

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- Python 3.8+
- SerpAPI key (for scraping)

### 1. Setup Services

```bash
# Start PostgreSQL and Redis
docker run -d --name pg -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16
docker run -d --name redis -p 6379:6379 redis:7
```

### 2. Setup App

```bash
cd app
cp .env.example .env.local
# Edit .env.local with your database and SMTP settings
npm install
npx prisma migrate dev --name init
npm run dev
```

### 3. Setup Scraper

```bash
cd scraper
pip install -r requirements.txt
# Run scraper
SERPAPI_KEY=your_key python scrape_practices.py --query "dentist" --location "Dallas, TX" --limit 50
```

### 4. Import Leads

Use the dashboard at `http://localhost:3000/leads` to import the generated JSONL file, or via API:

```bash
curl -X POST http://localhost:3000/api/leads/import \
  -H 'Content-Type: application/json' \
  -d '{"records": [{"company":"Bright Dental","email":"info@brightdental.com","source":"scraper","website":"https://brightdental.com"}]}'
```

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:dev@localhost:5432/postgres?schema=public"
REDIS_URL="redis://localhost:6379"
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
FROM_EMAIL="Ava at Three Sixty Vue <ava@yourdomain.com>"
BASE_URL="http://localhost:3000"
```

## Usage

1. **Create Campaign**: Go to `/campaigns` and create a new campaign (default dental templates included)
2. **Import Leads**: Use `/leads` to import scraped leads
3. **Enroll Leads**: Use `/enrollments` to enroll leads in campaigns
4. **Monitor**: Track opens, clicks, and unsubscribes

## API Endpoints

- `POST /api/leads/import` - Import leads from scraper
- `GET/POST /api/campaigns` - Manage campaigns
- `POST /api/enroll` - Enroll leads in campaigns
- `GET /api/track/open?tid=...` - Track email opens
- `GET /api/track/unsub?e=...` - Handle unsubscribes
- `POST /api/send/tick` - Manually trigger sequence processing

## Development

```bash
# App development
cd app
npm run dev

# Database operations
npx prisma studio
npx prisma migrate dev

# Type checking
npx tsc --noEmit
```

## Production Notes

- Use a warmed sending domain with proper DNS (SPF/DKIM/DMARC)
- Throttle sends (20-40/day per sender initially)
- Honor unsubscribes and bounces
- Respect website ToS when scraping
- Consider purchased data or official APIs for scale

## License

Private use only.