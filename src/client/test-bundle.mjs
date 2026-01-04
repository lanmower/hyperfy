// Quick test of the client bundle loading
const bundle = await import('/public/dist/client.js');
console.log('Bundle loaded:', !!bundle);
console.log('window.world:', !!window.world);
