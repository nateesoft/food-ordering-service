import { SetMetadata } from '@nestjs/common';

export const CONSOLE_ROLES_KEY = 'console_roles';
export const ConsoleRoles = (...roles: string[]) => SetMetadata(CONSOLE_ROLES_KEY, roles);
