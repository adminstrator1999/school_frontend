"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { expensesApi } from "@/lib/api/expenses";
import type { Expense } from "@/types/api";

import { Modal, Button } from "@/components/ui";

interface DeleteExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expense: Expense;
}

export function DeleteExpenseModal({ isOpen, onClose, onSuccess, expense }: DeleteExpenseModalProps) {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const { getAccessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getAccessToken();
      if (!token) return;
      await expensesApi.deleteExpense(token, expense.id);
      onSuccess();
    } catch (error) {
      console.error("Error deleting expense:", error);
      setError(t("deleteFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tCommon("delete")}>
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {t("deleteConfirmation", {
            amount: new Intl.NumberFormat().format(expense.amount),
            category: expense.category.name,
          })}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {tCommon("cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? t("deleting") : tCommon("delete")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
