import { apiClient } from "./client";
import type { School } from "@/types/api";

export interface CreateSchoolData {
  name: string;
  address: string;
  phone: string;
  logo?: string;
}

export interface UpdateSchoolData {
  name?: string;
  address?: string | null;
  phone?: string | null;
  logo?: string | null;
  is_active?: boolean;
}

export const schoolsApi = {
  /**
   * Get all active schools (for owner/superuser roles)
   */
  async getSchools(token: string): Promise<School[]> {
    return apiClient.get<School[]>("/schools?is_active=true", token);
  },

  /**
   * Get a single school by ID
   */
  async getSchool(token: string, id: string): Promise<School> {
    return apiClient.get<School>(`/schools/${id}`, token);
  },

  /**
   * Create a new school
   */
  async createSchool(token: string, data: CreateSchoolData): Promise<School> {
    return apiClient.post<School>("/schools", data, token);
  },

  /**
   * Update a school
   */
  async updateSchool(token: string, id: string, data: UpdateSchoolData): Promise<School> {
    return apiClient.patch<School>(`/schools/${id}`, data, token);
  },

  /**
   * Delete a school
   */
  async deleteSchool(token: string, id: string): Promise<void> {
    return apiClient.delete<void>(`/schools/${id}`, token);
  },

  /**
   * Upload an image and return the URL
   */
  async uploadImage(token: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/uploads/image`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(error.detail || "Upload failed");
    }

    const data = await response.json();
    // Return full URL with backend base
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8000";
    return `${baseUrl}${data.url}`;
  },
};
