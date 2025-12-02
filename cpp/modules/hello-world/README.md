# Hello World - First C++ Native Module

Your first step into C++ native modules for RangerPlex!

## What This Does

This module demonstrates:
- ✅ Basic N-API usage (Node.js Native API)
- ✅ String handling between JavaScript and C++
- ✅ Number operations in C++
- ✅ Error handling and validation
- ✅ CMake build system

## Quick Start

### 1. Install Dependencies
```bash
cd cpp/modules/hello-world
npm install
```

### 2. Build the Module
```bash
npm run build
```

This compiles `hello.cpp` into a `.node` binary that Node.js can load.

### 3. Run Tests
```bash
npm test
```

Expected output:
```
🧪 Testing C++ Hello World Module...

Test 1: sayHello()
   Result: Hello from C++!
   ✅ PASS

Test 2: greet("David")
   Result: Hello, David! Welcome to C++!
   ✅ PASS

Test 3: add(5, 10)
   Result: 15
   ✅ PASS

✅ All tests completed!
🎉 Your C++ module is working correctly!
```

## Usage in Your Code

```javascript
const hello = require('./cpp/modules/hello-world');

// Simple greeting
console.log(hello.sayHello());
// Output: "Hello from C++!"

// Personalized greeting
console.log(hello.greet("Alice"));
// Output: "Hello, Alice! Welcome to C++!"

// Math operations
console.log(hello.add(42, 13));
// Output: 55
```

## File Structure

```
hello-world/
├── hello.cpp          # C++ source code
├── CMakeLists.txt     # Build configuration
├── package.json       # npm configuration
├── index.js           # JavaScript wrapper
├── test.js            # Test suite
└── README.md          # This file
```

## Learning Path

### Beginner Tasks:
1. ✅ Build and run the module
2. ⬜ Add a `multiply()` function
3. ⬜ Add a `toUpperCase()` string function
4. ⬜ Add a function that returns an array of numbers

### Intermediate Tasks:
5. ⬜ Create a function that returns a JavaScript object
6. ⬜ Add asynchronous function using `Napi::AsyncWorker`
7. ⬜ Add callback function support
8. ⬜ Implement error codes (not just messages)

### Advanced Tasks:
9. ⬜ Add performance benchmarks
10. ⬜ Integrate with RangerPlex API
11. ⬜ Create class-based API using `Napi::ObjectWrap`
12. ⬜ Add threading for background processing

## Class Connection

This project demonstrates C++ concepts from your class:

### Memory Management:
- **Stack allocation**: Local variables in functions
- **Heap allocation**: String objects created with `new`
- **RAII**: `Napi::String` handles memory automatically

### Data Types:
- `std::string` (C++ string class)
- `double` (floating-point numbers)
- Type conversion between JS and C++

### Functions:
- Function parameters: `const Napi::CallbackInfo& info`
- Return values: `Napi::String`, `Napi::Number`
- Error handling: Exceptions

## Troubleshooting

### "Module did not self-register"
```bash
npm run rebuild
```

### "Cannot find module './build/Release/hello_world.node'"
```bash
npm run build
```

### "node-gyp rebuild failed"
Make sure you have:
- Visual Studio Build Tools installed
- cmake-js installed: `npm install -g cmake-js`

## Next Steps

Once this works, try:
1. **Audio Analyzer Module** - Process audio data
2. **Database Cache Module** - Optimize SQLite queries
3. **Custom Logger Module** - High-performance logging

See `CPP_ROADMAP.md` for the full project plan!

## Resources

- [N-API Documentation](https://nodejs.org/api/n-api.html)
- [node-addon-api](https://github.com/nodejs/node-addon-api)
- [CMake Tutorial](https://cmake.org/cmake/help/latest/guide/tutorial/)

---

**Build Time:** ~10 seconds
**Difficulty:** Beginner
**C++ Standard:** C++17
