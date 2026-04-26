const mockModel = () => ({
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  groupBy: jest.fn(),
});

export type MockPrismaService = ReturnType<typeof createMockPrismaService>;

export const createMockPrismaService = () => {
  const mock = {
    user: mockModel(),
    order: mockModel(),
    orderItem: mockModel(),
    payment: mockModel(),
    ingredient: mockModel(),
    menuItemIngredient: mockModel(),
    menuItem: mockModel(),
    inventoryTransaction: mockModel(),
    shift: mockModel(),
    auditLog: mockModel(),
    $transaction: jest.fn((arg: unknown) => {
      if (typeof arg === 'function') {
        return (arg as (tx: any) => any)(mock);
      }
      return Promise.resolve(arg);
    }),
    $queryRawUnsafe: jest.fn().mockResolvedValue([]),
  };
  return mock;
};
