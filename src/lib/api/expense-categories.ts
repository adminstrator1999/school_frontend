/**
 * Expense Categories API client
 */

import { apiClient } from "./index";
import type { ExpenseCategory, ExpenseCategoryListResponse } from "@/types/api";

export interface CreateExpenseCategoryData {
  school_id: string;
  name: string;
}

export interface UpdateExpenseCategoryData {
  name?: string;
}

export interface ExpenseCategoryListParams {
  school_id?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

export const expenseCategoriesApi = {
  async getCategories(token: string, params?: ExpenseCategoryListParams): Promise<ExpenseCategoryListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.school_id) searchParams.set("school_id", params.school_id);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.skip !== undefined) searchParams.set("skip", String(params.skip));
    if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    const url = query ? `/expense-categories?${query}` : "/expense-categories";
    return apiClient.get<ExpenseCategoryListResponse>(url, token);
  },

  async createCategory(token: string, data: CreateExpenseCategoryData): Promise<ExpenseCategory> {
    return apiClient.post<ExpenseCategory>("/expense-categories", data, token);
  },

  async updateCategory(token: string, id: string, data: UpdateExpenseCategoryData): Promise<ExpenseCategory> {
    return apiClient.patch<ExpenseCategory>(`/expense-categories/${id}`, data, token);
  },

  async deleteCategory(token: string, id: string): Promise<void> {
    return apiClient.delete<void>(`/expense-categories/${id}`, token);
  },
};
