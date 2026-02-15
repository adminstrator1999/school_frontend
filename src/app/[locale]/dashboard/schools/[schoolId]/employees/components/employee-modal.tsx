"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { employeesApi, type CreateEmployeeData, type UpdateEmployeeData } from "@/lib/api/employees";
import { positionsApi } from "@/lib/api/positions";
import type { Employee, Position } from "@/types/api";

import { Modal, Input, Label, Button } from "@/components/ui";

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee | null;
  schoolId: string;
}

const formSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  phone: z.string().optional(),
  position_id: z.string().min(1, "Required"),
  salary: z.coerce.number().min(0, "Required"),
});

type FormValues = z.infer<typeof formSchema>;

export function EmployeeModal({ isOpen, onClose, onSuccess, employee, schoolId }: EmployeeModalProps) {
  const t = useTranslations("employees");
  const tCommon = useTranslations("common");
  const { getAccessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      position_id: "",
      salary: 0,
    },
  });

  const fetchPositions = useCallback(async () => {
    if (!schoolId || !isOpen) return;
    
    try {
      setLoadingPositions(true);
      const token = await getAccessToken();
      if (!token) return;

      const response = await positionsApi.getPositions(token, schoolId);
      setPositions(response.items);
    } catch (error) {
      console.error("Error fetching positions:", error);
    } finally {
      setLoadingPositions(false);
    }
  }, [schoolId, isOpen, getAccessToken]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  useEffect(() => {
    if (isOpen) {
      if (employee) {
        reset({
          first_name: employee.first_name,
          last_name: employee.last_name,
          phone: employee.phone || "",
          position_id: employee.position_id,
          salary: employee.salary,
        });
      } else {
        reset({
          first_name: "",
          last_name: "",
          phone: "",
          position_id: "",
          salary: 0,
        });
      }
      setError(null);
    }
  }, [isOpen, employee, reset]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      if (!token) return;

      const data = {
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone || null,
        position_id: values.position_id,
        salary: Number(values.salary),
        school_id: schoolId,
      };

      if (employee) {
        await employeesApi.updateEmployee(token, employee.id, data as UpdateEmployeeData);
      } else {
        await employeesApi.createEmployee(token, data as CreateEmployeeData);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving employee:", error);
      setError(employee ? t("updateFailed") : t("createFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employee ? t("editEmployee") : t("addEmployee")}
      className="max-w-[600px]"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("firstName")}</Label>
            <Input {...register("first_name")} placeholder={t("firstName")} />
            {errors.first_name && (
              <p className="text-sm text-destructive">{errors.first_name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t("lastName")}</Label>
            <Input {...register("last_name")} placeholder={t("lastName")} />
            {errors.last_name && (
              <p className="text-sm text-destructive">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("phone")}</Label>
            <Input {...register("phone")} placeholder="+998901234567" />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t("salary")}</Label>
            <Input 
              {...register("salary")} 
              type="number" 
              placeholder={t("salary")} 
            />
            {errors.salary && (
              <p className="text-sm text-destructive">{errors.salary.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("position")}</Label>
          {loadingPositions ? (
               <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground flex items-center">
                  Loading...
               </div>
          ) : (
              <select
              {...register("position_id")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
              <option value="">{t("selectPosition")}</option>
              {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                  {p.name}
                  </option>
              ))}
              </select>
          )}
          {errors.position_id && (
            <p className="text-sm text-destructive">{errors.position_id.message}</p>
          )}
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
