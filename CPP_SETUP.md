# C++ Development Setup for RangerPlex

**Platform:** Windows 11 (MSI Vector 16")
**Node.js Version:** 22.x LTS
**Target:** Native modules + Standalone tools

---

## 🔧 Installation Steps

### 1. Visual Studio Build Tools (Required for Native Modules)

```powershell
# Install Visual Studio Build Tools 2022
winget install Microsoft.VisualStudio.2022.BuildTools

# Or download manually:
# https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

# During installation, select:
# ✓ Desktop development with C++
# ✓ MSVC v143 - VS 2022 C++ x64/x86 build tools
# ✓ Windows 10/11 SDK
# ✓ CMake tools for Windows
```

### 2. CMake (Build System)

```powershell
# Via winget
winget install Kitware.CMake

# Verify installation
cmake --version  # Should show 3.27 or newer
```

### 3. vcpkg (C++ Package Manager)

```powershell
# Clone vcpkg
cd C:\
git clone https://github.com/Microsoft/vcpkg.git
cd vcpkg

# Bootstrap vcpkg
.\bootstrap-vcpkg.bat

# Add to PATH (PowerShell Admin)
$env:VCPKG_ROOT = "C:\vcpkg"
[System.Environment]::SetEnvironmentVariable('VCPKG_ROOT', 'C:\vcpkg', 'Machine')

# Integrate with Visual Studio
.\vcpkg integrate install
```

### 4. Node.js Build Tools

```powershell
# Install node-gyp globally
npm install -g node-gyp

# Install CMake.js (alternative to node-gyp)
npm install -g cmake-js

# Windows build tools (if not already installed)
npm install -g windows-build-tools
```

### 5. Essential C++ Libraries

```powershell
cd C:\vcpkg

# Core libraries
.\vcpkg install sqlite3:x64-windows
.\vcpkg install curl:x64-windows
.\vcpkg install nlohmann-json:x64-windows

# Web frameworks (for standalone tools)
.\vcpkg install crow:x64-windows
.\vcpkg install boost-beast:x64-windows

# Testing frameworks
.\vcpkg install gtest:x64-windows
.\vcpkg install benchmark:x64-windows

# Audio processing (optional, for advanced projects)
.\vcpkg install portaudio:x64-windows
.\vcpkg install libsndfile:x64-windows
```

---

## 🏗️ Create Your First Native Module

### Step 1: Create Module Structure

```powershell
cd C:\Users\david\rangerplex-ai
mkdir cpp\modules\hello-world
cd cpp\modules\hello-world
npm init -y
```

### Step 2: Install Dependencies

```powershell
npm install node-addon-api
npm install --save-dev cmake-js
```

### Step 3: Create C++ Source

Create `hello.cpp`:
```cpp
#include <napi.h>

Napi::String SayHello(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::String::New(env, "Hello from C++!");
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(
        Napi::String::New(env, "sayHello"),
        Napi::Function::New(env, SayHello)
    );
    return exports;
}

NODE_API_MODULE(hello, Init)
```

### Step 4: Create CMakeLists.txt

```cmake
cmake_minimum_required(VERSION 3.15)
project(hello)

set(CMAKE_CXX_STANDARD 17)

# Find Node.js
find_package(Node REQUIRED)

# Add the addon
add_library(hello SHARED hello.cpp ${CMAKE_JS_SRC})
set_target_properties(hello PROPERTIES PREFIX "" SUFFIX ".node")

# Link with Node-API
target_include_directories(hello PRIVATE
    ${CMAKE_JS_INC}
    "${CMAKE_SOURCE_DIR}/node_modules/node-addon-api"
)

target_link_libraries(hello ${CMAKE_JS_LIB})
```

### Step 5: Update package.json

```json
{
  "name": "hello-world",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "build": "cmake-js compile",
    "clean": "cmake-js clean",
    "rebuild": "cmake-js rebuild",
    "test": "node test.js"
  },
  "dependencies": {
    "node-addon-api": "^8.0.0"
  },
  "devDependencies": {
    "cmake-js": "^7.3.0"
  }
}
```

### Step 6: Create JavaScript Wrapper

Create `index.js`:
```javascript
const addon = require('./build/Release/hello.node');

module.exports = {
    sayHello: addon.sayHello
};
```

### Step 7: Create Test File

Create `test.js`:
```javascript
const hello = require('./index');

console.log('Testing C++ module...');
console.log(hello.sayHello()); // Should print: "Hello from C++!"
console.log('✅ Module loaded successfully!');
```

### Step 8: Build and Test

```powershell
npm run build
npm test
```

**Expected output:**
```
Testing C++ module...
Hello from C++!
✅ Module loaded successfully!
```

---

## 🔨 Standalone Tool Setup

### Step 1: Create Tool Structure

```powershell
cd C:\Users\david\rangerplex-ai
mkdir cpp\tools\simple-monitor
cd cpp\tools\simple-monitor
```

### Step 2: Create main.cpp

```cpp
#include <iostream>
#include <curl/curl.h>
#include <nlohmann/json.hpp>
#include <thread>
#include <chrono>

using json = nlohmann::json;

// Callback for CURL to store response
size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* s) {
    size_t newLength = size * nmemb;
    try {
        s->append((char*)contents, newLength);
    } catch(std::bad_alloc &e) {
        return 0;
    }
    return newLength;
}

// Fetch health check from RangerPlex API
json fetch_health(const std::string& api_url) {
    CURL* curl = curl_easy_init();
    std::string response;

    if(curl) {
        std::string url = api_url + "/api/health";
        curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);

        CURLcode res = curl_easy_perform(curl);
        curl_easy_cleanup(curl);

        if(res == CURLE_OK) {
            return json::parse(response);
        }
    }
    return json::object();
}

int main(int argc, char* argv[]) {
    std::string api_url = "http://localhost:3000";

    if(argc > 1) {
        api_url = argv[1];
    }

    std::cout << "RangerPlex Simple Monitor\n";
    std::cout << "Connecting to: " << api_url << "\n\n";

    while(true) {
        try {
            auto health = fetch_health(api_url);

            // Clear screen (Windows)
            system("cls");

            std::cout << "╔═══════════════════════════════════╗\n";
            std::cout << "║     RangerPlex Monitor (C++)     ║\n";
            std::cout << "╚═══════════════════════════════════╝\n\n";

            if(!health.empty()) {
                std::cout << "Status: ✅ ONLINE\n";
                std::cout << "Timestamp: " << health["timestamp"].get<std::string>() << "\n";

                if(health.contains("uptime")) {
                    std::cout << "Uptime: " << health["uptime"].get<int>() << "s\n";
                }
            } else {
                std::cout << "Status: ❌ OFFLINE\n";
            }

            std::cout << "\nPress Ctrl+C to exit...\n";

        } catch(const std::exception& e) {
            std::cerr << "Error: " << e.what() << "\n";
        }

        std::this_thread::sleep_for(std::chrono::seconds(2));
    }

    return 0;
}
```

### Step 3: Create CMakeLists.txt

```cmake
cmake_minimum_required(VERSION 3.15)
project(simple_monitor)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find packages via vcpkg
find_package(CURL REQUIRED)
find_package(nlohmann_json REQUIRED)

# Create executable
add_executable(simple-monitor main.cpp)

# Link libraries
target_link_libraries(simple-monitor
    PRIVATE
    CURL::libcurl
    nlohmann_json::nlohmann_json
)

# Windows-specific: Copy DLLs to build directory
if(WIN32)
    add_custom_command(TARGET simple-monitor POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different
        $<TARGET_FILE:CURL::libcurl>
        $<TARGET_FILE_DIR:simple-monitor>
    )
endif()
```

### Step 4: Build and Run

```powershell
# Configure build with vcpkg toolchain
mkdir build
cd build
cmake .. -DCMAKE_TOOLCHAIN_FILE=C:/vcpkg/scripts/buildsystems/vcpkg.cmake

# Build
cmake --build . --config Release

# Run
.\Release\simple-monitor.exe
# Or with custom URL:
.\Release\simple-monitor.exe http://localhost:3000
```

---

## 🧪 Testing Setup

### Install Google Test

```powershell
cd C:\vcpkg
.\vcpkg install gtest:x64-windows
```

### Example Test File

Create `tests/test_monitor.cpp`:
```cpp
#include <gtest/gtest.h>
#include <string>

// Simple test to verify setup
TEST(MonitorTest, BasicTest) {
    std::string api_url = "http://localhost:3000";
    EXPECT_EQ(api_url.length(), 21);
    EXPECT_TRUE(api_url.find("localhost") != std::string::npos);
}

int main(int argc, char **argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
```

### Add to CMakeLists.txt

```cmake
# Enable testing
enable_testing()

# Find GTest
find_package(GTest REQUIRED)

# Add test executable
add_executable(test_monitor tests/test_monitor.cpp)
target_link_libraries(test_monitor GTest::gtest GTest::gtest_main)

# Register with CTest
add_test(NAME MonitorTests COMMAND test_monitor)
```

### Run Tests

```powershell
cd build
cmake --build . --config Release
ctest -C Release --output-on-failure
```

---

## 🎓 IDE Setup Recommendations

### Option 1: Visual Studio 2022 Community (Best for Windows)

```powershell
# Install VS Community (free)
winget install Microsoft.VisualStudio.2022.Community

# Extensions to install:
# - C/C++ Extension Pack
# - CMake Tools
# - GitHub Copilot (optional)
```

**Open Project:**
1. File → Open → CMake...
2. Select CMakeLists.txt
3. Press F5 to build and debug

### Option 2: Visual Studio Code (Lightweight)

```powershell
# Install VS Code
winget install Microsoft.VisualStudioCode

# Install extensions (in VS Code):
# - C/C++ (ms-vscode.cpptools)
# - CMake Tools (ms-vscode.cmake-tools)
# - CMake (twxs.cmake)
```

**Configure VS Code:**
Create `.vscode/settings.json`:
```json
{
    "cmake.configureSettings": {
        "CMAKE_TOOLCHAIN_FILE": "C:/vcpkg/scripts/buildsystems/vcpkg.cmake"
    },
    "C_Cpp.default.configurationProvider": "ms-vscode.cmake-tools"
}
```

### Option 3: CLion (JetBrains - Student License)

If you have a .edu email, get free license:
https://www.jetbrains.com/community/education/

**Configure CLion:**
1. Settings → Build, Execution, Deployment → CMake
2. CMake options: `-DCMAKE_TOOLCHAIN_FILE=C:/vcpkg/scripts/buildsystems/vcpkg.cmake`

---

## 🐛 Troubleshooting

### Problem: "Cannot find vcpkg.cmake"
**Solution:**
```powershell
# Verify VCPKG_ROOT is set
echo $env:VCPKG_ROOT

# If not set, add to your PowerShell profile
notepad $PROFILE
# Add line: $env:VCPKG_ROOT = "C:\vcpkg"
```

### Problem: "node-gyp rebuild failed"
**Solution:**
```powershell
# Use cmake-js instead
npm install --save-dev cmake-js
# Update package.json build script to use cmake-js
```

### Problem: "LINK : fatal error LNK1181: cannot open input file"
**Solution:**
```powershell
# Ensure Visual Studio Build Tools are installed
# Open "Developer Command Prompt for VS 2022"
# Try building from there
```

### Problem: DLL not found when running .exe
**Solution:**
```powershell
# Copy DLLs to exe directory
# Or add vcpkg/installed/x64-windows/bin to PATH
$env:PATH += ";C:\vcpkg\installed\x64-windows\bin"
```

---

## 📋 Verification Checklist

Before starting C++ projects, verify:

- [ ] CMake version ≥ 3.15: `cmake --version`
- [ ] vcpkg installed: `vcpkg version`
- [ ] Visual Studio Build Tools: `cl.exe` available in Developer Command Prompt
- [ ] Node.js ≥ 22.x: `node -v`
- [ ] node-gyp or cmake-js: `cmake-js --version`
- [ ] Essential packages: `vcpkg list` shows sqlite3, curl, nlohmann-json
- [ ] Can build hello-world native module successfully
- [ ] Can build simple-monitor standalone tool successfully

---

## 🚀 Next Steps

Once setup is complete:

1. **Build the hello-world module** → Verify native module workflow
2. **Build the simple-monitor tool** → Verify standalone C++ builds
3. **Read CPP_ROADMAP.md** → Choose your first project
4. **Join the learning journey!** → Apply C++ class concepts to RangerPlex

---

## 📚 Quick Reference Commands

```powershell
# Build native module
cd cpp/modules/<module-name>
npm run build

# Build standalone tool
cd cpp/tools/<tool-name>
mkdir build && cd build
cmake .. -DCMAKE_TOOLCHAIN_FILE=C:/vcpkg/scripts/buildsystems/vcpkg.cmake
cmake --build . --config Release

# Run tests
ctest -C Release --output-on-failure

# Clean build
cmake --build . --target clean
# Or delete build directory
rm -r build
```

---

**Setup Time Estimate:** 1-2 hours (including downloads)
**Skill Level Required:** Beginner (if following C++ class)

Good luck with your C++ journey! 🚀
