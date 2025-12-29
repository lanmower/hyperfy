#!/bin/bash

echo "=== TESTING ALL DATABASE OPTIMIZATIONS ==="
echo ""

echo "1. Running Verification..."
node src/server/cache/verify-optimizations.js
echo ""

echo "2. Running Benchmark..."
node src/server/cache/benchmark.js
echo ""

echo "3. Running Integration Test..."
node src/server/cache/integration-test.js
echo ""

echo "4. Running Full Demo..."
node src/server/cache/demo-full.js
echo ""

echo "=== ALL TESTS COMPLETE ==="
