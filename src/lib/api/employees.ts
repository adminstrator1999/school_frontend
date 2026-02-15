/**
 * Employees API client
 */

import { apiClient } from "./index";
import type { Employee, EmployeeListResponse } from "@/types/api";

export interface CreateEmployeeData {
  first_name: string;
  last_name: string;
  phone?: string | null;
  profile_picture?: string | null;
  position_id: string;
  salary: number;
  school_id: string;
}

export interface UpdateEmployeeData {
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  profile_picture?: string | null;
  position_id?: string;
  salary?: number;
  is_active?: boolean;
}

export interface EmployeeListParams {
  school_id?: string;
  position?: string;
  is_active?: boolean;
  skip?: number;
  limit?: number;
  search?: string;
}

export const employeesApi = {
  /**
   * Get list of employees with optional filters
   */
  async getEmployees(token: string, params?: EmployeeListParams): Promise<EmployeeListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.school_id) searchParams.set("school_id", params.school_id);
    if (params?.position) searchParams.set("position", params.position);
    if (params?.is_active !== undefined) searchParams.set("is_active", String(params.is_active));
    if (params?.skip !== undefined) searchParams.set("skip", String(params.skip));
    if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));
    if (params?.search) searchParams.set("search", params.search);

    const query = searchParams.toString();
    const url = query ? `/employees?${query}` : "/employees";
    return apiClient.get<EmployeeListResponse>(url, token);
  },

  /**
   * Create a new employee
   */
  async createEmployee(token: string, data: CreateEmployeeData): Promise<Employee> {
    return apiClient.post<Employee>("/employees", data, token);
  },

  /**
   * Get a specific employee by ID
   */
  async getEmployee(token: string, id: string): Promise<Employee> {
    return apiClient.get<Employee>(`/employees/${id}`, token);
  },

  /**
   * Update an employee
   */
  async updateEmployee(token: string, id: string, data: UpdateEmployeeData): Promise<Employee> {
    return apiClient.patch<Employee>(`/employees/${id}`, data, token);
  },

  /**
   * Delete (deactivate) an employee
   */
  async deleteEmployee(token: string, id: string): Promise<void> {
    return apiClient.delete<void>(`/employees/${id}`, token);
  },
};
