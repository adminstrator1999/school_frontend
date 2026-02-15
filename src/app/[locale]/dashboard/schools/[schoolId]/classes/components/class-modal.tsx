"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { classesApi, type CreateClassData, type UpdateClassData } from "@/lib/api/classes";
import type { SchoolClass } from "@/types/api";

import { Modal, Input, Label, Button } from "@/components/ui";

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schoolClass: SchoolClass | null;
  schoolId: string;
}

const formSchema = z.object({
  grade: z.coerce.number().min(0, "Required").max(11, "Max 11"),
  section: z.string().min(1, "Required").max(10, "Max 10 characters"),
});

type FormValues = z.infer<typeof formSchema>;

export function ClassModal({ isOpen, onClose, onSuccess, schoolClass, schoolId }: ClassModalProps) {
  const t = useTranslations("classes");
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
      grade: 1,
      section: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (schoolClass) {
        reset({
          grade: schoolClass.grade,
          section: schoolClass.section,
        });
      } else {
        reset({
          grade: 0,
          section: "",
        });
      }
      setError(null);
    }
  }, [isOpen, schoolClass, reset]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      setIsLoading(true);
      const token = await getAccessToken();
      if (!token) return;

      if (schoolClass) {
        const data: UpdateClassData = {
          grade: values.grade,
          section: values.section.toUpperCase(),
        };
        await classesApi.updateClass(token, schoolClass.id, data);
      } else {
        const data: CreateClassData = {
          school_id: schoolId,
          grade: values.grade,
          section: values.section.toUpperCase(),
        };
        await classesApi.createClass(token, data);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving class:", error);
      setError(schoolClass ? t("updateFailed") : t("createFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={schoolClass ? t("editClass") : t("addClass")}
      className="max-w-[500px]"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("grade")}</Label>
            <select
              {...register("grade")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {Array.from({ length: 12 }, (_, i) => i).map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            {errors.grade && (
              <p className="text-sm text-destructive">{errors.grade.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{t("section")}</Label>
            <Input
              {...register("section")}
              placeholder={t("sectionPlaceholder")}
              maxLength={10}
            />
            {errors.section && (
              <p className="text-sm text-destructive">{errors.section.message}</p>
            )}
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
