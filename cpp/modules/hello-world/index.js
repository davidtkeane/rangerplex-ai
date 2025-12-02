/**
 * JavaScript wrapper for C++ hello-world module
 *
 * This file loads the compiled C++ native module and exports
 * its functions for use in Node.js applications.
 */

const addon = require('./build/Release/hello_world.node');

module.exports = {
    /**
     * Returns a simple greeting from C++
     * @returns {string} "Hello from C++!"
     */
    sayHello: addon.sayHello,

    /**
     * Returns a personalized greeting
     * @param {string} name - The name to greet
     * @returns {string} Personalized greeting
     */
    greet: addon.greet,

    /**
     * Adds two numbers using C++
     * @param {number} a - First number
     * @param {number} b - Second number
     * @returns {number} Sum of a and b
     */
    add: addon.add
};
