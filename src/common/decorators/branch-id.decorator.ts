import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';

export const BranchId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const branchId = request.headers['x-branch-id'];

    if (!branchId) {
      throw new BadRequestException('x-branch-id header is required');
    }

    return String(branchId);
  },
);
