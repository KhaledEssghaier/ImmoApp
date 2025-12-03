#!/bin/bash

# Notification Service Test Script

echo "🔔 Testing Notification Service..."

# Configuration
BASE_URL="http://localhost:3006/api/v1"
INTERNAL_API_KEY="your-super-secure-internal-api-key-change-this"
JWT_TOKEN="your-test-jwt-token"
USER_ID="507f1f77bcf86cd799439011"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "\n${YELLOW}Test 1: Creating a notification...${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/notifications" \
  -H "x-api-key: $INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$USER_ID\",
    \"type\": \"message\",
    \"title\": \"Test Notification\",
    \"body\": \"This is a test notification from curl\",
    \"payload\": {
      \"conversationId\": \"test-conv-123\",
      \"route\": \"/conversations/test-conv-123\"
    },
    \"channel\": [\"push\", \"inapp\"]
  }")

if echo "$RESPONSE" | grep -q "_id"; then
  echo -e "${GREEN}✓ Notification created successfully${NC}"
  NOTIF_ID=$(echo "$RESPONSE" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
  echo "Notification ID: $NOTIF_ID"
else
  echo -e "${RED}✗ Failed to create notification${NC}"
  echo "Response: $RESPONSE"
fi

# Test 2: List Notifications
echo -e "\n${YELLOW}Test 2: Listing notifications...${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/notifications?page=1&limit=5" \
  -H "Authorization: Bearer $JWT_TOKEN")

if echo "$RESPONSE" | grep -q "data"; then
  echo -e "${GREEN}✓ Notifications retrieved successfully${NC}"
  echo "Response: $RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
  echo -e "${RED}✗ Failed to retrieve notifications${NC}"
  echo "Response: $RESPONSE"
fi

# Test 3: Get Unread Count
echo -e "\n${YELLOW}Test 3: Getting unread count...${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/notifications/unread-count" \
  -H "Authorization: Bearer $JWT_TOKEN")

if echo "$RESPONSE" | grep -q "count"; then
  echo -e "${GREEN}✓ Unread count retrieved${NC}"
  echo "Response: $RESPONSE"
else
  echo -e "${RED}✗ Failed to get unread count${NC}"
  echo "Response: $RESPONSE"
fi

# Test 4: Register Device
echo -e "\n${YELLOW}Test 4: Registering device token...${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/devices/register" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"deviceToken\": \"test-fcm-token-$(date +%s)\",
    \"platform\": \"android\"
  }")

if echo "$RESPONSE" | grep -q "_id\|deviceToken"; then
  echo -e "${GREEN}✓ Device registered successfully${NC}"
  echo "Response: $RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
  echo -e "${RED}✗ Failed to register device${NC}"
  echo "Response: $RESPONSE"
fi

# Test 5: Bulk Create
echo -e "\n${YELLOW}Test 5: Bulk creating notifications...${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/notifications/bulk" \
  -H "x-api-key: $INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"notifications\": [
      {
        \"userId\": \"$USER_ID\",
        \"type\": \"system\",
        \"title\": \"Bulk Test 1\",
        \"body\": \"First bulk notification\",
        \"channel\": [\"inapp\"]
      },
      {
        \"userId\": \"$USER_ID\",
        \"type\": \"system\",
        \"title\": \"Bulk Test 2\",
        \"body\": \"Second bulk notification\",
        \"channel\": [\"inapp\"]
      }
    ]
  }")

if echo "$RESPONSE" | grep -q "successful"; then
  echo -e "${GREEN}✓ Bulk notifications created${NC}"
  echo "Response: $RESPONSE"
else
  echo -e "${RED}✗ Failed to create bulk notifications${NC}"
  echo "Response: $RESPONSE"
fi

# Test 6: Publish Event to Redis
echo -e "\n${YELLOW}Test 6: Publishing test event to Redis...${NC}"
echo "Publishing chat.message.created event..."

# This requires redis-cli to be installed
if command -v redis-cli &> /dev/null; then
  redis-cli PUBLISH chat.message.created "{
    \"conversationId\": \"test-conv-456\",
    \"messageId\": \"test-msg-789\",
    \"senderId\": \"user-sender\",
    \"senderName\": \"Test Sender\",
    \"participantIds\": [\"$USER_ID\", \"user-sender\"],
    \"text\": \"Test message from Redis event\"
  }" > /dev/null 2>&1
  
  echo -e "${GREEN}✓ Event published to Redis${NC}"
  echo "Check notification service logs to see event processing"
else
  echo -e "${YELLOW}⚠ redis-cli not found, skipping Redis test${NC}"
fi

echo -e "\n${GREEN}✅ Test suite completed!${NC}"
echo "Note: Replace JWT_TOKEN and INTERNAL_API_KEY with valid values for full testing"
