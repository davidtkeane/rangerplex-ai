cmake_minimum_required(VERSION 3.15)
project(hello_world)

# Use C++17 standard (or C++20 if you want modern features)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find Node.js (required for N-API)
# cmake-js will provide CMAKE_JS_INC and CMAKE_JS_SRC
include_directories(${CMAKE_JS_INC})

# Add the native addon library
add_library(${PROJECT_NAME} SHARED
    hello.cpp
    ${CMAKE_JS_SRC}
)

# Set the output name to hello.node (Node.js convention)
set_target_properties(${PROJECT_NAME} PROPERTIES
    PREFIX ""
    SUFFIX ".node"
)

# Include node-addon-api headers
target_include_directories(${PROJECT_NAME} PRIVATE
    "${CMAKE_SOURCE_DIR}/node_modules/node-addon-api"
)

# Define NAPI_VERSION (for node-addon-api)
target_compile_definitions(${PROJECT_NAME} PRIVATE NAPI_VERSION=8)

# Link with Node.js
target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB})

# Platform-specific settings
if(MSVC)
    # Visual Studio specific flags
    target_compile_options(${PROJECT_NAME} PRIVATE /W4)
elseif(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    # GCC/Clang flags
    target_compile_options(${PROJECT_NAME} PRIVATE -Wall -Wextra -pedantic)
endif()
