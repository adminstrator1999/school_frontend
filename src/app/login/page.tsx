import { LoginForm } from "@/components/forms/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary">School Accounting</h1>
        <p className="mt-2 text-muted-foreground">Management System</p>
      </div>
      <LoginForm />
    </div>
  );
}
