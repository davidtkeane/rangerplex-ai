#!/bin/bash

# Grok/xAI API Test Script
# Quick test to verify your xAI API key works with RangerPlex

echo "🤖 Grok/xAI API Test Script"
echo "============================"
echo

read -s -p "Enter your xAI API key: " key
echo
echo

echo "Testing connection to api.x.ai..."
echo

response=$(curl -s -w "\nHTTP_CODE:%{http_code}" https://api.x.ai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $key" \
  -d '{
    "model": "grok-3",
    "messages": [{"role": "user", "content": "Say: API key works! Rangers lead the way!"}],
    "stream": false
  }')

# Extract HTTP code
http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_CODE:/d')

# Check for errors
if echo "$body" | grep -q -E '"error"|"code"'; then
  echo "❌ Error from Grok API (HTTP $http_code):"
  echo

  # Check for specific error types
  if echo "$body" | grep -q "doesn't have any credits"; then
    echo "🚨 NO CREDITS DETECTED!"
    echo
    echo "Your API key is VALID, but your xAI account needs credits."
    echo
    echo "📋 How to fix:"
    echo "  1. Go to: https://console.x.ai"
    echo "  2. Click your team name (top right)"
    echo "  3. Go to 'Billing' or 'Credits'"
    echo "  4. Add payment method and purchase credits"
    echo "  5. Start with \$5-\$10 for testing"
    echo
    echo "💡 xAI uses pay-as-you-go pricing (like OpenAI)"
    echo "   • Free tier: Very limited/none"
    echo "   • Paid: ~\$0.50-\$5 per 1M tokens (varies by model)"
    echo
    echo "🔗 Your team billing page:"
    team_url=$(echo "$body" | grep -o 'https://console.x.ai/team/[^"]*' | head -1)
    if [ -n "$team_url" ]; then
      echo "   $team_url"
    fi
  elif echo "$body" | grep -q -i "Incorrect API key"; then
    echo "🔑 Incorrect API Key"
    echo
    echo "Your API key is invalid or incomplete."
    echo
    echo "📋 How to fix:"
    echo "  1. Go to: https://console.x.ai (official xAI console)"
    echo "  2. Sign in with your X/Twitter account"
    echo "  3. Navigate to 'API Keys' section (left sidebar)"
    echo "  4. Click 'Create API Key' or 'New API Key'"
    echo "  5. Copy the ENTIRE key (starts with 'xai-', very long!)"
    echo "  6. Paste into RangerPlex Settings → Providers → Grok API Key"
    echo "  7. Click Save"
    echo
    echo "⚠️  Common mistakes:"
    echo "  • Copying only part of the key (keys are long!)"
    echo "  • Extra spaces before/after the key"
    echo "  • Using an expired key (keys expire after 90 days)"
    echo
    echo "💡 Keys are shown ONLY ONCE when created - copy carefully!"
  elif echo "$body" | grep -q "Invalid"; then
    echo "🔑 Invalid API Key"
    echo
    echo "📋 How to fix:"
    echo "  1. Go to: https://console.x.ai"
    echo "  2. Navigate to API Keys section"
    echo "  3. Create a new API key"
    echo "  4. Copy it immediately (shown only once!)"
    echo "  5. Add to RangerPlex Settings → Providers → Grok API Key"
  elif echo "$body" | grep -q -i "rate limit"; then
    echo "⏱️  Rate Limit Exceeded"
    echo
    echo "You've made too many requests. Wait a few minutes and try again."
    echo "Rate limits: Free tier ~60 RPM, Paid tier up to 10k RPM"
  else
    echo "Error details:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
  fi
  echo
  exit 1
elif echo "$body" | grep -q "choices"; then
  echo "✅ SUCCESS! Grok API is working!"
  echo
  echo "Response from Grok:"
  echo "$body" | jq -r '.choices[0].message.content' 2>/dev/null || echo "$body"
  echo
  echo "🎖️ You're ready to use Grok in RangerPlex!"
  echo
  echo "Next steps:"
  echo "  1. Open RangerPlex: http://localhost:5173"
  echo "  2. Go to Settings (⚙️) → Providers"
  echo "  3. Paste your API key in 'Grok API Key'"
  echo "  4. Select a Grok model (grok-3 recommended!)"
  echo "  5. Start chatting!"
else
  echo "⚠️  Unexpected response:"
  echo "$body"
  echo
  echo "This might be a network issue or API change."
fi

echo
