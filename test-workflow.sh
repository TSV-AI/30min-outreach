#!/bin/bash

echo "🚀 VoiceAI Outreach Platform - Test Workflow"
echo "============================================="

# Test 1: Create a campaign
echo ""
echo "📝 Creating test campaign..."
CAMPAIGN_RESULT=$(curl -s -X POST http://localhost:3000/api/campaigns \
  -H 'Content-Type: application/json' \
  -d '{"name": "Dental Practice Outreach - Test"}')

echo "Campaign created: $CAMPAIGN_RESULT"

# Test 2: Import sample leads
echo ""
echo "👥 Importing sample leads..."
IMPORT_RESULT=$(curl -s -X POST http://localhost:3000/api/leads/import \
  -H 'Content-Type: application/json' \
  -d '{
    "records": [
      {
        "company": "Bright Dental",
        "email": "info@brightdental.com",
        "website": "https://brightdental.com",
        "phone": "(555) 123-4567",
        "address": "123 Main St, Dallas, TX",
        "source": "test-import"
      },
      {
        "company": "Perfect Smile Dentistry",
        "email": "contact@perfectsmile.com",
        "website": "https://perfectsmile.com",
        "phone": "(555) 987-6543",
        "address": "456 Oak Ave, Austin, TX",
        "source": "test-import"
      }
    ]
  }')

echo "Import result: $IMPORT_RESULT"

# Test 3: Check campaigns endpoint
echo ""
echo "📊 Checking campaigns..."
curl -s http://localhost:3000/api/campaigns | jq '.' 2>/dev/null || echo "No jq available, raw response above"

echo ""
echo "✅ Test workflow complete!"
echo "🌐 Visit http://localhost:3000 to see the dashboard"
echo "📁 Dashboard pages:"
echo "   - Campaigns: http://localhost:3000/campaigns"
echo "   - Leads: http://localhost:3000/leads"
echo "   - Enrollments: http://localhost:3000/enrollments"