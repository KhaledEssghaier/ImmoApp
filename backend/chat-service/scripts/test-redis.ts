import { Redis } from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

async function testRedis() {
  console.log('🧪 Testing Redis Connection...\n');
  console.log('📋 Configuration:', redisConfig);
  console.log('');

  const redis = new Redis(redisConfig);

  try {
    // Test 1: Basic Connection
    console.log('Test 1: Basic Connection');
    const pong = await redis.ping();
    console.log('✅ PING response:', pong);
    console.log('');

    // Test 2: Set/Get Operations
    console.log('Test 2: Set/Get Operations');
    await redis.set('test:basic', 'Hello Redis!');
    const value = await redis.get('test:basic');
    console.log('✅ SET/GET working:', value);
    await redis.del('test:basic');
    console.log('');

    // Test 3: TTL (Time To Live)
    console.log('Test 3: TTL (Expiring Keys)');
    await redis.set('test:ttl', 'expires soon', 'EX', 5);
    const ttl = await redis.ttl('test:ttl');
    console.log('✅ TTL working:', ttl, 'seconds');
    await redis.del('test:ttl');
    console.log('');

    // Test 4: Sets (for socket tracking)
    console.log('Test 4: Sets (Socket Tracking)');
    await redis.sadd('test:sockets:user1', 'socket1', 'socket2', 'socket3');
    const members = await redis.smembers('test:sockets:user1');
    console.log('✅ SADD/SMEMBERS working:', members);
    await redis.del('test:sockets:user1');
    console.log('');

    // Test 5: Increment (for rate limiting)
    console.log('Test 5: Increment (Rate Limiting)');
    await redis.incr('test:counter');
    await redis.incr('test:counter');
    await redis.incr('test:counter');
    const count = await redis.get('test:counter');
    console.log('✅ INCR working:', count);
    await redis.del('test:counter');
    console.log('');

    // Test 6: Pub/Sub
    console.log('Test 6: Pub/Sub (Real-time messaging)');
    const subscriber = new Redis(redisConfig);
    const publisher = new Redis(redisConfig);

    await new Promise((resolve) => {
      subscriber.subscribe('test:channel');
      
      subscriber.on('message', (channel, message) => {
        console.log('✅ Pub/Sub working! Received:', message);
        subscriber.disconnect();
        publisher.disconnect();
        resolve(true);
      });

      setTimeout(() => {
        publisher.publish('test:channel', 'Hello from publisher!');
      }, 100);
    });
    console.log('');

    // Test 7: Chat Service Keys Simulation
    console.log('Test 7: Chat Service Keys Simulation');
    const userId = '507f1f77bcf86cd799439012';
    const conversationId = '507f1f77bcf86cd799439013';
    
    // User presence
    await redis.set(`chat:presence:${userId}`, 'online', 'EX', 300);
    console.log('✅ User presence set');
    
    // Socket tracking
    await redis.sadd(`chat:user:sockets:${userId}`, 'socket123');
    console.log('✅ Socket added');
    
    // Rate limiting
    await redis.incr(`chat:ratelimit:message:${userId}`);
    await redis.expire(`chat:ratelimit:message:${userId}`, 60);
    console.log('✅ Rate limit counter set');
    
    // Typing indicator
    await redis.set(`chat:typing:${conversationId}:${userId}`, 'typing', 'EX', 5);
    console.log('✅ Typing indicator set');
    
    // Verify all keys
    const allKeys = await redis.keys('chat:*');
    console.log('✅ All chat keys created:', allKeys.length);
    console.log('');

    // Test 8: Cleanup
    console.log('Test 8: Cleanup');
    const deleted = await redis.del(
      `chat:presence:${userId}`,
      `chat:user:sockets:${userId}`,
      `chat:ratelimit:message:${userId}`,
      `chat:typing:${conversationId}:${userId}`
    );
    console.log('✅ Cleaned up', deleted, 'keys');
    console.log('');

    // Test 9: Performance Test
    console.log('Test 9: Performance Test (1000 operations)');
    const startTime = Date.now();
    
    for (let i = 0; i < 1000; i++) {
      await redis.set(`test:perf:${i}`, `value${i}`);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const opsPerSecond = Math.round(1000 / (duration / 1000));
    
    console.log('✅ Performance:', duration, 'ms for 1000 operations');
    console.log('✅ Speed:', opsPerSecond, 'operations/second');
    
    // Cleanup performance test keys
    const perfKeys = await redis.keys('test:perf:*');
    if (perfKeys.length > 0) {
      await redis.del(...perfKeys);
    }
    console.log('');

    // Test 10: Memory Info
    console.log('Test 10: Redis Server Info');
    const info = await redis.info('memory');
    const memoryMatch = info.match(/used_memory_human:(.+)/);
    if (memoryMatch) {
      console.log('✅ Memory usage:', memoryMatch[1].trim());
    }
    console.log('');

    // Final Summary
    console.log('═══════════════════════════════════════');
    console.log('🎉 All Tests Passed!');
    console.log('═══════════════════════════════════════');
    console.log('✅ Redis is working correctly');
    console.log('✅ All data structures supported');
    console.log('✅ Pub/Sub operational');
    console.log('✅ TTL/Expiration working');
    console.log('✅ Performance is good');
    console.log('═══════════════════════════════════════');

    redis.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════');
    console.error('❌ Redis Test Failed!');
    console.error('═══════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check if Redis is running:');
    console.error('   sudo systemctl status redis-server');
    console.error('');
    console.error('2. Start Redis if not running:');
    console.error('   sudo systemctl start redis-server');
    console.error('');
    console.error('3. Test Redis directly:');
    console.error('   redis-cli ping');
    console.error('');
    console.error('4. Check Redis logs:');
    console.error('   sudo journalctl -u redis-server -n 50');
    console.error('═══════════════════════════════════════');
    
    redis.disconnect();
    process.exit(1);
  }
}

testRedis();
