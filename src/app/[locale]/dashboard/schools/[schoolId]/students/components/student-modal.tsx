"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { studentsApi, type CreateStudentData, type UpdateStudentData } from "@/lib/api/students";
import type { Student, SchoolClass } from "@/types/api";

import { Modal, Input, Label, Button } from "@/components/ui";

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  student: Student | null;
  schoolId: string;
  classes: SchoolClass[];
}

const formSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  phone: z.string().optional(),
  school_class_id: z.string().optional(),
  parent_first_name: z.string().min(1, "Required"),
  parent_last_name: z.string().min(1, "Required"),
  parent_phone_1: z.string().min(1, "Required"),
  parent_phone_2: z.string().optional(),
  monthly_fee: z.coerce.number().min(0.01, "Required"),
  payment_day: z.coerce.number().min(1).max(28),
  enrolled_at: z.string().min(1, "Required"),
});

type FormValues = z.infer<typeof formSchema>;

export function StudentModal({ isOpen, onClose, onSuccess, student, schoolId, classes }: StudentModalProps) {
  const t = useTranslations("students");
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
      first_name: "",
      last_name: "",
      phone: "",
      school_class_id: "",
      parent_first_name: "",
      parent_last_name: "",
      parent_phone_1: "",
      parent_phone_2: "",
      monthly_fee: 0,
      payment_day: 5,
      enrolled_at: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (student) {
        reset({
          first_name: student.first_name,
          last_name: student.last_name,
          phone: student.phone || "",
          school_class_id: student.school_class_id || "",
          parent_first_name: student.parent_first_name,
          parent_last_name: student.parent_last_name,
          parent_phone_1: student.parent_phone_1,
          parent_phone_2: student.parent_phone_2 || "",
          monthly_fee: student.monthly_fee,
          payment_day: student.payment_day,
          enrolled_at: student.enrolled_at,
        });
      } else {
        reset({
          first_name: "",
          last_name: "",
          phone: "",
          school_class_id: "",
          parent_first_name: "",
          parent_last_name: "",
          parent_phone_1: "",
          parent_phone_2: "",
          monthly_fee: 0,
          payment_day: 5,
          enrolled_at: new Date().toISOString().split("T")[0],
        });
      }
      setError(null);
    }
  }, [isOpen, student, reset]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      if (!token) return;

      if (student) {
        const data: UpdateStudentData = {
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone || null,
          school_class_id: values.school_class_id || null,
          parent_first_name: values.parent_first_name,
          parent_last_name: values.parent_last_name,
          parent_phone_1: values.parent_phone_1,
          parent_phone_2: values.parent_phone_2 || null,
          monthly_fee: values.monthly_fee,
          payment_day: values.payment_day,
        };
        await studentsApi.updateStudent(token, student.id, data);
      } else {
        const data: CreateStudentData = {
          school_id: schoolId,
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone || null,
          school_class_id: values.school_class_id || null,
          parent_first_name: values.parent_first_name,
          parent_last_name: values.parent_last_name,
          parent_phone_1: values.parent_phone_1,
          parent_phone_2: values.parent_phone_2 || null,
          monthly_fee: values.monthly_fee,
          payment_day: values.payment_day,
          enrolled_at: values.enrolled_at,
        };
        await studentsApi.createStudent(token, data);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving student:", error);
      setError(student ? t("updateFailed") : t("createFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={student ? t("editStudent") : t("addStudent")}
      className="max-w-[600px]"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Student Info */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t("studentInfo")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("firstName")}</Label>
              <Input {...register("first_name")} placeholder={t("firstNamePlaceholder")} />
              {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("lastName")}</Label>
              <Input {...register("last_name")} placeholder={t("lastNamePlaceholder")} />
              {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("phone")}</Label>
              <Input {...register("phone")} placeholder="+998..." />
            </div>
            <div className="space-y-2">
              <Label>{t("class")}</Label>
              <select
                {...register("school_class_id")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">{t("noClass")}</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("monthlyFee")}</Label>
              <Input {...register("monthly_fee")} type="number" min="0" step="0.01" />
              {errors.monthly_fee && <p className="text-sm text-destructive">{errors.monthly_fee.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("paymentDay")}</Label>
              <Input {...register("payment_day")} type="number" min="1" max="28" />
              {errors.payment_day && <p className="text-sm text-destructive">{errors.payment_day.message}</p>}
            </div>
            {!student && (
              <div className="space-y-2">
                <Label>{t("enrolledAt")}</Label>
                <Input {...register("enrolled_at")} type="date" />
                {errors.enrolled_at && <p className="text-sm text-destructive">{errors.enrolled_at.message}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Parent Info */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t("parentInfo")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("parentFirstName")}</Label>
              <Input {...register("parent_first_name")} placeholder={t("firstNamePlaceholder")} />
              {errors.parent_first_name && <p className="text-sm text-destructive">{errors.parent_first_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("parentLastName")}</Label>
              <Input {...register("parent_last_name")} placeholder={t("lastNamePlaceholder")} />
              {errors.parent_last_name && <p className="text-sm text-destructive">{errors.parent_last_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("parentPhone")} 1</Label>
              <Input {...register("parent_phone_1")} placeholder="+998..." />
              {errors.parent_phone_1 && <p className="text-sm text-destructive">{errors.parent_phone_1.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>{t("parentPhone")} 2</Label>
              <Input {...register("parent_phone_2")} placeholder="+998..." />
            </div>
          </div>
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
