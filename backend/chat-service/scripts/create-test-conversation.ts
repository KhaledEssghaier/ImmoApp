import { MongoClient, ObjectId } from 'mongodb';

async function createTestConversation() {
  const client = await MongoClient.connect('mongodb://localhost:27017/immobilier_app');
  const db = client.db();
  
  const jeanId = new ObjectId('507f1f77bcf86cd799439011');  // jean.dupont
  const marieId = new ObjectId('507f1f77bcf86cd799439012'); // marie.martin
  
  console.log('📝 Creating test conversation for Jean and Marie...');
  
  // Create conversation
  const conversation = {
    user1: jeanId,
    user2: marieId,
    lastMessage: 'Hello Jean! How are you?',
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const convResult = await db.collection('chats').insertOne(conversation);
  console.log(`✅ Conversation created: ${convResult.insertedId}`);
  
  // Create initial messages
  const messages = [
    {
      chatId: convResult.insertedId,
      senderId: marieId,
      text: 'Hello Jean! How are you?',
      images: [],
      isRead: false,
      createdAt: new Date(Date.now() - 3600000) // 1 hour ago
    },
    {
      chatId: convResult.insertedId,
      senderId: jeanId,
      text: 'Hi Marie! I\'m doing great, thanks for asking!',
      images: [],
      isRead: true,
      createdAt: new Date(Date.now() - 3000000) // 50 minutes ago
    },
    {
      chatId: convResult.insertedId,
      senderId: marieId,
      text: 'That\'s wonderful! I wanted to ask about the property listing.',
      images: [],
      isRead: false,
      createdAt: new Date(Date.now() - 1800000) // 30 minutes ago
    }
  ];
  
  await db.collection('messages').insertMany(messages);
  console.log(`✅ ${messages.length} messages created`);
  
  await client.close();
  console.log('\n🎉 Test data created successfully!');
  console.log(`Jean Dupont (${jeanId}) can now chat with Marie Martin (${marieId})`);
}

createTestConversation().catch(console.error);
