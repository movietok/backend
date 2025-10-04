#!/bin/bash

echo "🧪 Testing TMDB-Finnkino Integration"
echo "===================================="
echo ""

BASE_URL="http://localhost:3000/api/tmdb"

# Test 1: Without f_id (Standard TMDB search)
echo "Test 1: Standard TMDB search (no f_id)"
echo "Request: GET ${BASE_URL}/title-year?originalTitle=The Matrix&year=1999"
curl -s "${BASE_URL}/title-year?originalTitle=The%20Matrix&year=1999" | jq '.'
echo ""
echo "---"
echo ""

# Test 2: With f_id (First request - should fetch from TMDB and save)
echo "Test 2: First request with f_id (should save to DB)"
echo "Request: GET ${BASE_URL}/title-year?originalTitle=Täydelliset vieraat&year=2025&f_id=123"
curl -s "${BASE_URL}/title-year?originalTitle=Täydelliset%20vieraat&year=2025&f_id=123" | jq '.source, .results[0].original_title, .results[0].f_id'
echo ""
echo "---"
echo ""

# Test 3: With same f_id (Second request - should fetch from database)
echo "Test 3: Second request with same f_id (should load from DB - faster)"
echo "Request: GET ${BASE_URL}/title-year?originalTitle=Täydelliset vieraat&year=2025&f_id=123"
time curl -s "${BASE_URL}/title-year?originalTitle=Täydelliset%20vieraat&year=2025&f_id=123" | jq '.source, .results[0].original_title'
echo ""
echo "---"
echo ""

# Test 4: Invalid f_id (should fallback to TMDB)
echo "Test 4: Invalid f_id (should fallback to TMDB)"
echo "Request: GET ${BASE_URL}/title-year?originalTitle=The Matrix&year=1999&f_id=invalid"
curl -s "${BASE_URL}/title-year?originalTitle=The%20Matrix&year=1999&f_id=invalid" | jq '.source'
echo ""
echo "---"
echo ""

echo "✅ Tests completed!"
echo ""
echo "Expected results:"
echo "  Test 1: source = 'tmdb'"
echo "  Test 2: source = 'tmdb' (first time, saves to DB)"
echo "  Test 3: source = 'database' (cached, much faster)"
echo "  Test 4: source = 'tmdb' (invalid f_id ignored)"
