"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { employeesApi } from "@/lib/api/employees";
import type { Employee } from "@/types/api";
import { Button, Input } from "@/components/ui";
import { 
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  Pencil, // Changed from Edit to Pencil to match UsersPage
  Briefcase,
  DollarSign,
  Calendar
} from "lucide-react";
import { EmployeeModal } from "./components/employee-modal";
import { DeleteEmployeeModal } from "./components/delete-employee-modal";
import { PositionsModal } from "./components/positions-modal";

const ITEMS_PER_PAGE = 10;

interface EmployeesPageProps {
  params: Promise<{
    schoolId: string;
    locale: string;
  }>;
}

export default function EmployeesPage({ params }: EmployeesPageProps) {
  const { schoolId } = use(params);
  const t = useTranslations("employees");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { getAccessToken } = useAuth();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPositionsModalOpen, setIsPositionsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  const fetchEmployees = useCallback(async () => {
    if (!schoolId) return;
    
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      if (!token) return;

      const response = await employeesApi.getEmployees(token, {
        school_id: schoolId,
        skip: (page - 1) * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
        search: searchQuery || undefined
      });

      setEmployees(response.items);
      setTotal(response.total);
      setError(null);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, getAccessToken, page, searchQuery, tCommon]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsAddModalOpen(true);
  };

  const handleDelete = (employee: Employee) => {
    setDeletingEmployee(employee);
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setEditingEmployee(null);
  };

  const handleSuccess = () => {
    fetchEmployees();
    handleModalClose();
    setDeletingEmployee(null);
  };

  if (!schoolId) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">{tCommon("error")}</p>
      </div>
    );
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsPositionsModalOpen(true)}>
            <Briefcase className="mr-2 h-4 w-4" />
            {t("managePositions")}
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addEmployee")}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={tCommon("search") + "..."}
            className="pl-8 w-full md:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : employees.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground">
            {t("noEmployees")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("firstName")}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("position")}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("phone")}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t("salary")}</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                         <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                          {employee.first_name[0]}{employee.last_name[0]}
                        </div>
                        <div className="font-medium text-sm">
                          {employee.first_name} {employee.last_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Briefcase className="h-4 w-4" />
                        <span>{employee.position?.name || "-"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{employee.phone || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">
                        {new Intl.NumberFormat(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US").format(employee.salary)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(employee)}
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDelete(employee)}
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
            {t("showing")} {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, total)} {t("of")} {total}
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
      <EmployeeModal 
        isOpen={isAddModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        employee={editingEmployee}
        schoolId={schoolId}
      />
      
      <DeleteEmployeeModal
        isOpen={!!deletingEmployee}
        onClose={() => setDeletingEmployee(null)}
        onSuccess={handleSuccess}
        employee={deletingEmployee}
      />
      
      <PositionsModal 
        isOpen={isPositionsModalOpen} 
        onClose={() => setIsPositionsModalOpen(false)} 
        schoolId={schoolId} 
      />
    </div>
  );
}
