"use client";

import { useTranslations } from "next-intl";
import { ProfileForm } from "@/components/forms/profile-form";
import { useAuth } from "@/providers/auth-provider";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">{t("description")}</p>
      </div>

      <div className="space-y-8">
        {/* Profile Information */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-6">{t("personalInfo")}</h2>
          <ProfileForm user={user} />
        </div>

        {/* Account Info (Read Only) */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">{t("accountInfo")}</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("role")}
              </label>
              <p className="text-sm mt-1 capitalize">{user.role.replace("_", " ")}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("memberSince")}
              </label>
              <p className="text-sm mt-1">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t("status")}
              </label>
              <p className="text-sm mt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.is_active
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}
                >
                  {user.is_active ? t("active") : t("inactive")}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
