# Message Cost Calculation

This app shows a per-message cost next to the model/latency/tokens footer. The value is derived from:

- Token usage returned by the provider (`inputTokens`, `outputTokens`) on each message.
- A static pricing map in `services/currencyService.ts` keyed by substrings of model IDs.
- The user’s preferred currency (Settings → General).

## Current Pricing Map (approximate)
- OpenAI: `gpt-4.1`, `gpt-4.1-mini`, `gpt-4o`, `gpt-4o-mini`, `o1`, `o1-mini`, `o3-mini`
- Anthropic: `claude-sonnet-4-5`, `claude-sonnet-4-*` (broad match), `claude-3-7-sonnet`, `claude-opus-4`, `claude-haiku-4`, `claude-3-5-sonnet`, `claude-3-5-haiku`, `claude-3-opus`
- Gemini: `gemini-3-pro`, `gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.0-flash`, `gemini-2.0-flash-thinking-exp-01-21`, `gemini-1.5-pro`, `gemini-1.5-flash`
- Perplexity: `sonar`, `sonar-pro`

Rates are approximate and meant for relative cost awareness, not billing accuracy.

## Why cost may be blank
- Provider didn’t return token usage for the call (no `inputTokens`/`outputTokens` in `message.stats`).
- Model name doesn’t match any pricing map key.

## Fallback estimation
If no usage is returned, the UI estimates tokens from the AI message text (~4 characters per token) and shows `~N tokens` with the corresponding cost. This is a rough estimate meant only for quick awareness.

## Updating prices
Edit `PRICING_MAP` in `services/currencyService.ts`. Values are per 1M tokens (input/output). If you add new model IDs, include a substring that appears in the model name so `calculateCost` can match it.
