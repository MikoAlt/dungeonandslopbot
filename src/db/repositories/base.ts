import { PrismaClient } from '../../generated/prisma/client.js';

export class BaseRepository<T> {
  protected prisma: PrismaClient;

  private findUniqueFn: (id: string) => Promise<T | null>;
  private findManyFn: (args?: {
    where?: unknown;
    skip?: number;
    take?: number;
    orderBy?: unknown;
  }) => Promise<T[]>;
  private createFn: (data: unknown) => Promise<T>;
  private updateFn: (id: string, data: unknown) => Promise<T>;
  private deleteFn: (id: string) => Promise<T>;
  private countFn: (where?: unknown) => Promise<number>;

  constructor(
    prisma: PrismaClient,
    operations: {
      findUnique: (id: string) => Promise<T | null>;
      findMany: (args?: {
        where?: unknown;
        skip?: number;
        take?: number;
        orderBy?: unknown;
      }) => Promise<T[]>;
      create: (data: unknown) => Promise<T>;
      update: (id: string, data: unknown) => Promise<T>;
      delete: (id: string) => Promise<T>;
      count: (where?: unknown) => Promise<number>;
    },
  ) {
    this.prisma = prisma;
    this.findUniqueFn = operations.findUnique;
    this.findManyFn = operations.findMany;
    this.createFn = operations.create;
    this.updateFn = operations.update;
    this.deleteFn = operations.delete;
    this.countFn = operations.count;
  }

  async findById(id: string): Promise<T | null> {
    return this.findUniqueFn(id);
  }

  async create(data: unknown): Promise<T> {
    return this.createFn(data);
  }

  async update(id: string, data: unknown): Promise<T> {
    return this.updateFn(id, data);
  }

  async delete(id: string): Promise<T> {
    return this.deleteFn(id);
  }

  async list(filter?: unknown, skip?: number, take?: number): Promise<T[]> {
    return this.findManyFn({ where: filter, skip, take });
  }

  async count(filter?: unknown): Promise<number> {
    return this.countFn(filter);
  }
}
