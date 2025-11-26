# Quick Grok API Check

**Hey Grok!** Can you verify if RangerPlex's Grok integration is correct?

---

## What We're Currently Using:

### Models:
- `grok-2-1212`
- `grok-2-vision-1212`
- `grok-beta`

### Endpoint:
```
https://api.x.ai/v1/chat/completions
```

### Request:
```json
POST /v1/chat/completions
Authorization: Bearer API_KEY

{
  "model": "grok-2-1212",
  "messages": [{"role": "user", "content": "Hello"}],
  "stream": true
}
```

---

## Questions:

1. ✅ Are these model IDs correct and current?
2. ✅ Are there any NEW models we're missing?
3. ✅ Is the endpoint URL correct?
4. ✅ What optional parameters does Grok support? (temperature, max_tokens, etc.)
5. ✅ How do we send images to `grok-2-vision-1212`?
6. ✅ Any deprecated models we should remove?

---

## Please Provide:

**Correct Model List:**
```
- model-id-1 (description)
- model-id-2 (description)
```

**Supported Parameters:**
```
- temperature: (range)
- max_tokens: (limit)
- other params...
```

**Vision Format (if applicable):**
```
How to structure messages with images
```

---

Thanks! 🎖️
