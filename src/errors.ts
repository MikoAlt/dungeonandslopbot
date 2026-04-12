export class NotFoundError extends Error {
  public readonly entity: string;
  public readonly id: string;

  constructor(entity: string, id: string) {
    super(`${entity} with id '${id}' not found`);
    this.name = 'NotFoundError';
    this.entity = entity;
    this.id = id;
  }
}

export class ValidationError extends Error {
  public readonly issues: ReadonlyArray<{ message: string; path?: string }>;

  constructor(issues: ReadonlyArray<{ message: string; path?: string }>) {
    super(issues.map((i) => i.message).join('; '));
    this.name = 'ValidationError';
    this.issues = issues;
  }
}
