"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Pencil, Trash2, Lock } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { expenseCategoriesApi } from "@/lib/api/expense-categories";
import type { ExpenseCategory } from "@/types/api";

import { Modal, Input, Button } from "@/components/ui";

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schoolId: string;
  categories: ExpenseCategory[];
}

export function CategoriesModal({ isOpen, onClose, onSuccess, schoolId, categories }: CategoriesModalProps) {
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const { getAccessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      setIsLoading(true);
      setError(null);
      const token = await getAccessToken();
      if (!token) return;
      await expenseCategoriesApi.createCategory(token, {
        school_id: schoolId,
        name: newName.trim(),
      });
      setNewName("");
      onSuccess();
    } catch (error) {
      console.error("Error creating category:", error);
      setError(t("categoryCreateFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      setIsLoading(true);
      setError(null);
      const token = await getAccessToken();
      if (!token) return;
      await expenseCategoriesApi.updateCategory(token, id, { name: editingName.trim() });
      setEditingId(null);
      setEditingName("");
      onSuccess();
    } catch (error) {
      console.error("Error updating category:", error);
      setError(t("categoryUpdateFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getAccessToken();
      if (!token) return;
      await expenseCategoriesApi.deleteCategory(token, id);
      onSuccess();
    } catch (err: unknown) {
      console.error("Error deleting category:", err);
      const message = err instanceof Error ? err.message : t("categoryDeleteFailed");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (category: ExpenseCategory) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("manageCategories")} className="max-w-[500px]">
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Add new category */}
        <div className="flex items-center gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("categoryNamePlaceholder")}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
            className="flex-1"
          />
          <Button size="sm" onClick={handleAdd} disabled={isLoading || !newName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Categories list */}
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden max-h-[400px] overflow-y-auto">
          {categories.length === 0 ? (
            <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">
              {t("noCategories")}
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors">
                {editingId === category.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); handleUpdate(category.id); }
                        if (e.key === "Escape") cancelEditing();
                      }}
                      className="flex-1 h-8 text-sm"
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => handleUpdate(category.id)} disabled={isLoading}>
                      {tCommon("save")}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={cancelEditing}>
                      {tCommon("cancel")}
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{category.name}</span>
                      {category.is_system && (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    {!category.is_system && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEditing(category)} disabled={isLoading}>
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDelete(category.id)} disabled={isLoading}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
