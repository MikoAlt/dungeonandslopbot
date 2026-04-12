import { describe, expect, test, beforeEach, vi } from 'bun:test';
import { EmbeddingRepository } from '../../../src/db/repositories/embedding.js';
import { PrismaClient } from '../../../src/generated/prisma/client.js';

vi.mock('../../../src/generated/prisma/client.js', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    embedding: {
      deleteMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  })),
}));

describe('EmbeddingRepository', () => {
  let prisma: PrismaClient;
  let repo: EmbeddingRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = new PrismaClient();
    repo = new EmbeddingRepository(prisma);
  });

  test('createEmbedding inserts via raw SQL', async () => {
    const mockResult = {
      id: 'emb1',
      messageId: 'msg1',
      content: 'What is the capital of France?',
      createdAt: new Date(),
    };
    (prisma.$queryRaw as ReturnType<typeof vi.fn>).mockResolvedValue([mockResult]);

    const embedding = new Array(1536).fill(0).map(() => Math.random());
    const result = await repo.createEmbedding('msg1', 'What is the capital of France?', embedding);

    expect(result).toEqual(mockResult);
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  test('searchSimilar finds similar embeddings via cosine distance', async () => {
    const mockResults = [
      {
        id: 'emb1',
        messageId: 'msg1',
        content: 'Paris is the capital',
        similarity: 0.95,
        createdAt: new Date(),
      },
      {
        id: 'emb2',
        messageId: 'msg2',
        content: 'France has Paris',
        similarity: 0.85,
        createdAt: new Date(),
      },
    ];
    (prisma.$queryRaw as ReturnType<typeof vi.fn>).mockResolvedValue(mockResults);

    const embedding = new Array(1536).fill(0).map(() => Math.random());
    const result = await repo.searchSimilar(embedding, 10, 0.7);

    expect(result).toEqual(mockResults);
    expect(result).toHaveLength(2);
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  test('searchSimilar uses default limit and threshold', async () => {
    (prisma.$queryRaw as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const embedding = new Array(1536).fill(0).map(() => Math.random());
    await repo.searchSimilar(embedding);

    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  test('deleteByMessageIds removes embeddings by message IDs', async () => {
    (prisma.embedding.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 3 });

    const result = await repo.deleteByMessageIds(['msg1', 'msg2', 'msg3']);

    expect(result).toBe(3);
    expect(prisma.embedding.deleteMany).toHaveBeenCalledWith({
      where: { messageId: { in: ['msg1', 'msg2', 'msg3'] } },
    });
  });

  test('deleteByMessageIds returns 0 when no embeddings deleted', async () => {
    (prisma.embedding.deleteMany as ReturnType<typeof vi.fn>).mockResolvedValue({ count: 0 });

    const result = await repo.deleteByMessageIds(['nonexistent']);

    expect(result).toBe(0);
  });
});
