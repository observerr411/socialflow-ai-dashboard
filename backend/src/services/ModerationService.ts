import { prisma } from '../lib/prisma';
import { createLogger } from '../lib/logger';

const logger = createLogger('ModerationService');

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

// Extend with a real content-moderation provider (e.g. OpenAI Moderation API)
// by replacing the logic inside `evaluate`.
async function evaluate(content: string): Promise<{ approved: boolean; reason?: string }> {
  // Placeholder: flag content that contains obvious policy violations.
  // Replace with an actual API call in production.
  const blocked = /\b(spam|hate|violence)\b/i.test(content);
  return blocked
    ? { approved: false, reason: 'Content matched blocked-term policy' }
    : { approved: true };
}

export async function moderate(postId: string): Promise<ModerationStatus> {
  const post = await prisma.post.findUniqueOrThrow({ where: { id: postId } });

  const result = await evaluate(post.content);
  const status: ModerationStatus = result.approved ? 'approved' : 'rejected';

  await prisma.post.update({
    where: { id: postId },
    data: { moderationStatus: status },
  });

  logger.info('Post moderation complete', { postId, status, reason: result.reason });
  return status;
}
