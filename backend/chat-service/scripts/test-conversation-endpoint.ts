import axios from 'axios';

async function testConversationEndpoint() {
  console.log('🧪 Testing Conversation Endpoint...\n');

  try {
    // First, login to get a token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'test.user@example.com',
      password: 'Password123!',
    });

    const token = loginResponse.data.accessToken;
    console.log('✅ Logged in successfully');
    console.log('Token:', token.substring(0, 20) + '...\n');

    // Get conversations
    console.log('2. Fetching conversations...');
    const conversationsResponse = await axios.get(
      'http://localhost:3000/api/v1/conversations',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log('✅ Response received\n');
    console.log('📊 Response Data:');
    console.log(JSON.stringify(conversationsResponse.data, null, 2));
    console.log('\n');

    // Check data structure
    if (Array.isArray(conversationsResponse.data)) {
      console.log('✅ Response is an array');
      console.log(`✅ Found ${conversationsResponse.data.length} conversations\n`);

      if (conversationsResponse.data.length > 0) {
        const firstConv = conversationsResponse.data[0];
        console.log('🔍 First Conversation Structure:');
        console.log('- id:', typeof firstConv.id, '=', firstConv.id);
        console.log('- otherUser:', typeof firstConv.otherUser);
        if (firstConv.otherUser) {
          console.log('  - id:', typeof firstConv.otherUser.id);
          console.log('  - name:', typeof firstConv.otherUser.name);
        }
        console.log('- lastMessage:', typeof firstConv.lastMessage);
        if (firstConv.lastMessage) {
          console.log('  - id:', typeof firstConv.lastMessage.id);
          console.log('  - conversationId:', typeof firstConv.lastMessage.conversationId);
          console.log('  - senderId:', typeof firstConv.lastMessage.senderId);
          console.log('  - text:', typeof firstConv.lastMessage.text);
          console.log('  - createdAt:', typeof firstConv.lastMessage.createdAt);
          console.log('  - attachments:', Array.isArray(firstConv.lastMessage.attachments) ? 'array' : typeof firstConv.lastMessage.attachments);
          console.log('  - readBy:', Array.isArray(firstConv.lastMessage.readBy) ? 'array' : typeof firstConv.lastMessage.readBy);
        }
        console.log('- unreadCount:', typeof firstConv.unreadCount, '=', firstConv.unreadCount);
        console.log('- updatedAt:', typeof firstConv.updatedAt);
      }
    } else if (conversationsResponse.data.data) {
      console.log('⚠️  Response is wrapped in "data" field');
      console.log('Actual data:', conversationsResponse.data.data);
    }

    console.log('\n✅ Test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed!');
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Error:', error.response?.data);
      console.error('URL:', error.config?.url);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testConversationEndpoint();
