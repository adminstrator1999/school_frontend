"use client";

import { useTranslations } from "next-intl";
import { ProfileForm } from "@/components/forms/profile-form";
import { useAuth } from "@/providers/auth-provider";
import { 
  Building2, 
  Calendar, 
  Mail, 
  Phone, 
  Shield, 
  User as UserIcon 
} from "lucide-react";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tRoles = useTranslations("roles");
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (

    <div className="container max-w-4xl mx-auto py-8">
      
      <div className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
        {/* Banner */}
        <div className="relative h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900">
          <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />
        </div>

        <div className="px-8 pb-8">
          {/* Header Section with Avatar overlapping Banner */}
          <div className="relative flex flex-col items-center md:items-start md:flex-row md:gap-8 -mt-16 mb-8">
            {/* Avatar */}
            <div className="relative h-32 w-32 rounded-full border-4 border-white dark:border-card bg-card overflow-hidden shadow-md">
              {user.profile_picture ? (
                <img 
                  src={user.profile_picture} 
                  alt={user.first_name} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-4xl font-bold">
                  {getInitials(user.first_name, user.last_name)}
                </div>
              )}
            </div>

            {/* User Identity Info */}
            <div className="mt-4 md:mt-16 md:pt-2 text-center md:text-left space-y-2 flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{user.first_name} {user.last_name}</h2>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span className="capitalize font-medium">{tRoles(user.role as any)}</span>
                    <span className="mx-2">•</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {user.is_active ? t("active") : t("inactive")}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-center md:items-end text-sm text-muted-foreground gap-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{t("memberSince")}: {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                  {user.school_id && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{t("schoolMember")}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="my-8 border-t border-border" />

          {/* Edit Form - Centered and Clean */}
          <div className="max-w-2xl mx-auto">
             <div className="mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-primary" />
                  {t("personalInfo")}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("updateDetails")}
                </p>
             </div>
             
             <ProfileForm user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
