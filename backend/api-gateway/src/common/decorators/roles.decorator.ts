import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  AGENT = 'agent',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
