"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { usersApi, type CreateUserData, type UpdateUserData, type UserRole, getCreatableRoles, canManageUser } from "@/lib/api/users";
import { schoolsApi } from "@/lib/api/schools";
import type { User, School } from "@/types/api";
import { 
  Users as UsersIcon, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  Phone,
  Building2,
  UserCircle2,
  Shield,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button, Modal, Input, Label, ImageUpload } from "@/components/ui";
import { schoolsApi as schoolsApiClient } from "@/lib/api/schools";

const ITEMS_PER_PAGE = 10;

export default function UsersPage() {
  const t = useTranslations("users");
  const tRoles = useTranslations("roles");
  const tCommon = useTranslations("common");
  const locale = useLocale() as "en" | "ru" | "uz";
  const { user: currentUser, getAccessToken, isLoading: authLoading } = useAuth();
  
  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Schools for dropdown (owner/superuser only)
  const [schools, setSchools] = useState<School[]>([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserData>({
    phone_number: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "staff",
    school_id: null,
    profile_picture: null,
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Creatable roles based on current user
  const creatableRoles = currentUser ? getCreatableRoles(currentUser.role as UserRole) : [];
  const canCreateUsers = creatableRoles.length > 0;
  const isSuperuserOrOwner = currentUser?.role === "owner" || currentUser?.role === "superuser";

  const fetchUsers = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await usersApi.getUsers(token, {
        skip: page * ITEMS_PER_PAGE,
        limit: ITEMS_PER_PAGE,
      });
      setUsers(response.items);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, page]);

  const fetchSchools = useCallback(async () => {
    if (!isSuperuserOrOwner) return;
    
    const token = getAccessToken();
    if (!token) return;

    try {
      const response = await schoolsApi.getSchools(token);
      setSchools(response);
    } catch (err) {
      console.error("Failed to fetch schools:", err);
    }
  }, [getAccessToken, isSuperuserOrOwner]);

  useEffect(() => {
    if (!authLoading && currentUser) {
      fetchUsers();
      fetchSchools();
    }
  }, [authLoading, currentUser, fetchUsers, fetchSchools]);

  const openAddModal = () => {
    setEditingUser(null);
    const defaultRole = creatableRoles[0] || "staff";
    setFormData({
      phone_number: "",
      password: "",
      first_name: "",
      last_name: "",
      role: defaultRole,
      school_id: ["owner", "superuser"].includes(defaultRole) ? null : (currentUser?.school_id || null),
      profile_picture: null,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      phone_number: user.phone_number,
      password: "",
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role as UserRole,
      school_id: user.school_id,
      profile_picture: user.profile_picture,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Determine if the selected role needs a school
  const selectedRoleNeedsSchool = !(["owner", "superuser"].includes(formData.role));

  // Handle profile picture upload
  const handleProfilePictureUpload = async (file: File): Promise<string> => {
    const token = getAccessToken();
    if (!token) throw new Error("Not authenticated");
    return schoolsApiClient.uploadImage(token, file);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.phone_number) {
      setFormError(t("allFieldsRequired"));
      return;
    }

    if (!editingUser && !formData.password) {
      setFormError(t("passwordRequired"));
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingUser) {
        const updateData: UpdateUserData = {
          phone_number: formData.phone_number,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          school_id: formData.school_id,
        };
        await usersApi.updateUser(token, editingUser.id, updateData);
      } else {
        await usersApi.createUser(token, formData);
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("createFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    const token = getAccessToken();
    if (!token) return;

    setIsDeleting(true);
    try {
      await usersApi.deleteUser(token, userToDelete.id);
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const getRoleLabel = (role: string) => {
    return tRoles(role as any);
  };

  const getSchoolName = (schoolId: string | null) => {
    if (!schoolId) return "-";
    const school = schools.find(s => s.id === schoolId);
    return school?.name || schoolId;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        {canCreateUsers && (
          <Button onClick={openAddModal}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addUser")}
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <UsersIcon className="h-12 w-12 mb-4 opacity-50" />
            <p>{t("noUsers")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t("name")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t("phone")}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t("role")}
                  </th>
                  {isSuperuserOrOwner && (
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      {t("school")}
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    {t("status")}
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {user.profile_picture ? (
                            <img
                              src={user.profile_picture}
                              alt={user.first_name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <UserCircle2 className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {user.first_name} {user.last_name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {user.phone_number}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium capitalize">
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                    </td>
                    {isSuperuserOrOwner && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          {getSchoolName(user.school_id)}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.is_active
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {user.is_active ? t("active") : t("inactive")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {currentUser && canManageUser(currentUser.role as UserRole, user.role as UserRole) && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(user)}
                              disabled={user.id === currentUser?.id}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => confirmDelete(user)}
                              disabled={user.id === currentUser?.id}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {t("showing")} {page * ITEMS_PER_PAGE + 1}-
              {Math.min((page + 1) * ITEMS_PER_PAGE, total)} {t("of")} {total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingUser ? t("editUser") : t("addUser")}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">{t("firstName")}</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder={t("firstNamePlaceholder")}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">{t("lastName")}</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder={t("lastNamePlaceholder")}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">{t("phoneNumber")}</Label>
            <Input
              id="phone_number"
              value={formData.phone_number}
              onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              placeholder="+998901234567"
              disabled={isSubmitting}
            />
          </div>

          {!editingUser && (
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                disabled={isSubmitting}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">{t("role")}</Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
              disabled={isSubmitting}
              className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {creatableRoles.map(role => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>
          </div>

          {isSuperuserOrOwner && selectedRoleNeedsSchool && (
            <div className="space-y-2">
              <Label htmlFor="school_id">{t("school")}</Label>
              <select
                id="school_id"
                value={formData.school_id || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, school_id: e.target.value || null }))}
                disabled={isSubmitting}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t("selectSchool")}</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("profilePicture")}</Label>
            <ImageUpload
              value={formData.profile_picture || undefined}
              onChange={(url) => setFormData(prev => ({ ...prev, profile_picture: url || null }))}
              onUpload={handleProfilePictureUpload}
              disabled={isSubmitting}
              labels={{
                dropzone: t("profileDropzone"),
                dropzoneActive: t("profileDropzoneActive"),
                uploading: t("profileUploading"),
                remove: t("profileRemove"),
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
        onClose={() => setDeleteConfirmOpen(false)}
        title={t("deleteUser")}
      >
        <p className="text-muted-foreground mb-6">
          {t("deleteConfirmation", { name: `${userToDelete?.first_name} ${userToDelete?.last_name}` })}
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setDeleteConfirmOpen(false)}
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
                {t("deleting")}
              </>
            ) : (
              tCommon("delete")
            )}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
