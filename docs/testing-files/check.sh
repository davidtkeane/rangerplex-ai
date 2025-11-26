#!/bin/bash

PROMPT="$1"
API_KEY="${PPLX_KEY:-YOUR_API_KEY}"
MODEL="sonar"

if [ -z "$PROMPT" ]; then
  echo "Usage: ./check.sh 'your prompt'"
  exit 1
fi

RESPONSE=$(curl -s --request POST \
  --url https://api.perplexity.ai/chat/completions \
  --header "Authorization: Bearer $API_KEY" \
  --header "Content-Type: application/json" \
  --data "{
    \"model\": \"$MODEL\",
    \"messages\": [{\"role\": \"user\", \"content\": \"$PROMPT\"}],
    \"stream\": false
  }"
)

echo "$RESPONSE" | jq -r '.choices[0].message.content'
