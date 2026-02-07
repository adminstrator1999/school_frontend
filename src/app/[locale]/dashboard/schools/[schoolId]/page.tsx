import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

export default async function SchoolDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; schoolId: string }>;
}) {
  const { locale, schoolId } = await params;
  setRequestLocale(locale);

  return <SchoolDashboardContent schoolId={schoolId} />;
}

function SchoolDashboardContent({ schoolId }: { schoolId: string }) {
  const t = useTranslations("dashboard");

  return (
    <div>
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("welcome")}</p>
      
      {/* Dashboard stats cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">{t("totalStudents")}</p>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">{t("totalIncome")}</p>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">{t("totalExpenses")}</p>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">{t("pendingPayments")}</p>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>
      </div>
    </div>
  );
}
