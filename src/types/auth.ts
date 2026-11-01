/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
}

export interface SavedAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  token: string;
  lastActive: number;
}

export type AuthMode = 'login' | 'register' | 'switch_account';
