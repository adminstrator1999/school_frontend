"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { expensesApi, type CreateExpenseData, type UpdateExpenseData } from "@/lib/api/expenses";
import type { Expense, ExpenseCategory, Employee } from "@/types/api";

import { Modal, Input, Label, Button } from "@/components/ui";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expense: Expense | null;
  schoolId: string;
  categories: ExpenseCategory[];
  employees: Employee[];
}

const formSchema = z.object({
  category_id: z.string().min(1, "Required"),
  amount: z.coerce.number().min(0.01, "Required"),
  description: z.string().optional(),
  expense_date: z.string().min(1, "Required"),
  employee_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ExpenseModal({ isOpen, onClose, onSuccess, expense, schoolId, categories, employees }: ExpenseModalProps) {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const { getAccessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category_id: "",
      amount: 0,
      description: "",
      expense_date: new Date().toISOString().split("T")[0],
      employee_id: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        reset({
          category_id: expense.category_id,
          amount: expense.amount,
          description: expense.description || "",
          expense_date: expense.expense_date,
          employee_id: expense.employee_id || "",
        });
      } else {
        reset({
          category_id: "",
          amount: 0,
          description: "",
          expense_date: new Date().toISOString().split("T")[0],
          employee_id: "",
        });
      }
      setError(null);
    }
  }, [isOpen, expense, reset]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      if (!token) return;

      if (expense) {
        const data: UpdateExpenseData = {
          category_id: values.category_id,
          amount: values.amount,
          description: values.description || null,
          expense_date: values.expense_date,
          employee_id: values.employee_id || null,
        };
        await expensesApi.updateExpense(token, expense.id, data);
      } else {
        const data: CreateExpenseData = {
          school_id: schoolId,
          category_id: values.category_id,
          amount: values.amount,
          description: values.description || null,
          expense_date: values.expense_date,
          employee_id: values.employee_id || null,
        };
        await expensesApi.createExpense(token, data);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving expense:", error);
      setError(expense ? t("updateFailed") : t("createFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expense ? t("editExpense") : t("addExpense")}
      className="max-w-[500px]"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label>{t("category")}</Label>
          <select
            {...register("category_id")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">{t("selectCategory")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.category_id && <p className="text-sm text-destructive">{errors.category_id.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("amount")}</Label>
            <Input {...register("amount")} type="number" min="0" step="0.01" />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t("date")}</Label>
            <Input {...register("expense_date")} type="date" />
            {errors.expense_date && <p className="text-sm text-destructive">{errors.expense_date.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("descriptionLabel")}</Label>
          <textarea
            {...register("description")}
            placeholder={t("descriptionPlaceholder")}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label>{t("employee")} <span className="text-muted-foreground text-xs">({t("optional")})</span></Label>
          <select
            {...register("employee_id")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">{t("noEmployee")}</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            {tCommon("cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tCommon("save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
