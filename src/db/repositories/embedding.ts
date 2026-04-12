import { PrismaClient } from '../../generated/prisma/client.js';

type EmbeddingResult = {
  id: string;
  messageId: string;
  content: string;
  similarity: number;
  createdAt: Date;
};

export class EmbeddingRepository {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createEmbedding(
    messageId: string,
    content: string,
    embedding: number[],
  ): Promise<{ id: string; messageId: string; content: string; createdAt: Date }> {
    const vectorString = `[${embedding.join(',')}]`;
    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; messageId: string; content: string; createdAt: Date }>
    >`
      INSERT INTO "Embedding" (id, "messageId", embedding, content, "createdAt")
      VALUES (gen_random_uuid(), ${messageId}, ${vectorString}::vector, ${content}, NOW())
      RETURNING id, "messageId", content, "createdAt"
    `;
    return rows[0];
  }

  async searchSimilar(
    embedding: number[],
    limit: number = 10,
    threshold: number = 0.7,
  ): Promise<EmbeddingResult[]> {
    const vectorString = `[${embedding.join(',')}]`;
    return this.prisma.$queryRaw<
      Array<{
        id: string;
        messageId: string;
        content: string;
        similarity: number;
        createdAt: Date;
      }>
    >`
      SELECT e.id, e."messageId", e.content,
             1 - (e.embedding <=> ${vectorString}::vector) AS similarity,
             e."createdAt"
      FROM "Embedding" e
      WHERE 1 - (e.embedding <=> ${vectorString}::vector) > ${threshold}
      ORDER BY e.embedding <=> ${vectorString}::vector
      LIMIT ${limit}
    `;
  }

  async deleteByMessageIds(ids: string[]): Promise<number> {
    const result = await this.prisma.embedding.deleteMany({
      where: { messageId: { in: ids } },
    });
    return result.count;
  }
}
