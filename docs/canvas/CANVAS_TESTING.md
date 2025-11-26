# 🧪 Canvas Board - Testing Checklist

**Comprehensive testing guide for Canvas Board feature**

---

## 📋 Table of Contents

1. [Pre-Testing Setup](#pre-testing-setup)
2. [Core Functionality Tests](#core-functionality-tests)
3. [Drawing Tools Tests](#drawing-tools-tests)
4. [UI/UX Tests](#uiux-tests)
5. [Storage Tests](#storage-tests)
6. [Theme Tests](#theme-tests)
7. [Accessibility Tests](#accessibility-tests)
8. [Performance Tests](#performance-tests)
9. [Browser Compatibility](#browser-compatibility)
10. [Mobile/Touch Tests](#mobiletouch-tests)
11. [Integration Tests](#integration-tests)
12. [Bug Report Template](#bug-report-template)

---

## 🔧 Pre-Testing Setup

### Environment Checklist

- [ ] Latest version of RangerPlex AI deployed
- [ ] All Canvas Board files in place (`/src/hooks/`, `/src/components/`, `/src/styles/`)
- [ ] Browser cache cleared
- [ ] Console open for error monitoring
- [ ] Network tab open (for performance monitoring)
- [ ] Test data prepared (if needed)

### Test Browsers

**Desktop**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Mobile**:
- [ ] Safari (iOS)
- [ ] Chrome (Android)
- [ ] Firefox (Android)

---

## ✅ Core Functionality Tests

### Test 1: Canvas Opens Successfully

**Steps**:
1. Navigate to RangerPlex AI
2. Click **🎨 Canvas** tab in navigation

**Expected**:
- [ ] Canvas opens in full-screen mode
- [ ] Toolbar visible at bottom
- [ ] Header visible at top
- [ ] Canvas area is blank (or shows saved drawing)
- [ ] No console errors

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 2: Easter Egg Trigger

**Steps**:
1. Open chat interface
2. Type "canvas" and send

**Expected**:
- [ ] Canvas opens as overlay
- [ ] Backdrop blur visible
- [ ] Close button (❌) works
- [ ] Clicking outside closes canvas (if overlay)

**Alternative triggers to test**:
- [ ] "draw"
- [ ] "whiteboard"
- [ ] "sketch"

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 3: Canvas Closes Properly

**Steps**:
1. Open canvas
2. Click **❌** close button

**Expected**:
- [ ] Canvas closes
- [ ] Returns to previous view
- [ ] No console errors

**Alternative close methods**:
- [ ] Press `Esc` key
- [ ] Click outside canvas (if overlay)

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

## ✏️ Drawing Tools Tests

### Test 4: Pen Tool - Basic Drawing

**Steps**:
1. Open canvas
2. Select **✏️ Pen** tool (or press `P`)
3. Draw several strokes with mouse

**Expected**:
- [ ] Lines appear where you draw
- [ ] Lines are smooth (not jagged)
- [ ] Lines are solid (full opacity)
- [ ] Cursor shows crosshair
- [ ] Color matches selected color
- [ ] Width matches selected size

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 5: Pen Tool - Color Selection

**Steps**:
1. Select pen tool
2. Click **Black** color
3. Draw a stroke
4. Click **Red** color
5. Draw another stroke
6. Try all 8 preset colors

**Expected**:
- [ ] Each stroke uses the selected color
- [ ] Color button shows active state
- [ ] Colors are accurate (not washed out)

**Preset colors to test**:
- [ ] Black (#000000)
- [ ] Red (#ff0000)
- [ ] Blue (#0000ff)
- [ ] Green (#00ff00)
- [ ] Yellow (#ffff00)
- [ ] Purple (#ff00ff)
- [ ] Orange (#ff8800)
- [ ] White (#ffffff)

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 6: Pen Tool - Custom Color

**Steps**:
1. Select pen tool
2. Click **color picker** (color wheel icon)
3. Choose a custom color (e.g., bright pink)
4. Draw a stroke

**Expected**:
- [ ] Color picker opens
- [ ] Selected color applies to pen
- [ ] Stroke uses custom color
- [ ] Color picker closes after selection

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 7: Pen Tool - Size Adjustment

**Steps**:
1. Select pen tool
2. Set size to minimum (1px)
3. Draw a stroke
4. Set size to maximum (20px)
5. Draw another stroke
6. Try several sizes in between

**Expected**:
- [ ] Size slider works smoothly
- [ ] Size display shows current value (e.g., "3px")
- [ ] Thin stroke visible at 1px
- [ ] Thick stroke visible at 20px
- [ ] Size changes apply immediately

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 8: Eraser Tool - Basic Erasing

**Steps**:
1. Draw several strokes with pen
2. Select **🧹 Eraser** tool (or press `E`)
3. Drag over some strokes

**Expected**:
- [ ] Eraser removes strokes
- [ ] Erased areas are completely blank
- [ ] Cursor changes to indicate eraser mode
- [ ] Partial strokes can be erased
- [ ] Eraser size is adjustable (10-50px)

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 9: Highlighter Tool - Semi-Transparent

**Steps**:
1. Draw some strokes with pen
2. Select **🖍️ Highlighter** tool (or press `H`)
3. Choose yellow color
4. Draw over the pen strokes

**Expected**:
- [ ] Highlighter is semi-transparent (~30% opacity)
- [ ] Can see pen strokes through highlighter
- [ ] Highlighter appears UNDER pen strokes (like real highlighter)
- [ ] Multiple highlighter passes increase opacity
- [ ] Size is adjustable (15-30px recommended)

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 10: Tool Switching

**Steps**:
1. Select pen tool
2. Draw a stroke
3. Press `E` (eraser)
4. Erase part of stroke
5. Press `H` (highlighter)
6. Highlight something
7. Press `P` (pen)
8. Draw again

**Expected**:
- [ ] Tool switches immediately
- [ ] Active tool button shows highlighted state
- [ ] Keyboard shortcuts work
- [ ] Tool settings persist (color, size)
- [ ] No lag when switching

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

## 🎨 UI/UX Tests

### Test 11: Toolbar Layout

**Steps**:
1. Open canvas
2. Observe toolbar at bottom

**Expected**:
- [ ] All controls visible
- [ ] Controls grouped logically (Tools | Colors | Size | History | Actions)
- [ ] Labels are readable
- [ ] Icons are clear
- [ ] Spacing is comfortable
- [ ] No overlapping elements

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 12: Background Selection

**Steps**:
1. Open canvas
2. Click background dropdown in header
3. Select each background type

**Expected backgrounds**:
- [ ] **Blank** - Solid color, no pattern
- [ ] **Grid** - 20px grid lines
- [ ] **Lines** - Horizontal lines (30px spacing)
- [ ] **Dots** - Dot grid (20px spacing)
- [ ] **Graph** - Fine grid (10px spacing)

**For each background**:
- [ ] Pattern renders correctly
- [ ] Pattern is semi-transparent
- [ ] Drawing appears OVER background
- [ ] Background changes don't affect drawing

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 13: Responsive Design - Desktop

**Steps**:
1. Open canvas on desktop
2. Resize browser window (large → small)
3. Test at various widths

**Expected**:
- [ ] Canvas resizes appropriately
- [ ] Toolbar remains accessible
- [ ] No horizontal scrolling
- [ ] All buttons remain clickable
- [ ] Layout doesn't break

**Test widths**:
- [ ] 1920px (large desktop)
- [ ] 1366px (laptop)
- [ ] 1024px (small laptop)
- [ ] 768px (tablet breakpoint)

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 14: Responsive Design - Mobile

**Steps**:
1. Open canvas on mobile device (or use browser DevTools)
2. Test in portrait and landscape

**Expected**:
- [ ] Toolbar is compact but usable
- [ ] Buttons are touch-friendly (minimum 44x44px)
- [ ] Color buttons are visible
- [ ] Size slider works with touch
- [ ] No elements cut off
- [ ] Landscape mode provides more canvas space

**Test devices**:
- [ ] iPhone (375px width)
- [ ] Android phone (360px width)
- [ ] iPad (768px width)
- [ ] Small phone (320px width)

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

## ↩️ History Tests

### Test 15: Undo Functionality

**Steps**:
1. Draw 5 strokes
2. Click **↩️ Undo** button (or press `Ctrl+Z`)
3. Click undo 3 more times

**Expected**:
- [ ] Each undo removes last stroke
- [ ] Undo button grays out when no more history
- [ ] Can undo up to 50 steps
- [ ] Keyboard shortcut works (`Ctrl+Z` or `Cmd+Z`)
- [ ] No console errors

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 16: Redo Functionality

**Steps**:
1. Draw 5 strokes
2. Undo 3 times
3. Click **↪️ Redo** button (or press `Ctrl+Y`)
4. Click redo 2 more times

**Expected**:
- [ ] Each redo restores previously undone stroke
- [ ] Redo button grays out when no more redo history
- [ ] Keyboard shortcut works (`Ctrl+Y` or `Cmd+Y`)
- [ ] Drawing new stroke clears redo history (expected behavior)

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 17: History Limit (50 Steps)

**Steps**:
1. Draw 60 strokes (more than 50)
2. Try to undo all strokes

**Expected**:
- [ ] Can only undo last 50 strokes
- [ ] Oldest strokes (1-10) cannot be undone
- [ ] No memory issues
- [ ] No console errors
- [ ] Performance remains good

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

## 💾 Storage Tests

### Test 18: Auto-Save

**Steps**:
1. Open canvas
2. Draw something
3. Wait 30 seconds (auto-save interval)
4. Check console for save confirmation

**Expected**:
- [ ] Console shows "✅ Canvas auto-saved to localStorage"
- [ ] No errors
- [ ] Auto-save happens every 30 seconds
- [ ] Drawing is preserved

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 19: Load Saved Canvas

**Steps**:
1. Draw something on canvas
2. Wait for auto-save (or manually save)
3. Refresh the page
4. Open canvas again

**Expected**:
- [ ] Previous drawing loads automatically
- [ ] Console shows "✅ Canvas loaded from localStorage"
- [ ] Drawing is exactly as it was
- [ ] No distortion or quality loss

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 20: Save as PNG

**Steps**:
1. Draw something on canvas
2. Click **💾 PNG** button (or press `Ctrl+S`)

**Expected**:
- [ ] File downloads automatically
- [ ] Filename format: `rangerplex-canvas-[timestamp].png`
- [ ] Image matches canvas exactly
- [ ] Image quality is high
- [ ] Transparent background (if supported)
- [ ] Console shows "✅ Canvas saved as PNG"

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 21: Save as JPG

**Steps**:
1. Draw something on canvas
2. Click **💾 JPG** button

**Expected**:
- [ ] File downloads automatically
- [ ] Filename format: `rangerplex-canvas-[timestamp].jpg`
- [ ] Image matches canvas
- [ ] File size smaller than PNG
- [ ] Quality is good (90%)
- [ ] Console shows "✅ Canvas saved as JPG"

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 22: Storage Quota Error Handling

**Steps**:
1. Fill localStorage (draw large complex canvas, save many times)
2. Continue until quota exceeded

**Expected**:
- [ ] Alert appears: "Storage quota exceeded! Please clear old canvases..."
- [ ] Console shows "❌ Failed to save canvas: QuotaExceededError"
- [ ] App doesn't crash
- [ ] User can still draw (just can't auto-save)
- [ ] Manual save (PNG/JPG) still works

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 23: Clear Canvas

**Steps**:
1. Draw something on canvas
2. Click **🗑️ Clear** button
3. Confirm the action

**Expected**:
- [ ] Confirmation dialog appears
- [ ] Clicking "Yes" clears canvas completely
- [ ] Clicking "No" cancels action
- [ ] Cleared canvas shows background only
- [ ] Auto-save is cleared
- [ ] Undo history is cleared

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

## 🎨 Theme Tests

### Test 24: Dark Theme

**Steps**:
1. Set app theme to Dark
2. Open canvas

**Expected**:
- [ ] Canvas background: #2a2a2a
- [ ] Toolbar background: #1a1a1a
- [ ] Text color: #ffffff
- [ ] Borders: #404040
- [ ] Active buttons: #0ea5e9 (sky blue)
- [ ] Hover effects work
- [ ] All text is readable

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 25: Light Theme

**Steps**:
1. Set app theme to Light
2. Open canvas

**Expected**:
- [ ] Canvas background: #ffffff
- [ ] Toolbar background: #f5f5f5
- [ ] Text color: #000000
- [ ] Borders: #e5e5e5
- [ ] Active buttons: #0ea5e9 (sky blue)
- [ ] Hover effects work
- [ ] All text is readable

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 26: Tron Theme

**Steps**:
1. Set app theme to Tron
2. Open canvas

**Expected**:
- [ ] Canvas background: #0a0a0a
- [ ] Toolbar background: #000000
- [ ] Text color: #00f3ff (cyan)
- [ ] Borders: #00f3ff (cyan)
- [ ] Glow effects visible (`box-shadow: 0 0 20px rgba(0, 243, 255, 0.3)`)
- [ ] Active buttons glow brighter
- [ ] Hover effects show cyan glow
- [ ] Looks AWESOME! 🌟

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 27: Theme Switching

**Steps**:
1. Draw something on canvas
2. Switch from Dark to Light theme
3. Switch to Tron theme
4. Switch back to Dark

**Expected**:
- [ ] Theme changes apply immediately
- [ ] Drawing is preserved during theme switch
- [ ] No visual glitches
- [ ] All colors update correctly
- [ ] Background pattern updates (if applicable)

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

## ♿ Accessibility Tests

### Test 28: Keyboard Navigation

**Steps**:
1. Open canvas
2. Press `Tab` repeatedly
3. Navigate through all controls

**Expected**:
- [ ] Tab moves to next control
- [ ] Shift+Tab moves to previous control
- [ ] Focus indicator is clearly visible (2px blue outline)
- [ ] All buttons are reachable
- [ ] Enter/Space activates focused button
- [ ] Arrow keys adjust sliders

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 29: ARIA Labels

**Steps**:
1. Open canvas
2. Inspect toolbar buttons with browser DevTools
3. Check for ARIA attributes

**Expected**:
- [ ] All buttons have `aria-label` attributes
- [ ] Labels are descriptive (e.g., "Pen Tool", not just "Pen")
- [ ] Tooltips match ARIA labels
- [ ] Disabled buttons have `aria-disabled="true"`
- [ ] Active tool has `aria-pressed="true"` or similar

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 30: Screen Reader Compatibility

**Steps**:
1. Enable screen reader (NVDA, JAWS, VoiceOver)
2. Navigate canvas with keyboard
3. Listen to announcements

**Expected**:
- [ ] Tool names are announced
- [ ] Button states are announced (active/inactive)
- [ ] Color selections are announced
- [ ] Size changes are announced
- [ ] Undo/redo actions are announced

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 31: High Contrast Mode

**Steps**:
1. Enable high contrast mode (Windows: Settings > Ease of Access)
2. Open canvas

**Expected**:
- [ ] All borders are thicker (2px instead of 1px)
- [ ] Text remains readable
- [ ] Buttons have clear outlines
- [ ] Focus indicators are visible
- [ ] No elements disappear

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 32: Reduced Motion

**Steps**:
1. Enable reduced motion (System Settings > Accessibility)
2. Open canvas
3. Interact with buttons

**Expected**:
- [ ] All transitions are disabled
- [ ] Hover effects still work (no animation)
- [ ] No motion sickness triggers
- [ ] Functionality unchanged

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

## ⚡ Performance Tests

### Test 33: Drawing Performance

**Steps**:
1. Open canvas
2. Draw continuously for 2 minutes
3. Monitor FPS and responsiveness

**Expected**:
- [ ] No lag or stuttering
- [ ] Lines appear immediately
- [ ] FPS stays above 30 (ideally 60)
- [ ] No memory leaks
- [ ] CPU usage reasonable (<50%)

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 34: Large Canvas Stress Test

**Steps**:
1. Draw 1000+ strokes
2. Test undo/redo
3. Test save/load
4. Monitor performance

**Expected**:
- [ ] Drawing still responsive
- [ ] Undo/redo still fast (<100ms)
- [ ] Save completes (<2 seconds)
- [ ] Load completes (<2 seconds)
- [ ] No browser freeze
- [ ] Memory usage acceptable (<500MB)

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 35: Memory Leak Test

**Steps**:
1. Open canvas
2. Draw, undo, redo, clear repeatedly for 10 minutes
3. Monitor memory usage in DevTools

**Expected**:
- [ ] Memory usage stabilizes
- [ ] No continuous memory growth
- [ ] Garbage collection works
- [ ] No console warnings

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

## 🌐 Browser Compatibility

### Test 36: Chrome

**Version**: _________

- [ ] All features work
- [ ] No console errors
- [ ] Performance good
- [ ] Touch works (if available)

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 37: Firefox

**Version**: _________

- [ ] All features work
- [ ] No console errors
- [ ] Performance good
- [ ] Touch works (if available)

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 38: Safari

**Version**: _________

- [ ] All features work
- [ ] No console errors
- [ ] Performance good
- [ ] Touch works (if available)
- [ ] localStorage works (not in Private mode)

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 39: Edge

**Version**: _________

- [ ] All features work
- [ ] No console errors
- [ ] Performance good
- [ ] Touch works (if available)

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

## 📱 Mobile/Touch Tests

### Test 40: Touch Drawing (Finger)

**Steps**:
1. Open canvas on touch device
2. Draw with finger

**Expected**:
- [ ] Lines appear where you touch
- [ ] Lines are smooth
- [ ] No accidental scrolling
- [ ] Touch-action: none prevents page scroll
- [ ] Responsive to touch

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 41: Touch Drawing (Stylus)

**Steps**:
1. Open canvas on iPad/tablet
2. Draw with Apple Pencil or stylus

**Expected**:
- [ ] Stylus input works
- [ ] Pressure sensitivity (if supported)
- [ ] Palm rejection works
- [ ] Precise drawing
- [ ] No lag

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 42: Mobile Toolbar

**Steps**:
1. Open canvas on mobile
2. Test all toolbar buttons

**Expected**:
- [ ] All buttons are touch-friendly (44x44px minimum)
- [ ] Buttons don't overlap
- [ ] Color picker works with touch
- [ ] Size slider works with touch
- [ ] No accidental clicks

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

## 🔗 Integration Tests

### Test 43: App Integration

**Steps**:
1. Navigate through app (Chat → Canvas → Settings → Canvas)
2. Test all navigation paths

**Expected**:
- [ ] Canvas tab appears in navigation
- [ ] Switching tabs works smoothly
- [ ] Canvas state persists when switching away and back
- [ ] No conflicts with other features
- [ ] Theme applies correctly

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 44: Easter Egg Integration

**Steps**:
1. Type "canvas" in chat
2. Canvas opens
3. Close canvas
4. Continue chatting

**Expected**:
- [ ] Canvas opens as overlay
- [ ] Chat remains in background
- [ ] Closing canvas returns to chat
- [ ] Chat history preserved
- [ ] No interference

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

### Test 45: Keyboard Shortcuts Don't Conflict

**Steps**:
1. Open canvas
2. Test all keyboard shortcuts
3. Check for conflicts with browser/app shortcuts

**Expected**:
- [ ] `Ctrl+S` saves canvas (not browser save)
- [ ] `Ctrl+Z` undos canvas (not browser undo)
- [ ] `Esc` closes canvas (not browser action)
- [ ] No unexpected browser behavior

**Status**: ⬜ Pass / ⬜ Fail / ⬜ Not Tested

---

## 🐛 Bug Report Template

**Use this template to report bugs found during testing:**

```markdown
### Bug Report #[NUMBER]

**Title**: [Short description]

**Severity**: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low

**Test**: [Test number and name]

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happened]

**Screenshots**:
[Attach if applicable]

**Console Errors**:
```
[Paste console errors here]
```

**Environment**:
- Browser: [Name and version]
- OS: [Operating system]
- Device: [Desktop/Mobile/Tablet]
- Screen size: [Width x Height]

**Additional Notes**:
[Any other relevant information]

**Status**: ⬜ Open / ⬜ In Progress / ⬜ Fixed / ⬜ Won't Fix
```

---

## 📊 Testing Summary

### Overall Progress

**Total Tests**: 45  
**Passed**: ___  
**Failed**: ___  
**Not Tested**: ___  

**Pass Rate**: ____%

---

### Critical Issues Found

1. [Issue description]
2. [Issue description]
3. [Issue description]

---

### Recommendations

**High Priority**:
- [Recommendation]

**Medium Priority**:
- [Recommendation]

**Low Priority**:
- [Recommendation]

---

## 🎖️ Testing Team

**Testers**:
- [Name] - [Role]
- [Name] - [Role]

**Date**: [Testing date]

**Sign-off**: ⬜ Approved / ⬜ Needs Work

---

**Rangers lead the way!** 🎖️

**Quality testing ensures quality product!** ✅
