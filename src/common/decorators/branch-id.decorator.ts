import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

export const BranchId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    const branchId = request.headers['x-branch-id'];

    if (!branchId) {
      throw new BadRequestException('x-branch-id header is required');
    }

    const parsed = parseInt(branchId, 10);
    if (isNaN(parsed)) {
      throw new BadRequestException('x-branch-id must be a valid integer');
    }

    return parsed;
  },
);
