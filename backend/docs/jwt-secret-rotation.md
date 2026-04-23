# JWT Secret Rotation Runbook

This runbook rotates JWT signing secrets with minimal user impact and a rollback path.

## Scope

- Access token secret: `JWT_SECRET`
- Refresh token secret: `JWT_REFRESH_SECRET`
- Redis-backed token blacklist/revocation entries

## Prerequisites

- Access to secret manager and deployment pipeline
- Access to Redis used by the backend
- Ability to monitor auth error rate (`401`/`403`) and login success rate
- Current secret values stored in a secure break-glass location for rollback

## Important Notes

- Rotating both access and refresh secrets at once invalidates all existing tokens.
- To avoid locking out all users, rotate in stages:
  1. Rotate access secret first.
  2. Allow clients to refresh normally.
  3. Rotate refresh secret during a controlled window.
- Flush the Redis blacklist only as part of the cutover/cleanup step (details below).

## Staged Rotation Procedure

1. Prepare new secrets.

- Generate high-entropy values (at least 32 bytes, base64/hex encoded).
- Store as `JWT_SECRET_NEXT` and `JWT_REFRESH_SECRET_NEXT` in secret manager (temporary names).
- Do not deploy yet.

2. Confirm baseline before changes.

- Verify auth success/error dashboards are green.
- Verify Redis connectivity from the backend.
- Announce maintenance window to on-call and support.

3. Stage 1: Rotate `JWT_SECRET` (access token) only.

- Promote `JWT_SECRET_NEXT` to `JWT_SECRET`.
- Keep existing `JWT_REFRESH_SECRET` unchanged.
- Deploy backend gradually (canary, then 25%, 50%, 100%).

4. Observe for stabilization (typically 15 to 60 minutes).

- Expected behavior: some clients receive `401` for stale access tokens, then recover after refresh.
- Watch for elevated persistent login failures (not brief access token failures).

5. Stage 2: Rotate `JWT_REFRESH_SECRET` (refresh token).

- Promote `JWT_REFRESH_SECRET_NEXT` to `JWT_REFRESH_SECRET`.
- Deploy backend gradually again (canary, then full rollout).
- Expect users with old refresh tokens to be prompted to sign in again.

6. Cutover cleanup: flush Redis blacklist/revocation keys.

- Use the command appropriate for your deployment:

```bash
# If JWT blacklist data is isolated in a dedicated Redis DB index:
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -n "$REDIS_DB" -a "$REDIS_PASSWORD" FLUSHDB
```

```bash
# If sharing a Redis DB, delete only JWT blacklist keys by prefix (safer):
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" --scan --pattern "jwt:blacklist:*" | xargs -r redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" DEL
```

7. Post-rotation verification.

- Confirm new login works.
- Confirm refresh flow works for newly issued sessions.
- Confirm auth failure rates return to baseline.
- Remove temporary `*_NEXT` secrets from secret manager.

## Rollback Procedure

Use rollback if login/refresh failures remain elevated after deployment.

1. Restore previous `JWT_SECRET` and `JWT_REFRESH_SECRET` values from secure backup.
2. Redeploy backend immediately (canary, then full).
3. Flush Redis blacklist/revocation entries again to eliminate mixed-state token artifacts:

```bash
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -n "$REDIS_DB" -a "$REDIS_PASSWORD" FLUSHDB
```

4. Verify auth success rate returns to baseline.
5. Open an incident follow-up and keep rotated values quarantined until root cause is understood.

## Operational Checklist

- [ ] New secrets generated and stored securely
- [ ] Stage 1 deployed and monitored
- [ ] Stage 2 deployed and monitored
- [ ] Redis blacklist/revocation entries flushed
- [ ] Auth metrics normalized
- [ ] Temporary secrets removed
- [ ] Runbook execution notes added to incident/change record
