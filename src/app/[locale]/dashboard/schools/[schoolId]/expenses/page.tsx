"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { expensesApi } from "@/lib/api/expenses";
import { expenseCategoriesApi } from "@/lib/api/expense-categories";
import { employeesApi } from "@/lib/api/employees";
import type { Expense, ExpenseCategory, Employee } from "@/types/api";
import { Plus, Pencil, Trash2, Loader2, Receipt, Settings, Calendar } from "lucide-react";

import { Button, Input } from "@/components/ui";

import { ExpenseModal } from "./components/expense-modal";
import { DeleteExpenseModal } from "./components/delete-expense-modal";
import { CategoriesModal } from "./components/categories-modal";

interface ExpensesPageProps {
  params: Promise<{ schoolId: string }>;
}

export default function ExpensesPage({ params }: ExpensesPageProps) {
  const { schoolId } = use(params);
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const { getAccessToken } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      if (!token) return;

      const response = await expensesApi.getExpenses(token, {
        school_id: schoolId,
        category_id: categoryFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        skip: (page - 1) * limit,
        limit,
      });

      setExpenses(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, page, categoryFilter, dateFrom, dateTo, getAccessToken]);

  const fetchCategories = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const response = await expenseCategoriesApi.getCategories(token, {
        school_id: schoolId,
        limit: 100,
      });
      setCategories(response.items);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, [schoolId, getAccessToken]);

  const fetchEmployees = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const response = await employeesApi.getEmployees(token, {
        school_id: schoolId,
        is_active: true,
        limit: 100,
      });
      setEmployees(response.items);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  }, [schoolId, getAccessToken]);

  useEffect(() => { fetchCategories(); fetchEmployees(); }, [fetchCategories, fetchEmployees]);
  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleSuccess = () => {
    setIsAddModalOpen(false);
    setEditingExpense(null);
    fetchExpenses();
  };

  const handleDeleteSuccess = () => {
    setDeletingExpense(null);
    fetchExpenses();
  };

  const handleCategoriesChange = () => {
    fetchCategories();
    fetchExpenses();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsCategoriesModalOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            {t("manageCategories")}
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addExpense")}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">{t("allCategories")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="w-40"
            placeholder={t("from")}
          />
          <span className="text-muted-foreground">—</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="w-40"
            placeholder={t("to")}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground">
            {t("noExpenses")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("date")}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("category")}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("amount")}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("descriptionLabel")}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("employee")}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("createdBy")}</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm">{formatDate(expense.expense_date)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {expense.category.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {new Intl.NumberFormat().format(expense.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                      {expense.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {expense.employee
                        ? `${expense.employee.first_name} ${expense.employee.last_name}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {expense.created_by.first_name} {expense.created_by.last_name}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditingExpense(expense)}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDeletingExpense(expense)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-muted-foreground">
            {t("showing")} {(page - 1) * limit + 1}–{Math.min(page * limit, total)} {t("of")} {total}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || isLoading}>
              {tCommon("back")}
            </Button>
            <div className="text-sm text-muted-foreground">{page} / {totalPages}</div>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || isLoading}>
              {tCommon("next")}
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ExpenseModal
        isOpen={isAddModalOpen || !!editingExpense}
        onClose={() => { setIsAddModalOpen(false); setEditingExpense(null); }}
        onSuccess={handleSuccess}
        expense={editingExpense}
        schoolId={schoolId}
        categories={categories}
        employees={employees}
      />

      {deletingExpense && (
        <DeleteExpenseModal
          isOpen={!!deletingExpense}
          onClose={() => setDeletingExpense(null)}
          onSuccess={handleDeleteSuccess}
          expense={deletingExpense}
        />
      )}

      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        onSuccess={handleCategoriesChange}
        schoolId={schoolId}
        categories={categories}
      />
    </div>
  );
}
