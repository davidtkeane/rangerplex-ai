/**
 * RangerPlex Hello World - First C++ Native Module
 *
 * Learning objectives:
 * - N-API (Node.js Native API) basics
 * - C++ function export to JavaScript
 * - String manipulation in C++
 * - Build system integration
 */

#include <napi.h>
#include <string>

/**
 * Simple function that returns a greeting from C++
 *
 * JavaScript usage:
 *   const hello = require('./index');
 *   console.log(hello.sayHello()); // "Hello from C++!"
 */
Napi::String SayHello(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::String::New(env, "Hello from C++!");
}

/**
 * Function that takes a name parameter and returns personalized greeting
 *
 * JavaScript usage:
 *   hello.greet("David"); // "Hello, David! Welcome to C++!"
 */
Napi::String Greet(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    // Check if argument was passed
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return Napi::String::New(env, "");
    }

    // Get the name from JavaScript
    std::string name = info[0].As<Napi::String>().Utf8Value();

    // Create greeting
    std::string greeting = "Hello, " + name + "! Welcome to C++!";

    return Napi::String::New(env, greeting);
}

/**
 * Function demonstrating simple math operations
 * Takes two numbers and returns their sum
 *
 * JavaScript usage:
 *   hello.add(5, 10); // 15
 */
Napi::Number Add(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    // Validate arguments
    if (info.Length() < 2) {
        Napi::TypeError::New(env, "Two numbers expected").ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }

    if (!info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Arguments must be numbers").ThrowAsJavaScriptException();
        return Napi::Number::New(env, 0);
    }

    // Perform addition
    double num1 = info[0].As<Napi::Number>().DoubleValue();
    double num2 = info[1].As<Napi::Number>().DoubleValue();
    double sum = num1 + num2;

    return Napi::Number::New(env, sum);
}

/**
 * Module initialization - exports functions to JavaScript
 */
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // Export sayHello function
    exports.Set(
        Napi::String::New(env, "sayHello"),
        Napi::Function::New(env, SayHello)
    );

    // Export greet function
    exports.Set(
        Napi::String::New(env, "greet"),
        Napi::Function::New(env, Greet)
    );

    // Export add function
    exports.Set(
        Napi::String::New(env, "add"),
        Napi::Function::New(env, Add)
    );

    return exports;
}

// Register the module with Node.js
NODE_API_MODULE(hello, Init)
