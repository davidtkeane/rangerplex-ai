# Voice Call Debug - MSI Side

## Issue
One-way audio problem: MSI -> M3Pro works, but M3Pro -> MSI does NOT work.

## What We Need From MSI

### Step 1: Open Developer Console
1. In RangerChat Lite, press `Ctrl+Shift+I` to open DevTools
2. Go to the **Console** tab
3. Clear any old logs (right-click > Clear console)

### Step 2: Make a Test Call
1. Have M3Pro call MSI (or MSI call M3Pro)
2. Answer the call on both sides
3. Have **M3Pro press Push-to-Talk** and speak

### Step 3: Look for These Logs on MSI Console

**GOOD - Audio should play:**
```
[Voice] voiceData received - state: in_call from: DigitalArrow36 partner: DigitalArrow36 isMatch: true
[Voice] RECEIVING audio from DigitalArrow36 bytes: 10924 sampleRate: 48000
```

**BAD - Audio blocked (wrong state):**
```
[Voice] voiceData received - state: idle from: DigitalArrow36 partner: null isMatch: false
[Voice] Ignoring voiceData - not in call or wrong sender
```

**BAD - Audio blocked (wrong partner name):**
```
[Voice] voiceData received - state: in_call from: DigitalArrow36 partner: SomeOtherName isMatch: false
[Voice] Ignoring voiceData - not in call or wrong sender
```

### Step 4: Report Back

Please tell us:
1. **What logs appear on MSI when M3Pro presses Push-to-Talk?**
2. **What is the `state` value?** (should be `in_call`)
3. **What is the `from` value?** (M3Pro's username)
4. **What is the `partner` value?** (should match `from`)
5. **What is `isMatch`?** (should be `true`)

### Step 5: Also Check M3Pro Console

On M3Pro when pressing Push-to-Talk, should see:
```
[Voice] SENDING audio to <MSI_username> level: 45 bytes: 10924
```

If M3Pro shows "SENDING" but MSI doesn't show "voiceData received", the message isn't reaching MSI through the relay server.

## Possible Causes

| Symptom | Likely Cause |
|---------|--------------|
| `state: idle` | Call not properly connected on MSI |
| `partner: null` | MSI didn't register the call partner |
| `isMatch: false` | Username mismatch (case sensitivity fixed in latest) |
| No logs at all | WebSocket message not reaching MSI |
| `RECEIVING` shows but no sound | Audio playback issue (volume, AudioContext) |

## Quick Fixes to Try

1. **Restart both apps** - Kill and re-run `npm run dev`
2. **Make a fresh call** - Hang up and call again
3. **Try MSI calling M3Pro** - See if initiator/receiver matters
4. **Check mute button** - Make sure MSI isn't muted

## File Locations

- Main code: `src/App.tsx`
- Voice receiving: Line ~1352 (voiceData handler)
- Voice sending: Line ~914 (onaudioprocess)
- playAudio function: Line ~993

---
*Debug file created for MSI Claude to diagnose voice call issues*
