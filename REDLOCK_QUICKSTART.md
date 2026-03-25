# Distributed Locking with Redlock - Quick Start

## 🚀 Setup (2 minutes)

### 1. Install Dependencies
```bash
cd backend
npm install redlock
```

### 2. Ensure Redis is Running
```bash
# Check Redis connection
redis-cli ping
# Should return: PONG
```

### 3. Use LockService in Your Code

```typescript
import { LockService } from '../utils/LockService';

// Wrap critical sections
await LockService.withLock('my-resource', async () => {
  // Only one execution at a time
  return await doSomething();
});
```

## 📋 Common Use Cases

### Prevent Duplicate Social Media Posts
```typescript
public async postToPage(request: FacebookPostRequest): Promise<FacebookPagePost> {
  return LockService.withLock(`facebook:post:${request.pageId}`, async () => {
    // Post logic here
  });
}
```

### Prevent Concurrent AI Requests
```typescript
public async generateContent(prompt: string): Promise<string> {
  return LockService.withLock(`ai:generate:${contentId}`, async () => {
    // AI generation logic
  });
}
```

### Prevent Race Conditions in Database Updates
```typescript
public async updateRecord(id: string, data: any): Promise<void> {
  return LockService.withLock(`db:update:${id}`, async () => {
    // Update logic
  });
}
```

## 🔧 API Reference

### withLock (Recommended)
```typescript
await LockService.withLock(
  key: string,
  fn: () => Promise<T>,
  options?: { duration?: number }
): Promise<T>
```
- Automatically acquires and releases lock
- Handles errors gracefully
- Returns function result

### tryLock (Manual Control)
```typescript
const lock = await LockService.tryLock(
  key: string,
  duration?: number
): Promise<Lock | null>
```
- Returns null if lock already held
- Requires manual release

### releaseLock (Manual Release)
```typescript
await LockService.releaseLock(lock: Lock): Promise<void>
```
- Manually release a lock
- Called automatically by withLock

## ⚙️ Configuration

Edit `backend/src/utils/LockService.ts`:

```typescript
const redlock = new Redlock([redisClient], {
  driftFactor: 0.01,              // Clock drift tolerance
  retryCount: 3,                  // Retry attempts
  retryDelay: 200,                // Delay between retries (ms)
  retryJitter: 200,               // Random jitter (ms)
  automaticExtensionThreshold: 500, // Auto-extend if < 500ms left
});
```

## 🧪 Testing

```typescript
// Test basic lock
const result = await LockService.withLock('test', async () => {
  return 'success';
});
console.log(result); // 'success'

// Test lock contention
const lock1 = await LockService.tryLock('resource', 5000);
const lock2 = await LockService.tryLock('resource', 5000);
console.log(lock1 !== null); // true
console.log(lock2 === null); // true (already locked)
```

## 📊 Monitoring

Check lock operations in logs:
```
Lock acquired: lock:facebook:post:page123
Lock released: lock:facebook:post:page123
Failed to acquire lock: lock:twitter:post
```

## 🆘 Troubleshooting

**Q: "Could not acquire lock" error**
- Resource is busy
- Increase lock duration if operation is slow
- Check Redis connection

**Q: Lock not releasing**
- Check error logs
- Verify Redis is running
- Restart service

**Q: Performance issues**
- Reduce lock contention with specific keys
- Increase lock duration if operations are slow
- Monitor Redis performance

## 📚 Files

- `backend/src/utils/LockService.ts` - Lock service implementation
- `backend/src/services/FacebookService.ts` - Facebook integration
- `backend/src/services/TwitterService.ts` - Twitter integration

## ✅ Checklist

- [ ] Install redlock: `npm install redlock`
- [ ] Verify Redis is running
- [ ] Import LockService in services
- [ ] Wrap critical sections with locks
- [ ] Test lock functionality
- [ ] Monitor logs for lock operations
- [ ] Deploy to production

## 🔗 Resources

- Redlock Algorithm: https://redis.io/docs/reference/patterns/distributed-locks/
- Redlock NPM: https://www.npmjs.com/package/redlock
- Redis Documentation: https://redis.io/

---

**Status**: Ready for Production
**Implementation Time**: ~5 minutes
**Maintenance**: Minimal - automatic lock management
