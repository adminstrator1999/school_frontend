/**
 * Expenses API client
 */

import { apiClient } from "./index";
import type { Expense, ExpenseListResponse } from "@/types/api";

export interface CreateExpenseData {
  school_id: string;
  category_id: string;
  employee_id?: string | null;
  amount: number;
  description?: string | null;
  expense_date: string;
}

export interface UpdateExpenseData {
  category_id?: string;
  employee_id?: string | null;
  amount?: number;
  description?: string | null;
  expense_date?: string;
}

export interface ExpenseListParams {
  school_id?: string;
  category_id?: string;
  employee_id?: string;
  date_from?: string;
  date_to?: string;
  skip?: number;
  limit?: number;
}

export const expensesApi = {
  async getExpenses(token: string, params?: ExpenseListParams): Promise<ExpenseListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.school_id) searchParams.set("school_id", params.school_id);
    if (params?.category_id) searchParams.set("category_id", params.category_id);
    if (params?.employee_id) searchParams.set("employee_id", params.employee_id);
    if (params?.date_from) searchParams.set("date_from", params.date_from);
    if (params?.date_to) searchParams.set("date_to", params.date_to);
    if (params?.skip !== undefined) searchParams.set("skip", String(params.skip));
    if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    const url = query ? `/expenses?${query}` : "/expenses";
    return apiClient.get<ExpenseListResponse>(url, token);
  },

  async createExpense(token: string, data: CreateExpenseData): Promise<Expense> {
    return apiClient.post<Expense>("/expenses", data, token);
  },

  async getExpense(token: string, id: string): Promise<Expense> {
    return apiClient.get<Expense>(`/expenses/${id}`, token);
  },

  async updateExpense(token: string, id: string, data: UpdateExpenseData): Promise<Expense> {
    return apiClient.patch<Expense>(`/expenses/${id}`, data, token);
  },

  async deleteExpense(token: string, id: string): Promise<void> {
    return apiClient.delete<void>(`/expenses/${id}`, token);
  },
};
