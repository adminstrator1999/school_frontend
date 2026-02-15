/**
 * Classes API client
 */

import { apiClient } from "./index";
import type { SchoolClass, SchoolClassListResponse } from "@/types/api";

export interface CreateClassData {
  school_id: string;
  grade: number;
  section: string;
  homeroom_teacher_id?: string | null;
}

export interface UpdateClassData {
  grade?: number;
  section?: string;
  homeroom_teacher_id?: string | null;
  is_active?: boolean;
}

export interface ClassListParams {
  school_id?: string;
  grade?: number;
  is_active?: boolean;
  skip?: number;
  limit?: number;
}

export const classesApi = {
  /**
   * Get list of classes with optional filters
   */
  async getClasses(token: string, params?: ClassListParams): Promise<SchoolClassListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.school_id) searchParams.set("school_id", params.school_id);
    if (params?.grade !== undefined) searchParams.set("grade", String(params.grade));
    if (params?.is_active !== undefined) searchParams.set("is_active", String(params.is_active));
    if (params?.skip !== undefined) searchParams.set("skip", String(params.skip));
    if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    const url = query ? `/classes?${query}` : "/classes";
    return apiClient.get<SchoolClassListResponse>(url, token);
  },

  /**
   * Create a new class
   */
  async createClass(token: string, data: CreateClassData): Promise<SchoolClass> {
    return apiClient.post<SchoolClass>("/classes", data, token);
  },

  /**
   * Get a specific class by ID
   */
  async getClass(token: string, id: string): Promise<SchoolClass> {
    return apiClient.get<SchoolClass>(`/classes/${id}`, token);
  },

  /**
   * Update a class
   */
  async updateClass(token: string, id: string, data: UpdateClassData): Promise<SchoolClass> {
    return apiClient.patch<SchoolClass>(`/classes/${id}`, data, token);
  },

  /**
   * Delete (deactivate) a class
   */
  async deleteClass(token: string, id: string): Promise<void> {
    return apiClient.delete<void>(`/classes/${id}`, token);
  },
};
