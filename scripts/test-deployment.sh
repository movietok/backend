#!/bin/bash

echo "🧪 Testing deployment workflow components..."

# Test health endpoint
echo "📡 Testing health endpoint..."
response=$(curl -s http://localhost:3000/api/health --connect-timeout 5 || echo '{"error":"connection_failed"}')
status_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health --connect-timeout 5 || echo "000")

echo "HTTP Status: $status_code"

if [ "$status_code" = "200" ]; then
    echo "✅ Health endpoint is working"
    
    # Parse response
    version=$(echo "$response" | jq -r '.version // "unknown"')
    commit=$(echo "$response" | jq -r '.commit // "unknown"')
    uptime=$(echo "$response" | jq -r '.uptime // 0')
    environment=$(echo "$response" | jq -r '.environment // "unknown"')
    
    echo "📋 Current deployment info:"
    echo "  Version: $version"
    echo "  Commit: $commit"
    echo "  Environment: $environment"
    echo "  Uptime: ${uptime}s"
    
else
    echo "❌ Health endpoint not responding (HTTP $status_code)"
    echo "Response: $response"
fi

echo ""
echo "🔧 Workflow is ready to use version-based deployment verification!"