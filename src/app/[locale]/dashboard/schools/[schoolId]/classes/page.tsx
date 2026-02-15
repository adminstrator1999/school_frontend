"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { classesApi } from "@/lib/api/classes";
import type { SchoolClass } from "@/types/api";
import { Plus, Pencil, Trash2, Search, Loader2, BookOpen } from "lucide-react";

import { Button, Input } from "@/components/ui";

import { ClassModal } from "./components/class-modal";
import { DeleteClassModal } from "./components/delete-class-modal";

interface ClassesPageProps {
  params: Promise<{ schoolId: string }>;
}

export default function ClassesPage({ params }: ClassesPageProps) {
  const { schoolId } = use(params);
  const t = useTranslations("classes");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { getAccessToken } = useAuth();

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [deletingClass, setDeletingClass] = useState<SchoolClass | null>(null);

  const fetchClasses = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      if (!token) return;

      const response = await classesApi.getClasses(token, {
        school_id: schoolId,
        is_active: true,
        skip: (page - 1) * limit,
        limit,
      });

      setClasses(response.items);
      setTotalPages(Math.ceil(response.total / limit));
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, page, getAccessToken]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleEdit = (schoolClass: SchoolClass) => {
    setEditingClass(schoolClass);
  };

  const handleDelete = (schoolClass: SchoolClass) => {
    setDeletingClass(schoolClass);
  };

  const handleSuccess = () => {
    setIsAddModalOpen(false);
    setEditingClass(null);
    fetchClasses();
  };

  const handleDeleteSuccess = () => {
    setDeletingClass(null);
    fetchClasses();
  };

  // Filter classes locally by search
  const filteredClasses = search
    ? classes.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.section.toLowerCase().includes(search.toLowerCase()) ||
          String(c.grade).includes(search)
      )
    : classes;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addClass")}
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="relative flex-1 max-w-sm"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tCommon("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </form>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground">
            {t("noClasses")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("className")}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("grade")}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("section")}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("status")}</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredClasses.map((schoolClass) => (
                  <tr key={schoolClass.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div className="font-medium text-sm">
                          {schoolClass.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{schoolClass.grade}</td>
                    <td className="px-4 py-3 text-sm">{schoolClass.section}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        schoolClass.is_active
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-500"
                      }`}>
                        {schoolClass.is_active ? t("active") : t("inactive")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(schoolClass)}
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDelete(schoolClass)}
                        >
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
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            {tCommon("back")}
          </Button>
          <div className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
          >
            {tCommon("next")}
          </Button>
        </div>
      )}

      {/* Modals */}
      <ClassModal
        isOpen={isAddModalOpen || !!editingClass}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingClass(null);
        }}
        onSuccess={handleSuccess}
        schoolClass={editingClass}
        schoolId={schoolId}
      />

      {deletingClass && (
        <DeleteClassModal
          isOpen={!!deletingClass}
          onClose={() => setDeletingClass(null)}
          onSuccess={handleDeleteSuccess}
          schoolClass={deletingClass}
        />
      )}
    </div>
  );
}
