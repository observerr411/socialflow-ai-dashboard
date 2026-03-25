# Distributed Locking with Redis Redlock - Implementation

## Overview
Implemented distributed locking using Redis Redlock algorithm to prevent race conditions during concurrent tasks like social media posting and AI generation.

## Changes Made

### 1. Dependencies
**File**: `backend/package.json`
- Added `redlock: ^4.2.0` for distributed locking

### 2. Lock Service
**File**: `backend/src/utils/LockService.ts`

Core functionality:
- `withLock(key, fn, options)` - Acquire lock, execute function, auto-release
- `tryLock(key, duration)` - Non-blocking lock attempt
- `releaseLock(lock)` - Manual lock release

Features:
- Automatic lock release on completion or error
- Configurable duration (default 30s)
- Retry mechanism with exponential backoff
- Automatic extension for long-running tasks
- Comprehensive logging

### 3. Service Integration

#### FacebookService
**File**: `backend/src/services/FacebookService.ts`
- Wrapped `postToPage()` with lock: `lock:facebook:post:{pageId}`
- Prevents concurrent posts to same page

#### TwitterService
**File**: `backend/src/services/TwitterService.ts`
- Wrapped `postTweet()` with lock: `lock:twitter:post`
- Prevents concurrent tweet posting

## Security Features

✅ **Redlock Algorithm**: Industry-standard distributed locking
✅ **Automatic Release**: Locks released on success or error
✅ **Timeout Protection**: Default 30-second timeout
✅ **Retry Logic**: Configurable retries with backoff
✅ **Auto-Extension**: Extends locks for long operations
✅ **Error Handling**: Graceful failure with logging

## Configuration

```typescript
// In LockService.ts
driftFactor: 0.01              // 1% clock drift tolerance
retryCount: 3                  // Retry 3 times
retryDelay: 200                // 200ms between retries
retryJitter: 200               // Random jitter
automaticExtensionThreshold: 500 // Extend if < 500ms left
```

## API

### withLock
```typescript
await LockService.withLock(
  'facebook:post:page123',
  async () => {
    // Critical section - only one execution at a time
    return await facebookService.postToPage(request);
  },
  { duration: 30000 }
);
```

### tryLock
```typescript
const lock = await LockService.tryLock('my-resource', 30000);
if (lock) {
  try {
    // Do work
  } finally {
    await LockService.releaseLock(lock);
  }
} else {
  // Lock already held
}
```

## Usage Examples

### Social Media Posting
```typescript
// Prevents duplicate posts to same page
await LockService.withLock(`facebook:post:${pageId}`, async () => {
  return await facebookService.postToPage(request);
});
```

### AI Generation
```typescript
// Prevents concurrent AI requests for same resource
await LockService.withLock(`ai:generate:${contentId}`, async () => {
  return await aiService.generate(prompt);
});
```

### Database Operations
```typescript
// Prevents race conditions in updates
await LockService.withLock(`db:update:${recordId}`, async () => {
  return await prisma.record.update({ ... });
});
```

## Lock Key Naming Convention

- `lock:service:resource:id` - Standard format
- `lock:facebook:post:pageId` - Facebook posts
- `lock:twitter:post` - Twitter posts
- `lock:ai:generate:contentId` - AI generation
- `lock:db:update:recordId` - Database updates

## Error Handling

```typescript
try {
  await LockService.withLock('resource', async () => {
    // Work
  });
} catch (err) {
  if (err.message.includes('Could not acquire lock')) {
    // Lock timeout - resource busy
  } else {
    // Other error
  }
}
```

## Logging

All lock operations are logged:
- Lock acquisition: `Lock acquired: lock:key`
- Lock release: `Lock released: lock:key`
- Lock failures: `Failed to acquire lock: lock:key`
- Release errors: `Failed to unlock lock:key`

## Performance Considerations

- **Lock Duration**: Set appropriate timeout (default 30s)
- **Retry Count**: Balance between wait time and success rate
- **Key Naming**: Use specific keys to minimize contention
- **Redis Connection**: Ensure Redis is highly available

## Testing

```typescript
// Test lock acquisition
const result = await LockService.withLock('test', async () => {
  return 'success';
});
expect(result).toBe('success');

// Test lock timeout
const lock = await LockService.tryLock('test', 1000);
expect(lock).not.toBeNull();
await LockService.releaseLock(lock!);
```

## Migration Guide

### For Existing Services

1. Import LockService:
```typescript
import { LockService } from '../utils/LockService';
```

2. Wrap critical sections:
```typescript
// Before
public async publish(data) {
  return await this.doWork(data);
}

// After
public async publish(data) {
  return LockService.withLock(`service:publish:${data.id}`, async () => {
    return await this.doWork(data);
  });
}
```

## Commit Message

```
feat: implement distributed locking with Redlock for task synchronicity

- Add LockService with Redlock algorithm
- Implement withLock() for automatic lock management
- Implement tryLock() for non-blocking attempts
- Wrap FacebookService.postToPage() with locks
- Wrap TwitterService.postTweet() with locks
- Add comprehensive logging for lock operations
- Configure automatic lock extension for long tasks
- Ensure safe lock acquisition and release

Fixes #62
```

## Production Checklist

- [ ] Redis is highly available (cluster or sentinel)
- [ ] Lock timeouts are appropriate for operations
- [ ] Logging is configured for monitoring
- [ ] Error handling is in place
- [ ] Tests cover lock scenarios
- [ ] Documentation is updated
- [ ] Team is trained on lock usage

## Troubleshooting

**Lock timeout errors**
- Increase lock duration
- Check if operation is too slow
- Monitor Redis performance

**Lock not releasing**
- Check error logs
- Verify Redis connection
- Restart service if needed

**Deadlocks**
- Use consistent lock key ordering
- Set appropriate timeouts
- Monitor lock contention

## References

- Redlock Algorithm: https://redis.io/docs/reference/patterns/distributed-locks/
- Redlock NPM: https://www.npmjs.com/package/redlock
- Redis Documentation: https://redis.io/
