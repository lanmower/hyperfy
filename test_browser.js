async function test() {
  try {
    // Test 2: Check if server responds to HTTP request
    console.log('\n=== TEST 2: Browser Load ===');
    const response = await fetch('http://localhost:8080');
    const html = await response.text();
    
    if (html.includes('<!DOCTYPE html')) {
      console.log('✓ Server responds with HTML');
    } else {
      console.log('✗ Server response not HTML');
    }
    
    if (!html.includes('jolt-physics')) {
      console.log('✓ HTML does not contain jolt-physics reference');
    } else {
      console.log('✗ HTML contains jolt-physics (should not)');
    }
    
    // Test 3: Check client/app.js is served
    console.log('\n=== TEST 3: Client Entry Point ===');
    const appResponse = await fetch('http://localhost:8080/client/app.js');
    const appJs = await appResponse.text();
    
    if (appJs.length > 0 && !appJs.includes('jolt-physics')) {
      console.log('✓ client/app.js served correctly');
      console.log('✓ client/app.js does not contain jolt-physics');
    } else {
      console.log('✗ client/app.js issue detected');
    }
    
    // Test 4: Check src/index.client.js is available
    console.log('\n=== TEST 4: Client Index ===');
    const indexClientResponse = await fetch('http://localhost:8080/src/index.client.js');
    const indexClient = await indexClientResponse.text();
    
    if (indexClient.includes('PhysicsNetworkClient')) {
      console.log('✓ src/index.client.js available and contains PhysicsNetworkClient');
    } else {
      console.log('✗ src/index.client.js missing or incomplete');
    }
    
    if (!indexClient.includes('jolt-physics')) {
      console.log('✓ src/index.client.js does not contain jolt-physics');
    } else {
      console.log('✗ src/index.client.js contains jolt-physics (should not)');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
