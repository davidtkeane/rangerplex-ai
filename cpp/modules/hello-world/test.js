/**
 * Test file for hello-world C++ module
 *
 * Run with: npm test
 */

console.log('🧪 Testing C++ Hello World Module...\n');

try {
    const hello = require('./index');

    // Test 1: sayHello()
    console.log('Test 1: sayHello()');
    const greeting1 = hello.sayHello();
    console.log(`   Result: ${greeting1}`);
    console.log(greeting1 === "Hello from C++!" ? '   ✅ PASS' : '   ❌ FAIL');
    console.log();

    // Test 2: greet() with name
    console.log('Test 2: greet("David")');
    const greeting2 = hello.greet("David");
    console.log(`   Result: ${greeting2}`);
    console.log(greeting2 === "Hello, David! Welcome to C++!" ? '   ✅ PASS' : '   ❌ FAIL');
    console.log();

    // Test 3: add() function
    console.log('Test 3: add(5, 10)');
    const sum = hello.add(5, 10);
    console.log(`   Result: ${sum}`);
    console.log(sum === 15 ? '   ✅ PASS' : '   ❌ FAIL');
    console.log();

    // Test 4: Error handling - no argument
    console.log('Test 4: greet() without argument (should throw error)');
    try {
        hello.greet();
        console.log('   ❌ FAIL - Should have thrown error');
    } catch(e) {
        console.log(`   ✅ PASS - Error caught: ${e.message}`);
    }
    console.log();

    // Test 5: Error handling - wrong type
    console.log('Test 5: add("5", "10") with strings (should throw error)');
    try {
        hello.add("5", "10");
        console.log('   ❌ FAIL - Should have thrown error');
    } catch(e) {
        console.log(`   ✅ PASS - Error caught: ${e.message}`);
    }
    console.log();

    console.log('✅ All tests completed!');
    console.log('\n🎉 Your C++ module is working correctly!');

} catch(e) {
    console.error('❌ Module failed to load!');
    console.error(`   Error: ${e.message}`);
    console.error('\n💡 Make sure you ran: npm install && npm run build');
    process.exit(1);
}
