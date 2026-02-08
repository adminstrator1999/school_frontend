"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { useAuth } from "@/providers/auth-provider";
import {
  LayoutDashboard,
  School,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui";
import { canAccessUsersPage, type UserRole } from "@/lib/api/users";
import type { User } from "@/types/api";

type Role = User["role"];

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles?: Role[];
  children?: { title: string; href: string }[];
}

export function Sidebar() {
  const t = useTranslations("navigation");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const { isCollapsed, toggleCollapsed, isReady } = useSidebar();
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Detect if we're inside a school context
  const schoolIdMatch = pathname.match(/\/dashboard\/schools\/([^/]+)/);
  const currentSchoolId = schoolIdMatch ? schoolIdMatch[1] : null;
  const isOwnerOrSuperuser = user?.role === "owner" || user?.role === "superuser";

  // For non-owner/superuser, use their assigned school_id
  // For owner/superuser not in a school context, don't show school-specific nav items
  const effectiveSchoolId = currentSchoolId || (!isOwnerOrSuperuser ? user?.school_id : null);
  const schoolBasePath = effectiveSchoolId ? `/${locale}/dashboard/schools/${effectiveSchoolId}` : null;

  // Build navigation items - only show school-specific items when we have a school context
  const allNavItems: NavItem[] = schoolBasePath
    ? [
        // Inside a school context - show full navigation
        { title: t("dashboard"), href: schoolBasePath, icon: <LayoutDashboard className="h-5 w-5 shrink-0" /> },
        { title: t("students"), href: `${schoolBasePath}/students`, icon: <GraduationCap className="h-5 w-5 shrink-0" /> },
        { title: t("classes"), href: `${schoolBasePath}/classes`, icon: <BookOpen className="h-5 w-5 shrink-0" /> },
        { title: t("employees"), href: `${schoolBasePath}/employees`, icon: <Users className="h-5 w-5 shrink-0" /> },
        { title: t("invoices"), href: `${schoolBasePath}/invoices`, icon: <FileText className="h-5 w-5 shrink-0" /> },
        { title: t("payments"), href: `${schoolBasePath}/payments`, icon: <CreditCard className="h-5 w-5 shrink-0" /> },
        { title: t("expenses"), href: `${schoolBasePath}/expenses`, icon: <Receipt className="h-5 w-5 shrink-0" /> },
        { title: t("reports"), href: `${schoolBasePath}/reports`, icon: <BarChart3 className="h-5 w-5 shrink-0" /> },
        { title: t("settings"), href: `${schoolBasePath}/settings`, icon: <Settings className="h-5 w-5 shrink-0" /> },
      ]
    : [
        // No school context (only owner/superuser on school selection page)
        { title: t("dashboard"), href: `/${locale}/dashboard`, icon: <LayoutDashboard className="h-5 w-5 shrink-0" /> },
      ];

  // Add Users management link for roles that can access users page
  const canManageUsers = user?.role && canAccessUsersPage(user.role as UserRole);
  if (canManageUsers) {
    allNavItems.push({
      title: t("users"),
      href: `/${locale}/dashboard/users`,
      icon: <Users className="h-5 w-5 shrink-0" />,
    });
  }

  const navItems = allNavItems.filter((item) => 
    !item.roles || (user?.role && item.roles.includes(user.role))
  );

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((i) => i !== title) : [...prev, title]
    );
  };

  const getPathWithoutLocale = (path: string) => {
    if (path.startsWith(`/${locale}/`)) {
      return path.replace(`/${locale}`, "");
    }
    if (path === `/${locale}`) {
      return "/";
    }
    return path;
  };

  const isActive = (href: string) => {
    const normalizedPathname = getPathWithoutLocale(pathname);
    const normalizedHref = getPathWithoutLocale(href);
    if (normalizedHref === "/dashboard") {
      return normalizedPathname === "/dashboard";
    }
    return normalizedPathname === normalizedHref || normalizedPathname.startsWith(normalizedHref + "/");
  };
  const isChildActive = (item: NavItem) => item.children?.some((child) => {
    const normalizedPathname = getPathWithoutLocale(pathname);
    const normalizedHref = getPathWithoutLocale(child.href);
    return normalizedPathname === normalizedHref || normalizedPathname.startsWith(normalizedHref + "/");
  });

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 h-screen bg-card border-r border-border transition-all duration-300",
        isCollapsed ? "w-[70px]" : "w-64",
        !isReady && "opacity-0"
      )}
    >
      <div className="flex flex-col h-full">
        <div className={cn(
          "flex items-center gap-3 h-16 border-b border-border transition-all duration-300",
          isCollapsed ? "px-[15px]" : "px-4"
        )}>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shrink-0">
            <School className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className={cn(
            "overflow-hidden transition-opacity duration-300",
            isCollapsed ? "opacity-0 w-0" : "opacity-100"
          )}>
            <h1 className="font-bold text-lg whitespace-nowrap">{tCommon("appName")}</h1>
            <p className="text-xs text-muted-foreground whitespace-nowrap">{tCommon("tagline")}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.title}>
                {item.children && !isCollapsed ? (
                  <div>
                    <button
                      onClick={() => toggleExpanded(item.title)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                        isChildActive(item)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        {item.icon}
                        {item.title}
                      </span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", expandedItems.includes(item.title) && "rotate-180")} />
                    </button>
                    {expandedItems.includes(item.title) && (
                      <ul className="mt-1 ml-4 space-y-1 border-l border-border pl-4">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                "block rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                                isActive(child.href)
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                              )}
                            >
                              {child.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    title={isCollapsed ? item.title : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      isCollapsed ? "px-[17px]" : "px-3",
                      isActive(item.href)
                        ? "bg-primary/10 text-primary before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:rounded-r-full before:bg-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {item.icon}
                    <span className={cn(
                      "whitespace-nowrap transition-opacity duration-300",
                      isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                    )}>
                      {item.title}
                    </span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            title={isCollapsed ? "Expand" : "Collapse"}
            className={cn(
              "w-full transition-all duration-300",
              isCollapsed ? "justify-center px-0" : "justify-center px-3"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
