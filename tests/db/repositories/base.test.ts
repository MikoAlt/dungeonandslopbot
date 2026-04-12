import { describe, expect, test, beforeEach, vi } from 'bun:test';
import { BaseRepository } from '../../../src/db/repositories/base.js';

function createMockOperations<T>() {
  return {
    findUnique: vi.fn<(id: string) => Promise<T | null>>(),
    findMany:
      vi.fn<
        (args?: {
          where?: unknown;
          skip?: number;
          take?: number;
          orderBy?: unknown;
        }) => Promise<T[]>
      >(),
    create: vi.fn<(data: unknown) => Promise<T>>(),
    update: vi.fn<(id: string, data: unknown) => Promise<T>>(),
    delete: vi.fn<(id: string) => Promise<T>>(),
    count: vi.fn<(where?: unknown) => Promise<number>>(),
  };
}

type Item = { id: string; name: string };

describe('BaseRepository', () => {
  let ops: ReturnType<typeof createMockOperations<Item>>;
  let prisma: { $connect: ReturnType<typeof vi.fn>; $disconnect: ReturnType<typeof vi.fn> };
  let repo: BaseRepository<Item>;

  beforeEach(() => {
    ops = createMockOperations<Item>();
    prisma = { $connect: vi.fn(), $disconnect: vi.fn() };
    repo = new BaseRepository<Item>(prisma as unknown as Parameters<typeof BaseRepository>[0], ops);
  });

  test('findById delegates to findUnique', async () => {
    const item: Item = { id: '1', name: 'Test' };
    ops.findUnique.mockResolvedValue(item);

    const result = await repo.findById('1');

    expect(result).toEqual(item);
    expect(ops.findUnique).toHaveBeenCalledWith('1');
  });

  test('findById returns null when not found', async () => {
    ops.findUnique.mockResolvedValue(null);

    const result = await repo.findById('nonexistent');

    expect(result).toBeNull();
  });

  test('create delegates to createFn', async () => {
    const item: Item = { id: '1', name: 'New' };
    ops.create.mockResolvedValue(item);

    const result = await repo.create({ name: 'New' });

    expect(result).toEqual(item);
    expect(ops.create).toHaveBeenCalledWith({ name: 'New' });
  });

  test('update delegates to updateFn', async () => {
    const item: Item = { id: '1', name: 'Updated' };
    ops.update.mockResolvedValue(item);

    const result = await repo.update('1', { name: 'Updated' });

    expect(result).toEqual(item);
    expect(ops.update).toHaveBeenCalledWith('1', { name: 'Updated' });
  });

  test('delete delegates to deleteFn', async () => {
    const item: Item = { id: '1', name: 'Deleted' };
    ops.delete.mockResolvedValue(item);

    const result = await repo.delete('1');

    expect(result).toEqual(item);
    expect(ops.delete).toHaveBeenCalledWith('1');
  });

  test('list delegates to findMany with filter and pagination', async () => {
    const items: Item[] = [
      { id: '1', name: 'A' },
      { id: '2', name: 'B' },
    ];
    ops.findMany.mockResolvedValue(items);

    const result = await repo.list({ name: 'A' }, 0, 10);

    expect(result).toEqual(items);
    expect(ops.findMany).toHaveBeenCalledWith({ where: { name: 'A' }, skip: 0, take: 10 });
  });

  test('list works without filter or pagination', async () => {
    const items: Item[] = [{ id: '1', name: 'A' }];
    ops.findMany.mockResolvedValue(items);

    const result = await repo.list();

    expect(result).toEqual(items);
    expect(ops.findMany).toHaveBeenCalledWith({
      where: undefined,
      skip: undefined,
      take: undefined,
    });
  });

  test('count delegates to countFn', async () => {
    ops.count.mockResolvedValue(5);

    const result = await repo.count({ name: 'A' });

    expect(result).toBe(5);
    expect(ops.count).toHaveBeenCalledWith({ name: 'A' });
  });
});
