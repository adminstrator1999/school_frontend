"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { employeesApi } from "@/lib/api/employees";
import type { Employee } from "@/types/api";

import { Modal, Button } from "@/components/ui";

interface DeleteEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee | null;
}

export function DeleteEmployeeModal({ isOpen, onClose, onSuccess, employee }: DeleteEmployeeModalProps) {
  const t = useTranslations("employees");
  const tCommon = useTranslations("common");
  const { getAccessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!employee) return;

    setError(null);
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      if (!token) return;

      await employeesApi.deleteEmployee(token, employee.id);
      onSuccess();
    } catch (error) {
      console.error("Error deleting employee:", error);
      setError(t("createFailed")); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("deleteEmployee")}
      className="max-w-[400px]"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <p className="text-muted-foreground">
          {t("deleteConfirmation", { name: employee ? `${employee.first_name} ${employee.last_name}` : "" })}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {tCommon("cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tCommon("delete")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
