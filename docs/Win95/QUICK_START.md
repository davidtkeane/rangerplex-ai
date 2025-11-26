# 🚀 Win95 Easter Egg - Quick Start Guide

## 🎖️ STEP-BY-STEP INSTALLATION

### Step 1: Install Dependencies (5 min)
```bash
cd gemini-95
npm install
```

### Step 2: Add API Key (1 min)
Edit `gemini-95/.env.local`:
```
GEMINI_API_KEY=your_actual_gemini_api_key
```

### Step 3: Test Standalone (5 min)
```bash
npm run dev
```
Visit: http://localhost:5173
- ✅ Login screen appears
- ✅ Desktop loads
- ✅ Apps work

### Step 4: Build for Production (2 min)
```bash
npm run build
```
This creates `gemini-95/dist/` folder

### Step 5: Copy to Public (1 min)
```bash
# From root directory
cp -r gemini-95/dist public/gemini-95
```

### Step 6: Integration Complete! 🎉
Now the Win95 Easter egg is ready to integrate into RangerPlex!

---

## 🎯 WHAT'S NEXT?

After installation, we'll create:
1. `Win95EasterEgg.tsx` component
2. Add trigger to ChatInterface
3. Add return icon to Win95 desktop
4. Test everything!

---

## 🔑 Secret Triggers

After integration:
- Type **"window 95"** or **"win95"** in chat
- Full Windows 95 simulator opens!
- Desktop icon "Return to RangerPlex" brings you back

---

## 📋 Checklist

- [ ] Dependencies installed
- [ ] API key added
- [ ] Tested standalone
- [ ] Built for production
- [ ] Copied to public folder
- [ ] Ready for component creation!

---

🎖️ Rangers lead the way! 🍀
