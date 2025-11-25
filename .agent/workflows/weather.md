---
description: How to use the /weather command
---

# Weather Command Workflow

The `/weather` command allows users to check real-time weather conditions and forecasts for any location directly within the chat interface.

## Usage

- **Auto-Location**: Type `/weather` to get the weather for your current IP-based location.
- **Specific Location**: Type `/weather <city>` (e.g., `/weather London`, `/weather New York`) to check a specific place.

## Features

- **Real-time Data**: Current temperature, feels like, wind, humidity, and visibility.
- **Forecast**: 3-day weather outlook with max/min temps and conditions.
- **Privacy**: Uses `wttr.in` which is a privacy-respecting, open-source weather service.
- **No API Key**: Completely free to use without configuration.

## Implementation Details

The command uses the `wttr.in` API with the JSON format (`?format=j1`).

```typescript
// Example API call
fetch('https://wttr.in/London?format=j1')
  .then(res => res.json())
  .then(data => {
    // Process weather data
  });
```
