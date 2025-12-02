# RangerPlex C++ Project - Quick Start

**Status:** Ready for Development
**Your Setup:** Windows 11 (MSI Vector 16"), Node.js 22.x
**Class:** C++ and Assembly Language

---

## 📁 What's Been Created

```
rangerplex-ai/
├── cpp/                                    # All C++ code lives here
│   ├── modules/                           # Native modules (enhance Node.js)
│   │   └── hello-world/                   # ✅ YOUR FIRST PROJECT
│   │       ├── hello.cpp                  # C++ source
│   │       ├── CMakeLists.txt            # Build config
│   │       ├── package.json              # npm config
│   │       ├── index.js                  # JS wrapper
│   │       ├── test.js                   # Test suite
│   │       └── README.md                 # Instructions
│   ├── tools/                             # Standalone C++ programs
│   │   └── simple-monitor/               # ⬜ Coming soon
│   └── common/                            # Shared utilities
│
├── CPP_ROADMAP.md                         # 📋 Master plan (3 phases)
├── CPP_SETUP.md                           # 🔧 Environment setup guide
└── CPP_PROJECT.md                         # 📖 This file (quick reference)
```

---

## 🚀 Start Here: Hello World Module

### Step 1: Navigate to Project
```powershell
cd C:\Users\david\rangerplex-ai\cpp\modules\hello-world
```

### Step 2: Install Dependencies
```powershell
npm install
```

### Step 3: Build (Compile C++ to .node binary)
```powershell
npm run build
```

### Step 4: Test
```powershell
npm test
```

**Expected:** All tests pass with ✅

---

## 🎓 How This Connects to Your C++ Class

### Concepts You'll Apply:

| C++ Class Topic | RangerPlex Project Example |
|----------------|----------------------------|
| **Pointers & References** | `const Napi::CallbackInfo& info` parameter |
| **Memory Management** | Smart pointers, RAII with `Napi::String` |
| **Functions** | Exporting C++ functions to JavaScript |
| **Data Types** | Converting JS types ↔️ C++ types |
| **Strings** | `std::string` manipulation |
| **Error Handling** | Throwing/catching exceptions |
| **Assembly (Advanced)** | View generated assembly with `g++ -S` |

### View Assembly Output:
```powershell
# In cpp/modules/hello-world/
# After building, check the assembly:
g++ -S -O2 hello.cpp -o hello.s
notepad hello.s
```

This shows you the actual assembly instructions your C++ generates!

---

## 📚 The Three Documents

### 1. **CPP_ROADMAP.md** - The Big Picture
- 3-phase plan (Beginner → Intermediate → Advanced)
- Project ideas for each phase
- Learning objectives mapped to class concepts
- Milestones and timelines

**Start with:** Phase 1 → Project 1.1 (hello-world)

### 2. **CPP_SETUP.md** - Environment Setup
- Visual Studio Build Tools installation
- CMake and vcpkg setup
- IDE configuration (VS Code, Visual Studio, CLion)
- Troubleshooting common issues

**Use when:** Setting up C++ development tools

### 3. **CPP_PROJECT.md** - This File
- Quick reference for daily work
- File structure overview
- Common commands

**Use as:** Daily reference card

---

## 🛠️ Common Commands Cheat Sheet

### For Native Modules (cpp/modules/*)
```powershell
npm install              # Install dependencies
npm run build            # Compile C++ → .node
npm run clean            # Clean build files
npm run rebuild          # Clean + build
npm test                 # Run tests
```

### For Standalone Tools (cpp/tools/*)
```powershell
mkdir build && cd build
cmake .. -DCMAKE_TOOLCHAIN_FILE=C:/vcpkg/scripts/buildsystems/vcpkg.cmake
cmake --build . --config Release
.\Release\tool-name.exe
```

### Debugging
```powershell
# Build with debug symbols
cmake .. -DCMAKE_BUILD_TYPE=Debug
cmake --build . --config Debug

# Run in Visual Studio debugger
# Open .sln file in build directory, press F5
```

---

## 🎯 Your Learning Path

### Week 1-2: Foundation (Hello World)
- [ ] Set up C++ build environment (CPP_SETUP.md)
- [ ] Build hello-world module successfully
- [ ] Understand N-API basics
- [ ] Add 2-3 new functions to hello-world

### Week 3-4: First Real Project
- [ ] Choose Phase 1 project from CPP_ROADMAP.md
- [ ] Design the module API
- [ ] Implement core functionality
- [ ] Write comprehensive tests

### Week 5-8: Advanced Features
- [ ] Add async operations (threading)
- [ ] Integrate with RangerPlex API
- [ ] Performance benchmarking
- [ ] Create documentation

### Week 9-12: Standalone Tool or Embedded
- [ ] Build C++ CLI tool (simple-monitor)
- [ ] OR start embedded/IoT project
- [ ] Apply all class concepts
- [ ] Present as class project!

---

## 💡 Project Ideas for Class Assignments

### Beginner Level (Week 2-4)
**"System Stats Native Module"**
- Fetch CPU/memory usage using C++
- ~200 lines of code
- Concepts: File I/O, parsing, N-API basics

### Intermediate (Week 6-8)
**"Audio Buffer Manager"**
- Implement circular buffer for audio streaming
- ~500 lines of code
- Concepts: Pointers, dynamic memory, data structures

### Advanced (Week 10-12)
**"Multi-threaded Stream Recorder"**
- Record multiple radio streams simultaneously
- ~1000 lines of code
- Concepts: Threading, mutexes, producer-consumer

---

## 🐛 Troubleshooting

### "Module did not self-register"
```powershell
npm run rebuild
```

### "Cannot find cmake-js"
```powershell
npm install -g cmake-js
```

### Build errors with vcpkg
```powershell
# Verify vcpkg is set up
echo $env:VCPKG_ROOT
# Should show: C:\vcpkg
```

### DLL not found errors
```powershell
# Add vcpkg bin to PATH
$env:PATH += ";C:\vcpkg\installed\x64-windows\bin"
```

**More help:** See CPP_SETUP.md troubleshooting section

---

## 📊 Progress Tracking

Mark your progress:

### Phase 1: Native Modules
- [x] Environment setup complete
- [x] hello-world module created
- [ ] hello-world module built and tested
- [ ] Added 3 custom functions
- [ ] Integrated with RangerPlex

### Phase 2: Standalone Tools
- [ ] CLI monitor created
- [ ] Stream recorder implemented
- [ ] Performance benchmarked

### Phase 3: Embedded/IoT
- [ ] Raspberry Pi setup
- [ ] Cross-compilation working
- [ ] Hardware integration

---

## 🔗 Integration with RangerPlex

Once hello-world works, integrate it:

### In proxy_server.js:
```javascript
// At top of file
const helloModule = require('./cpp/modules/hello-world');

// Add API endpoint
app.get('/api/cpp/hello', (req, res) => {
    res.json({
        message: helloModule.sayHello(),
        version: '1.0.0',
        language: 'C++'
    });
});
```

### Test it:
```powershell
# Start RangerPlex
npm run browser

# In another terminal:
curl http://localhost:3000/api/cpp/hello
```

---

## 📞 Getting Help

### If Stuck on C++ Build Issues:
1. Check CPP_SETUP.md troubleshooting section
2. Verify Visual Studio Build Tools installed
3. Ensure cmake and vcpkg in PATH

### If Stuck on C++ Language Concepts:
1. Reference your class textbook
2. Check CPP_ROADMAP.md learning resources
3. Use cppreference.com for syntax

### If Stuck on Integration:
1. Check hello-world/README.md
2. Look at existing RangerPlex code patterns
3. Test module in isolation first (npm test)

---

## 🎉 Success Criteria

You'll know you're on track when:
- ✅ hello-world builds without errors
- ✅ All tests pass
- ✅ You understand each line of hello.cpp
- ✅ You can add new functions confidently
- ✅ Module loads in Node.js successfully

---

## 🚀 Next Steps

1. **Right now:** Build hello-world module
   ```powershell
   cd cpp/modules/hello-world
   npm install && npm run build && npm test
   ```

2. **This week:** Read CPP_ROADMAP.md Phase 1

3. **Next week:** Choose your first real project

4. **This month:** Integrate with RangerPlex API

5. **This semester:** Complete a Phase 2 or 3 project as class final!

---

## 📖 Quick Reference Links

| Document | Purpose | When to Read |
|----------|---------|--------------|
| CPP_ROADMAP.md | Master plan, all projects | Once at start, reference often |
| CPP_SETUP.md | Environment setup | Before first build |
| CPP_PROJECT.md | Daily reference (this file) | Keep open while coding |
| hello-world/README.md | First module guide | Before building hello-world |

---

**Remember:** Start small, iterate, and apply class concepts!

The best way to learn C++ is to build something real. RangerPlex is that "something real."

Good luck! 🚀

---

**Created:** December 2025
**For:** C++ & Assembly Language Class
**Platform:** Windows 11 + Node.js 22.x
