"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/providers/auth-provider";
import { schoolsApi } from "@/lib/api/schools";
import type { School } from "@/types/api";
import { Building2, ChevronDown, Plus, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SchoolSwitcher() {
  const t = useTranslations("schools");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { user, getAccessToken } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isOwnerOrSuperuser = user?.role === "owner" || user?.role === "superuser";
  
  // Extract current school ID from URL
  const schoolIdMatch = pathname.match(/\/dashboard\/schools\/([^/]+)/);
  const currentSchoolId = schoolIdMatch ? schoolIdMatch[1] : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch schools for owner/superuser
  useEffect(() => {
    const fetchSchools = async () => {
      if (!isOwnerOrSuperuser) return;
      
      const token = getAccessToken();
      if (!token) return;

      try {
        const data = await schoolsApi.getSchools(token);
        const schoolsList = Array.isArray(data) 
          ? data 
          : (data as { items?: School[] }).items || [];
        setSchools(schoolsList);
        
        // Find and set current school based on URL
        if (currentSchoolId) {
          const school = schoolsList.find(s => s.id === currentSchoolId);
          setCurrentSchool(school || null);
        } else {
          // Reset when not inside a school
          setCurrentSchool(null);
        }
      } catch (err) {
        console.error("Failed to fetch schools:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchools();
  }, [isOwnerOrSuperuser, getAccessToken, currentSchoolId]);

  // Don't render for non-owner/superuser
  if (!isOwnerOrSuperuser) return null;

  const handleSchoolSelect = (school: School) => {
    setCurrentSchool(school);
    setIsOpen(false);
    router.push(`/${locale}/dashboard/schools/${school.id}`);
  };

  const handleManageSchools = () => {
    setIsOpen(false);
    router.push(`/${locale}/dashboard`);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
          "border border-border bg-background hover:bg-accent",
          "min-w-[180px] max-w-[280px]"
        )}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
          <Building2 className="h-4 w-4" />
        </div>
        <div className="flex-1 text-left truncate">
          {isLoading ? (
            <span className="text-muted-foreground">Loading...</span>
          ) : currentSchool ? (
            <span className="truncate">{currentSchool.name}</span>
          ) : (
            <span className="text-muted-foreground">{t("selectSchool")}</span>
          )}
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground transition-transform shrink-0",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-border bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t("switchSchool")}
            </p>
          </div>

          {/* Schools list */}
          <div className="max-h-[300px] overflow-y-auto py-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : schools.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                {t("noSchools")}
              </div>
            ) : (
              schools.map((school) => (
                <button
                  key={school.id}
                  onClick={() => handleSchoolSelect(school)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    "hover:bg-accent",
                    currentSchoolId === school.id && "bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                    currentSchoolId === school.id 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      currentSchoolId === school.id && "text-primary"
                    )}>
                      {school.name}
                    </p>
                    {school.address && (
                      <p className="text-xs text-muted-foreground truncate">
                        {school.address}
                      </p>
                    )}
                  </div>
                  {currentSchoolId === school.id && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer actions */}
          <div className="border-t border-border p-2">
            <button
              onClick={handleManageSchools}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t("manageSchools")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
