const io = require('socket.io-client');

// Replace with your actual JWT token from auth service
const TOKEN = 'YOUR_JWT_TOKEN_HERE';

// Create two clients
console.log('🚀 Starting two chat clients...\n');

const client1 = io('http://localhost:3005/chat', {
  auth: { token: TOKEN },
  transports: ['websocket'],
});

const client2 = io('http://localhost:3005/chat', {
  auth: { token: TOKEN },
  transports: ['websocket'],
});

const conversationId = '673762f5e85740f6248f2803'; // Replace with actual conversation ID

// Client 1 events
client1.on('connect', () => {
  console.log('✅ Client 1 connected:', client1.id);
  
  client1.emit('join_conversation', { conversationId });
  
  // Send a message after 1 second
  setTimeout(() => {
    console.log('\n📤 Client 1 sending message...');
    client1.emit('message_send', {
      conversationId,
      text: 'Hello from Client 1!',
      localId: 'local-' + Date.now(),
    });
  }, 1000);
});

client1.on('message_new', (data) => {
  console.log('\n💬 Client 1 received message:', {
    from: data.senderId,
    text: data.text,
    localId: data.localId,
  });
});

client1.on('typing', (data) => {
  if (data.isTyping) {
    console.log(`\n⌨️  Client 1: User ${data.userId} is typing...`);
  }
});

client1.on('error', (error) => {
  console.error('❌ Client 1 error:', error);
});

// Client 2 events
client2.on('connect', () => {
  console.log('✅ Client 2 connected:', client2.id);
  
  client2.emit('join_conversation', { conversationId });
  
  // Send typing indicator after 2 seconds
  setTimeout(() => {
    console.log('\n⌨️  Client 2 typing...');
    client2.emit('typing', {
      conversationId,
      isTyping: true,
    });
  }, 2000);
  
  // Send message after 3 seconds
  setTimeout(() => {
    console.log('\n📤 Client 2 sending message...');
    client2.emit('typing', {
      conversationId,
      isTyping: false,
    });
    
    client2.emit('message_send', {
      conversationId,
      text: 'Hello from Client 2! How are you?',
      localId: 'local-' + Date.now(),
    });
  }, 3000);
});

client2.on('message_new', (data) => {
  console.log('\n💬 Client 2 received message:', {
    from: data.senderId,
    text: data.text,
    localId: data.localId,
  });
  
  // Mark as read
  setTimeout(() => {
    console.log('\n✅ Client 2 marking message as read...');
    client2.emit('message_read', {
      conversationId,
      messageIds: [data._id],
    });
  }, 500);
});

client2.on('message_read_update', (data) => {
  console.log('\n📖 Read receipt update:', {
    userId: data.userId,
    messageCount: data.messageIds.length,
  });
});

client2.on('typing', (data) => {
  if (data.isTyping) {
    console.log(`\n⌨️  Client 2: User ${data.userId} is typing...`);
  }
});

client2.on('error', (error) => {
  console.error('❌ Client 2 error:', error);
});

// Disconnect after 10 seconds
setTimeout(() => {
  console.log('\n\n🔌 Disconnecting clients...');
  client1.disconnect();
  client2.disconnect();
  process.exit(0);
}, 10000);

console.log('\n⏳ Test will run for 10 seconds...\n');
