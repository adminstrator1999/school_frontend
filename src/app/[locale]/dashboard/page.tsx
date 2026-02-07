"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { schoolsApi, type CreateSchoolData, type UpdateSchoolData } from "@/lib/api/schools";
import type { School } from "@/types/api";
import { School as SchoolIcon, MapPin, Phone, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { Button, Modal, Input, Label, ImageUpload } from "@/components/ui";

export default function DashboardPage() {
  const t = useTranslations("schools");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { user, getAccessToken, isLoading: authLoading } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add/Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState<CreateSchoolData>({
    name: "",
    address: "",
    phone: "",
    logo: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnerOrSuperuser = user?.role === "owner" || user?.role === "superuser";

  useEffect(() => {
    // Redirect non-owner/superuser to their school
    if (!authLoading && user && !isOwnerOrSuperuser) {
      if (user.school_id) {
        router.push(`/${locale}/dashboard/schools/${user.school_id}`);
      }
    }
  }, [authLoading, user, isOwnerOrSuperuser, router, locale]);

  const fetchSchools = async () => {
    if (!isOwnerOrSuperuser) return;
    
    const token = getAccessToken();
    if (!token) return;

    try {
      const data = await schoolsApi.getSchools(token);
      // Handle both array and paginated response formats
      const schoolsList = Array.isArray(data) 
        ? data 
        : (data as { items?: School[]; results?: School[] }).items 
          || (data as { items?: School[]; results?: School[] }).results 
          || [];
      setSchools(schoolsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load schools");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchSchools();
    }
  }, [authLoading, user, isOwnerOrSuperuser, getAccessToken]);

  const openAddModal = () => {
    setEditingSchool(null);
    setFormData({ name: "", address: "", phone: "", logo: "" });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (school: School, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSchool(school);
    setFormData({
      name: school.name,
      address: school.address || "",
      phone: school.phone || "",
      logo: school.logo || "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSchool(null);
    setFormData({ name: "", address: "", phone: "", logo: "" });
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    const token = getAccessToken();
    if (!token) return;

    // Basic validation
    if (!formData.name.trim()) {
      setFormError(t("allFieldsRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSchool) {
        // Update existing school
        const updateData: UpdateSchoolData = {
          name: formData.name,
          address: formData.address || null,
          phone: formData.phone || null,
          logo: formData.logo || null,
        };
        const updatedSchool = await schoolsApi.updateSchool(token, editingSchool.id, updateData);
        setSchools((prev) => prev.map((s) => (s.id === updatedSchool.id ? updatedSchool : s)));
      } else {
        // Create new school
        const newSchool = await schoolsApi.createSchool(token, formData);
        setSchools((prev) => [...prev, newSchool]);
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : (editingSchool ? t("updateFailed") : t("createFailed")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteConfirm = (school: School, e: React.MouseEvent) => {
    e.stopPropagation();
    setSchoolToDelete(school);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!schoolToDelete) return;
    
    const token = getAccessToken();
    if (!token) return;

    setIsDeleting(true);
    try {
      await schoolsApi.deleteSchool(token, schoolToDelete.id);
      setSchools((prev) => prev.filter((s) => s.id !== schoolToDelete.id));
      setDeleteConfirmOpen(false);
      setSchoolToDelete(null);
    } catch (err) {
      // Show error but keep modal open
      setFormError(err instanceof Error ? err.message : t("deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  // Show loading while checking auth or redirecting
  if (authLoading || !user || !isOwnerOrSuperuser) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addSchool")}
        </Button>
      </div>

      {schools.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border">
          <SchoolIcon className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">{t("noSchools")}</p>
          <Button variant="outline" onClick={openAddModal}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addFirstSchool")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {schools.map((school) => (
            <div
              key={school.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
            >
              {/* Action buttons - always visible on top right */}
              <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                <button
                  onClick={(e) => openEditModal(school, e)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-card/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                  title={t("editSchool")}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => openDeleteConfirm(school, e)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-card/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
                  title={t("deleteSchool")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Status indicator */}
              <div className="absolute top-3 left-3">
                <span className={`h-2.5 w-2.5 rounded-full inline-block ${school.is_active ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
              </div>

              {/* Card content - clickable */}
              <button
                onClick={() => router.push(`/${locale}/dashboard/schools/${school.id}`)}
                className="w-full p-6 pt-10 text-left"
              >
                {/* Logo/Icon with hover arrow */}
                <div className="mb-4 flex items-center justify-between">
                  {school.logo ? (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl overflow-hidden bg-white transition-all duration-300 group-hover:scale-110">
                      <img src={school.logo} alt={school.name} className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary transition-all duration-300 group-hover:from-primary group-hover:to-primary/80 group-hover:text-primary-foreground group-hover:scale-110">
                      <SchoolIcon className="h-7 w-7" />
                    </div>
                  )}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Name */}
                <h3 className="mb-3 text-xl font-bold group-hover:text-primary transition-colors">{school.name}</h3>

                {/* Details */}
                <div className="space-y-2.5 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{school.address || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{school.phone || "—"}</span>
                  </div>
                </div>
              </button>

              {/* Bottom gradient line on hover */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/50 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit School Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingSchool ? t("editSchool") : t("addSchool")}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">{t("schoolName")}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t("schoolNamePlaceholder")}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t("schoolAddress")}</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              placeholder={t("schoolAddressPlaceholder")}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t("schoolPhone")}</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder={t("schoolPhonePlaceholder")}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("schoolLogo")}</Label>
            <ImageUpload
              value={formData.logo || undefined}
              onChange={(url) => setFormData((prev) => ({ ...prev, logo: url || "" }))}
              onUpload={async (file) => {
                const token = getAccessToken();
                if (!token) throw new Error("Not authenticated");
                return schoolsApi.uploadImage(token, file);
              }}
              disabled={isSubmitting}
              labels={{
                dropzone: t("logoDropzone"),
                dropzoneActive: t("logoDropzoneActive"),
                uploading: t("logoUploading"),
                remove: t("logoRemove"),
              }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon("saving")}
                </>
              ) : (
                tCommon("save")
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSchoolToDelete(null);
        }}
        title={t("confirmDelete")}
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">{t("confirmDeleteMessage")}</p>
          {schoolToDelete && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="font-medium">{schoolToDelete.name}</p>
              {schoolToDelete.address && (
                <p className="text-sm text-muted-foreground">{schoolToDelete.address}</p>
              )}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setSchoolToDelete(null);
              }}
              disabled={isDeleting}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon("deleting")}
                </>
              ) : (
                t("deleteSchool")
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
