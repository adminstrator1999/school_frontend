/**
 * Students API client
 */

import { apiClient } from "./index";
import type { Student, StudentListResponse } from "@/types/api";

export interface CreateStudentData {
  school_id: string;
  school_class_id?: string | null;
  first_name: string;
  last_name: string;
  phone?: string | null;
  profile_picture?: string | null;
  parent_first_name: string;
  parent_last_name: string;
  parent_phone_1: string;
  parent_phone_2?: string | null;
  monthly_fee: number;
  payment_day: number;
  enrolled_at: string;
}

export interface UpdateStudentData {
  school_class_id?: string | null;
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  profile_picture?: string | null;
  parent_first_name?: string;
  parent_last_name?: string;
  parent_phone_1?: string;
  parent_phone_2?: string | null;
  monthly_fee?: number;
  payment_day?: number;
  graduated_at?: string | null;
  is_active?: boolean;
}

export interface StudentListParams {
  school_id?: string;
  school_class_id?: string;
  is_active?: boolean;
  graduated?: boolean;
  search?: string;
  skip?: number;
  limit?: number;
}

export const studentsApi = {
  async getStudents(token: string, params?: StudentListParams): Promise<StudentListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.school_id) searchParams.set("school_id", params.school_id);
    if (params?.school_class_id) searchParams.set("school_class_id", params.school_class_id);
    if (params?.is_active !== undefined) searchParams.set("is_active", String(params.is_active));
    if (params?.graduated !== undefined) searchParams.set("graduated", String(params.graduated));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.skip !== undefined) searchParams.set("skip", String(params.skip));
    if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    const url = query ? `/students?${query}` : "/students";
    return apiClient.get<StudentListResponse>(url, token);
  },

  async createStudent(token: string, data: CreateStudentData): Promise<Student> {
    return apiClient.post<Student>("/students", data, token);
  },

  async getStudent(token: string, id: string): Promise<Student> {
    return apiClient.get<Student>(`/students/${id}`, token);
  },

  async updateStudent(token: string, id: string, data: UpdateStudentData): Promise<Student> {
    return apiClient.patch<Student>(`/students/${id}`, data, token);
  },

  async deleteStudent(token: string, id: string): Promise<void> {
    return apiClient.delete<void>(`/students/${id}`, token);
  },
};
