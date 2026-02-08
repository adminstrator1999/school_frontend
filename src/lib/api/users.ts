/**
 * Users API client
 */

import { apiClient } from "./index";
import type { User } from "@/types/api";

export type UserRole = "owner" | "superuser" | "director" | "shareholder" | "accountant" | "staff";

export interface CreateUserData {
  phone_number: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  school_id?: string | null;
  profile_picture?: string | null;
  language?: "en" | "uz" | "ru";
  theme?: "light" | "dark";
}

export interface UpdateUserData {
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  school_id?: string | null;
  profile_picture?: string | null;
  is_active?: boolean;
  language?: "en" | "uz" | "ru";
  theme?: "light" | "dark";
}

export interface UserListResponse {
  items: User[];
  total: number;
  skip: number;
  limit: number;
}

export interface UserListParams {
  school_id?: string;
  role?: UserRole;
  is_active?: boolean;
  skip?: number;
  limit?: number;
}

/**
 * Role hierarchy - defines which roles each role can create
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  owner: ["superuser", "director", "shareholder", "accountant", "staff"],
  superuser: ["director", "shareholder", "accountant", "staff"],
  director: ["accountant", "staff"],
  shareholder: ["director", "accountant", "staff"],
  accountant: [],
  staff: [],
};

/**
 * Get roles that the current user can create
 */
export function getCreatableRoles(currentUserRole: UserRole): UserRole[] {
  return ROLE_HIERARCHY[currentUserRole] || [];
}

/**
 * Role display names for UI
 */
export const ROLE_LABELS: Record<UserRole, { en: string; ru: string; uz: string }> = {
  owner: { en: "Owner", ru: "Владелец", uz: "Egasi" },
  superuser: { en: "Superuser", ru: "Суперпользователь", uz: "Superfoydalanuvchi" },
  director: { en: "Director", ru: "Директор", uz: "Direktor" },
  shareholder: { en: "Shareholder", ru: "Акционер", uz: "Aksioner" },
  accountant: { en: "Accountant", ru: "Бухгалтер", uz: "Buxgalter" },
  staff: { en: "Staff", ru: "Сотрудник", uz: "Xodim" },
};

/**
 * Roles that can be edited/deleted by each role
 * Different from ROLE_HIERARCHY (creation permissions)
 * - Director: Can manage accountant, staff (NOT shareholder)
 * - Shareholder: Can manage director, accountant, staff
 * - Accountant/Staff: Cannot manage anyone
 */
export const MANAGEABLE_ROLES: Record<UserRole, UserRole[]> = {
  owner: ["superuser", "director", "shareholder", "accountant", "staff"],
  superuser: ["director", "shareholder", "accountant", "staff"],
  director: ["accountant", "staff"], // Cannot manage shareholder
  shareholder: ["director", "accountant", "staff"], // Can manage director
  accountant: [],
  staff: [],
};

/**
 * Check if a user can manage (edit/delete) another user
 */
export function canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
  return MANAGEABLE_ROLES[managerRole]?.includes(targetRole) ?? false;
}

/**
 * Roles that can access the users management page
 */
export const ROLES_WITH_USER_ACCESS: UserRole[] = ["owner", "superuser", "director", "shareholder"];

/**
 * Check if a role can access users management
 */
export function canAccessUsersPage(role: UserRole): boolean {
  return ROLES_WITH_USER_ACCESS.includes(role);
}

export const usersApi = {
  /**
   * Get list of users with optional filters
   */
  async getUsers(token: string, params?: UserListParams): Promise<UserListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.school_id) searchParams.set("school_id", params.school_id);
    if (params?.role) searchParams.set("role", params.role);
    if (params?.is_active !== undefined) searchParams.set("is_active", String(params.is_active));
    if (params?.skip !== undefined) searchParams.set("skip", String(params.skip));
    if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    const url = query ? `/users?${query}` : "/users";
    return apiClient.get<UserListResponse>(url, token);
  },

  /**
   * Create a new user
   */
  async createUser(token: string, data: CreateUserData): Promise<User> {
    return apiClient.post<User>("/users", data, token);
  },

  /**
   * Get a specific user by ID
   */
  async getUser(token: string, id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`, token);
  },

  /**
   * Update a user
   */
  async updateUser(token: string, id: string, data: UpdateUserData): Promise<User> {
    return apiClient.patch<User>(`/users/${id}`, data, token);
  },

  /**
   * Delete (deactivate) a user
   */
  async deleteUser(token: string, id: string): Promise<void> {
    return apiClient.delete<void>(`/users/${id}`, token);
  },
};
