#!/bin/bash
# Update PocketBase Application URL

# Authenticate
AUTH_RESPONSE=$(curl -s -X POST "http://localhost:8090/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  -d '{"identity":"admin@example.com","password":"REDACTED_PASSWORD"}')

TOKEN=$(echo "$AUTH_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

if [ -z "$TOKEN" ]; then
  echo "Failed to get token"
  exit 1
fi

echo "Token obtained successfully"

# Update settings
RESULT=$(curl -s -X PATCH "http://localhost:8090/api/settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"meta":{"appName":"My Store","appURL":"https://api.yourdomain.com"}}')

echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print('Updated appName:', d.get('meta',{}).get('appName')); print('Updated appURL:', d.get('meta',{}).get('appURL'))"
