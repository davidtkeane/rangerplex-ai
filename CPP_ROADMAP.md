# RangerPlex C++ Companion Project Roadmap

**Version:** 1.0.0
**Created:** December 2025
**Purpose:** Plan for C++ companion utilities and potential future hardware implementations

---

## 🎯 Project Vision

Create C++ companion tools that extend RangerPlex functionality while providing hands-on learning opportunities for C++/Assembly programming concepts.

### Core Philosophy
- **Keep Node.js core intact** (proven, working, web-first)
- **Add C++ where it adds value** (performance, hardware access, embedded)
- **Learn by doing** (apply class concepts to real project)
- **Modular approach** (each component standalone)

---

## 📚 Learning Objectives from C++ Class

### Assembly/Low-Level Concepts to Apply:
- Memory management (stack vs heap)
- Pointer arithmetic and manipulation
- CPU register usage and optimization
- System calls and hardware interrupts
- Binary data manipulation
- Direct memory access (DMA)

### C++ Concepts to Apply:
- Object-oriented design
- Template metaprogramming
- Smart pointers (unique_ptr, shared_ptr)
- RAII (Resource Acquisition Is Initialization)
- Move semantics and copy elision
- Concurrency (threads, mutexes, atomics)

---

## 🗺️ Three-Phase Implementation Plan

## Phase 1: C++ Native Modules (Beginner)
**Timeline:** 1-2 months
**Goal:** Enhance existing Node.js app with C++ performance

### Project 1.1: Audio Analyzer Module
**What:** Real-time audio analysis using C++
**Why:** Audio processing is CPU-intensive, perfect for C++

```cpp
// File: modules/audio-analyzer/audio_analyzer.hpp
#pragma once
#include <napi.h>
#include <vector>

class AudioAnalyzer : public Napi::ObjectWrap<AudioAnalyzer> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    AudioAnalyzer(const Napi::CallbackInfo& info);

private:
    Napi::Value AnalyzeFrequency(const Napi::CallbackInfo& info);
    Napi::Value DetectSilence(const Napi::CallbackInfo& info);
    Napi::Value GetSpectrum(const Napi::CallbackInfo& info);

    std::vector<float> fft_buffer;
};
```

**Integration:**
```javascript
// In proxy_server.js
const AudioAnalyzer = require('./build/Release/audio_analyzer.node');
const analyzer = new AudioAnalyzer();

app.post('/api/audio/analyze', (req, res) => {
    const audioData = req.body.samples;
    const spectrum = analyzer.getSpectrum(audioData);
    res.json({ spectrum });
});
```

**Learning Focus:**
- N-API (Node.js Native API)
- FFT algorithms
- Binary data manipulation
- Memory-efficient buffer handling

---

### Project 1.2: Database Query Optimizer
**What:** High-performance SQLite query caching in C++
**Why:** Learn memory management and data structures

```cpp
// File: modules/db-cache/query_cache.hpp
#pragma once
#include <unordered_map>
#include <memory>
#include <sqlite3.h>

class QueryCache {
public:
    struct CacheEntry {
        std::string query_hash;
        std::vector<uint8_t> result_data;
        uint64_t timestamp;
        size_t access_count;
    };

    void put(const std::string& query, const std::vector<uint8_t>& result);
    std::optional<std::vector<uint8_t>> get(const std::string& query);
    void evict_lru();
    size_t memory_usage() const;

private:
    std::unordered_map<std::string, std::unique_ptr<CacheEntry>> cache_;
    size_t max_memory_ = 100 * 1024 * 1024; // 100MB
};
```

**Learning Focus:**
- Smart pointers
- Hash maps and cache algorithms
- LRU (Least Recently Used) eviction
- Memory profiling

---

## Phase 2: Standalone C++ Utilities (Intermediate)
**Timeline:** 2-4 months
**Goal:** Create companion CLI tools in pure C++

### Project 2.1: RangerPlex CLI Monitor
**What:** Command-line system monitor for RangerPlex instances
**Why:** Learn systems programming and IPC

```cpp
// File: tools/ranger-monitor/main.cpp
#include <iostream>
#include <chrono>
#include <curl/curl.h>
#include "rang.hpp" // Terminal colors

class RangerMonitor {
public:
    struct Stats {
        size_t websocket_connections;
        size_t db_size_mb;
        double cpu_percent;
        size_t memory_mb;
        uint64_t uptime_seconds;
    };

    void connect(const std::string& api_url);
    Stats fetch_stats();
    void display_dashboard();
    void watch_logs();

private:
    std::string api_url_;
    CURL* curl_;
};

int main(int argc, char* argv[]) {
    RangerMonitor monitor;
    monitor.connect("http://localhost:3000");

    while (true) {
        monitor.display_dashboard();
        std::this_thread::sleep_for(std::chrono::seconds(1));
    }
}
```

**Features:**
- Real-time stats dashboard
- Log file tailing
- Alert notifications
- Performance graphs (ASCII art)

**Learning Focus:**
- HTTP/REST client implementation
- Terminal manipulation (ANSI codes)
- Threading and async I/O
- JSON parsing in C++

**Build System:**
```cmake
# CMakeLists.txt
cmake_minimum_required(VERSION 3.15)
project(RangerMonitor)

set(CMAKE_CXX_STANDARD 20)

find_package(CURL REQUIRED)
find_package(nlohmann_json REQUIRED)

add_executable(ranger-monitor
    main.cpp
    monitor.cpp
    display.cpp
)

target_link_libraries(ranger-monitor
    CURL::libcurl
    nlohmann_json::nlohmann_json
)
```

---

### Project 2.2: Radio Stream Recorder
**What:** High-performance radio stream recorder/processor
**Why:** Learn multimedia programming and file I/O

```cpp
// File: tools/stream-recorder/recorder.hpp
#pragma once
#include <fstream>
#include <atomic>
#include <queue>
#include <mutex>

class StreamRecorder {
public:
    enum class Format { MP3, FLAC, WAV };

    void start_recording(const std::string& stream_url,
                        const std::string& output_path,
                        Format format);
    void stop_recording();
    void pause_recording();
    void resume_recording();

    struct RecordingStats {
        uint64_t bytes_recorded;
        std::chrono::seconds duration;
        bool is_recording;
        double buffer_fill_percent;
    };

    RecordingStats get_stats() const;

private:
    void download_thread();
    void encode_thread();
    void write_thread();

    std::atomic<bool> recording_{false};
    std::queue<std::vector<uint8_t>> buffer_queue_;
    std::mutex queue_mutex_;
    std::ofstream output_file_;
};
```

**Learning Focus:**
- Multi-threading and producer-consumer pattern
- Atomic operations and lock-free programming
- Network streaming protocols
- Audio codec integration (libmp3lame, FLAC)

---

## Phase 3: Embedded/IoT Version (Advanced)
**Timeline:** 4-6 months
**Goal:** RangerPlex Lite for Raspberry Pi / ESP32

### Project 3.1: RangerPlex Embedded
**What:** Minimal RangerPlex for IoT devices
**Hardware Target:** Raspberry Pi Zero W / ESP32

```cpp
// File: embedded/rangerplex-lite/main.cpp
#include <crow_all.h>
#include <sqlite3.h>
#include <memory>

class RangerPlexLite {
public:
    RangerPlexLite();
    void run();

private:
    void init_database();
    void init_api();
    void init_radio();

    crow::SimpleApp app_;
    std::unique_ptr<sqlite3, decltype(&sqlite3_close)> db_;

    // Minimal API endpoints
    void handle_health_check(crow::response& res);
    void handle_radio_stream(crow::response& res, const std::string& station_id);
    void handle_chat_message(crow::request& req, crow::response& res);
};

int main() {
    RangerPlexLite app;
    app.run(); // Runs on port 3000
    return 0;
}
```

**Key Features:**
- Minimal memory footprint (~20MB vs 200MB Node.js)
- Direct GPIO access for hardware buttons/LEDs
- Wi-Fi configuration portal
- OTA (Over-The-Air) updates
- Battery-powered operation

**Hardware Integration Example:**
```cpp
// GPIO control for physical buttons
#include <wiringPi.h>

class HardwareControls {
public:
    static constexpr int PIN_PLAY_PAUSE = 17;
    static constexpr int PIN_VOLUME_UP = 27;
    static constexpr int PIN_VOLUME_DOWN = 22;
    static constexpr int PIN_STATION_NEXT = 23;

    void init() {
        wiringPiSetupGpio();
        pinMode(PIN_PLAY_PAUSE, INPUT);
        pullUpDnControl(PIN_PLAY_PAUSE, PUD_UP);
        wiringPiISR(PIN_PLAY_PAUSE, INT_EDGE_FALLING, &handle_play_pause);
    }

private:
    static void handle_play_pause() {
        // Trigger radio play/pause
    }
};
```

**Learning Focus:**
- Embedded systems programming
- GPIO and hardware interrupts
- Cross-compilation (ARM)
- Resource-constrained optimization
- Real-time operating systems (FreeRTOS)

---

## 🏗️ Project Structure

```
rangerplex-ai/
├── cpp/                          # All C++ code
│   ├── modules/                  # Node.js native modules
│   │   ├── audio-analyzer/
│   │   │   ├── CMakeLists.txt
│   │   │   ├── binding.gyp
│   │   │   ├── audio_analyzer.cpp
│   │   │   └── audio_analyzer.hpp
│   │   └── db-cache/
│   │       ├── CMakeLists.txt
│   │       ├── binding.gyp
│   │       └── query_cache.cpp
│   │
│   ├── tools/                    # Standalone utilities
│   │   ├── ranger-monitor/
│   │   │   ├── CMakeLists.txt
│   │   │   ├── main.cpp
│   │   │   ├── monitor.cpp
│   │   │   └── display.cpp
│   │   └── stream-recorder/
│   │       ├── CMakeLists.txt
│   │       ├── main.cpp
│   │       └── recorder.cpp
│   │
│   ├── embedded/                 # IoT/Embedded versions
│   │   └── rangerplex-lite/
│   │       ├── CMakeLists.txt
│   │       ├── main.cpp
│   │       ├── api.cpp
│   │       ├── radio.cpp
│   │       └── hardware.cpp
│   │
│   └── common/                   # Shared C++ utilities
│       ├── logger.hpp
│       ├── json_utils.hpp
│       └── network.hpp
│
├── scripts/
│   ├── build-cpp-modules.sh      # Build all native modules
│   └── cross-compile-arm.sh      # For Raspberry Pi
│
└── docs/
    ├── CPP_ROADMAP.md           # This file
    ├── CPP_SETUP.md             # C++ development setup
    └── CPP_API.md               # C++ API documentation
```

---

## 🛠️ Development Environment Setup

### Required Tools:
```bash
# Windows (MSVC)
winget install Microsoft.VisualStudio.2022.BuildTools
winget install Kitware.CMake
winget install LLVM.LLVM

# macOS
brew install cmake
brew install llvm
xcode-select --install

# Linux
sudo apt install build-essential cmake
sudo apt install libcurl4-openssl-dev
```

### C++ Dependencies:
```bash
# vcpkg (C++ package manager)
git clone https://github.com/Microsoft/vcpkg.git
cd vcpkg
./bootstrap-vcpkg.sh

# Install libraries
./vcpkg install curl
./vcpkg install nlohmann-json
./vcpkg install sqlite3
./vcpkg install boost-beast
./vcpkg install crow
```

### Node.js Native Module Setup:
```bash
npm install -g node-gyp
npm install -g cmake-js

# In module directory
npm install node-addon-api
cmake-js configure
cmake-js build
```

---

## 📊 Performance Targets

### Audio Analyzer Module:
- FFT analysis: < 5ms for 1024 samples
- Memory usage: < 10MB
- CPU usage: < 15% on single core

### CLI Monitor:
- Dashboard refresh: < 100ms
- Memory footprint: < 5MB
- Network latency: < 50ms

### Embedded Version:
- Boot time: < 3 seconds
- Memory usage: < 30MB total
- Power consumption: < 500mA @ 5V
- API response time: < 20ms

---

## 🧪 Testing Strategy

### Unit Tests (Google Test):
```cpp
// tests/audio_analyzer_test.cpp
#include <gtest/gtest.h>
#include "audio_analyzer.hpp"

TEST(AudioAnalyzerTest, DetectsSilence) {
    AudioAnalyzer analyzer;
    std::vector<float> silent_samples(1024, 0.0f);
    EXPECT_TRUE(analyzer.detect_silence(silent_samples));
}

TEST(AudioAnalyzerTest, CalculatesFFT) {
    AudioAnalyzer analyzer;
    std::vector<float> sine_wave = generate_sine_440hz(1024);
    auto spectrum = analyzer.get_spectrum(sine_wave);
    EXPECT_GT(spectrum[440], 0.8); // Peak at 440 Hz
}
```

### Integration Tests:
```bash
# Test Node.js module loading
npm test -- --grep "C++ module integration"

# Test standalone tools
./build/ranger-monitor --test-mode
./build/stream-recorder --test-stream http://test.com/stream
```

### Benchmarks:
```cpp
// benchmarks/audio_bench.cpp
#include <benchmark/benchmark.h>
#include "audio_analyzer.hpp"

static void BM_FFTAnalysis(benchmark::State& state) {
    AudioAnalyzer analyzer;
    std::vector<float> samples(state.range(0));

    for (auto _ : state) {
        analyzer.get_spectrum(samples);
    }
    state.SetComplexityN(state.range(0));
}
BENCHMARK(BM_FFTAnalysis)->Range(512, 8192)->Complexity();
```

---

## 📖 Learning Resources

### Books:
- **"C++ Primer" (5th Edition)** - Stanley Lippman
- **"Effective Modern C++" (2014)** - Scott Meyers
- **"The Art of Multiprocessor Programming"** - Herlihy & Shavit

### Online:
- **CppCon YouTube Channel** - Conference talks
- **CPP Reference** - https://en.cppreference.com
- **Compiler Explorer** - https://godbolt.org (see assembly output)

### Class Connection:
- Apply assembly concepts by examining compiler output
- Use `-S` flag to generate assembly: `g++ -S -O2 main.cpp`
- Profile with `perf` (Linux) or Instruments (macOS)

---

## 🚀 Quick Start Commands

### Build Native Module:
```bash
cd cpp/modules/audio-analyzer
npm install
npm run build
npm test
```

### Build Standalone Tool:
```bash
cd cpp/tools/ranger-monitor
mkdir build && cd build
cmake ..
make -j$(nproc)
./ranger-monitor http://localhost:3000
```

### Run Tests:
```bash
cd cpp
mkdir build && cd build
cmake .. -DBUILD_TESTS=ON
make -j$(nproc)
ctest --output-on-failure
```

---

## 🎓 Class Project Ideas (Graded Work)

### Beginner (Week 2-4):
**"CPU Usage Monitor"** - Simple C++ CLI tool that reads RangerPlex stats
- File I/O, JSON parsing, loops
- ~200 lines of code

### Intermediate (Week 6-8):
**"Audio Buffer Optimizer"** - Implement circular buffer for audio streams
- Pointers, dynamic memory, data structures
- ~500 lines of code

### Advanced (Week 10-12):
**"Multi-threaded Stream Recorder"** - Record multiple radio streams simultaneously
- Threading, mutexes, producer-consumer pattern
- ~1000 lines of code

---

## 📅 Milestones

### Month 1-2: Foundation
- [ ] Set up C++ build environment
- [ ] Create first native module (hello world)
- [ ] Integrate with Node.js successfully
- [ ] Write basic unit tests

### Month 3-4: Performance Tools
- [ ] Complete audio analyzer module
- [ ] Build CLI monitor tool
- [ ] Benchmark performance improvements
- [ ] Document APIs

### Month 5-6: Hardware Integration
- [ ] Set up Raspberry Pi cross-compilation
- [ ] Port core features to embedded version
- [ ] Test on actual hardware
- [ ] Create hardware schematics

---

## 💡 Future Expansion Ideas

### Advanced Projects:
1. **WebAssembly Module** - Run audio analysis in browser
2. **GPU Acceleration** - Use CUDA/OpenCL for FFT
3. **Custom Audio Codec** - Implement low-latency streaming codec
4. **Neural Network Integration** - Music genre classification
5. **Distributed Processing** - Cluster of Raspberry Pi recorders

### Hardware Projects:
1. **Custom PCB** - RangerPlex Radio hardware device
2. **E-Ink Display** - Low-power station/metadata display
3. **Rotary Encoder** - Physical volume/tuning control
4. **LoRa Integration** - Long-range remote control

---

## 📝 Notes from C++ Class

### Key Concepts to Remember:
- **Stack vs Heap**: Local variables (stack), `new`/`malloc` (heap)
- **RAII**: Constructor allocates, destructor frees automatically
- **Move Semantics**: Transfer ownership, avoid copies
- **Templates**: Code generation at compile-time
- **Undefined Behavior**: Dereferencing nullptr, buffer overrun

### Common Pitfalls:
- Forgetting to free memory (use smart pointers!)
- Race conditions in multi-threaded code
- Dangling pointers after delete
- Integer overflow/underflow
- Endianness issues on embedded systems

---

## 🤝 Contributing Guidelines

When adding C++ code to RangerPlex:
1. Follow C++17 or newer standard
2. Use modern C++ idioms (smart pointers, auto, range-for)
3. Include comprehensive unit tests (>80% coverage)
4. Document all public APIs with Doxygen comments
5. Run clang-tidy and address warnings
6. Profile performance before/after changes

---

## 📬 Questions & Support

- **C++ Build Issues**: Check `docs/CPP_SETUP.md`
- **Architecture Questions**: Review this roadmap
- **Learning Resources**: See "Learning Resources" section above

**Remember**: Start small, iterate often, profile before optimizing!

---

**Last Updated**: December 2025
**Next Review**: After completing Phase 1
