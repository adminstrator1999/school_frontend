"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { classesApi } from "@/lib/api/classes";
import type { SchoolClass } from "@/types/api";

import { Modal, Button } from "@/components/ui";

interface DeleteClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schoolClass: SchoolClass;
}

export function DeleteClassModal({ isOpen, onClose, onSuccess, schoolClass }: DeleteClassModalProps) {
  const t = useTranslations("classes");
  const tCommon = useTranslations("common");
  const { getAccessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      if (!token) return;

      await classesApi.deleteClass(token, schoolClass.id);
      onSuccess();
    } catch (error) {
      console.error("Error deleting class:", error);
      setError(t("deleteFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("deleteClass")}
      className="max-w-[450px]"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {t("deleteConfirmation", { name: schoolClass.name })}
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
