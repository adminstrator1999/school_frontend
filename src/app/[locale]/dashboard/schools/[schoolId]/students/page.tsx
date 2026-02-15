"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { studentsApi } from "@/lib/api/students";
import { classesApi } from "@/lib/api/classes";
import type { Student, SchoolClass } from "@/types/api";
import { Plus, Pencil, Trash2, Search, Loader2, GraduationCap, Phone } from "lucide-react";

import { Button, Input } from "@/components/ui";

import { StudentModal } from "./components/student-modal";
import { DeleteStudentModal } from "./components/delete-student-modal";

interface StudentsPageProps {
  params: Promise<{ schoolId: string }>;
}

export default function StudentsPage({ params }: StudentsPageProps) {
  const { schoolId } = use(params);
  const t = useTranslations("students");
  const tCommon = useTranslations("common");
  const { getAccessToken } = useAuth();
  const searchParams = useSearchParams();

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>(searchParams.get("classId") || "");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      if (!token) return;

      const response = await studentsApi.getStudents(token, {
        school_id: schoolId,
        is_active: true,
        school_class_id: classFilter || undefined,
        search: search || undefined,
        skip: (page - 1) * limit,
        limit,
      });

      setStudents(response.items);
      setTotal(response.total);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, page, classFilter, search, getAccessToken]);

  const fetchClasses = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const response = await classesApi.getClasses(token, {
        school_id: schoolId,
        is_active: true,
        limit: 100,
      });
      setClasses(response.items);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  }, [schoolId, getAccessToken]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSuccess = () => {
    setIsAddModalOpen(false);
    setEditingStudent(null);
    fetchStudents();
  };

  const handleDeleteSuccess = () => {
    setDeletingStudent(null);
    fetchStudents();
  };

  // Find class name for a student
  const getClassName = (classId: string | null) => {
    if (!classId) return "-";
    const cls = classes.find((c) => c.id === classId);
    return cls ? cls.name : "-";
  };

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
          {t("addStudent")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <form
          onSubmit={(e) => { e.preventDefault(); fetchStudents(); }}
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
        <select
          value={classFilter}
          onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">{t("allClasses")}</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground">
            {t("noStudents")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("name")}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("class")}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("parentName")}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("parentPhone")}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("monthlyFee")}</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                          <GraduationCap className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {student.first_name} {student.last_name}
                          </div>
                          {student.phone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {student.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{getClassName(student.school_class_id)}</td>
                    <td className="px-4 py-3 text-sm">
                      {student.parent_first_name} {student.parent_last_name}
                    </td>
                    <td className="px-4 py-3 text-sm">{student.parent_phone_1}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {new Intl.NumberFormat().format(student.monthly_fee)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditingStudent(student)}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setDeletingStudent(student)}>
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
      <StudentModal
        isOpen={isAddModalOpen || !!editingStudent}
        onClose={() => { setIsAddModalOpen(false); setEditingStudent(null); }}
        onSuccess={handleSuccess}
        student={editingStudent}
        schoolId={schoolId}
        classes={classes}
      />

      {deletingStudent && (
        <DeleteStudentModal
          isOpen={!!deletingStudent}
          onClose={() => setDeletingStudent(null)}
          onSuccess={handleDeleteSuccess}
          student={deletingStudent}
        />
      )}
    </div>
  );
}
