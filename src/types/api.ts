/** API Response types */

export interface ApiError {
  detail: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginRequest {
  phone_number: string;
  password: string;
}

export type Language = "en" | "uz" | "ru";
export type Theme = "light" | "dark";

export interface User {
  id: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  role: "owner" | "superuser" | "director" | "shareholder" | "accountant" | "staff";
  school_id: string | null;
  profile_picture: string | null;
  is_active: boolean;
  language: Language;
  theme: Theme;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  logo: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
  skip: number;
  limit: number;
}

export interface PositionInfo {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string | null;
  profile_picture: string | null;
  position_id: string;
  position: PositionInfo;
  salary: number;
  school_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeListResponse {
  items: Employee[];
  total: number;
  page: number;
  pages: number;
}

export interface Position {
  id: string;
  name: string;
  school_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePositionData {
  name: string;
  school_id: string;
}

export interface PositionListResponse {
  items: Position[];
  total: number;
  page: number;
  pages: number;
}

export interface SchoolClass {
  id: string;
  school_id: string;
  homeroom_teacher_id: string | null;
  grade: number;
  section: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchoolClassListResponse {
  items: SchoolClass[];
  total: number;
  skip: number;
  limit: number;
}

export interface Student {
  id: string;
  school_id: string;
  school_class_id: string | null;
  first_name: string;
  last_name: string;
  phone: string | null;
  profile_picture: string | null;
  parent_first_name: string;
  parent_last_name: string;
  parent_phone_1: string;
  parent_phone_2: string | null;
  monthly_fee: number;
  payment_day: number;
  enrolled_at: string;
  graduated_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentListResponse {
  items: Student[];
  total: number;
  skip: number;
  limit: number;
}

export interface ExpenseCategory {
  id: string;
  school_id: string | null;
  name: string;
  is_system: boolean;
}

export interface ExpenseCategoryListResponse {
  items: ExpenseCategory[];
  total: number;
  skip: number;
  limit: number;
}

export interface Expense {
  id: string;
  school_id: string;
  category_id: string;
  employee_id: string | null;
  recurring_expense_id: string | null;
  amount: number;
  description: string | null;
  expense_date: string;
  created_by_id: string;
  category: {
    id: string;
    name: string;
    is_system: boolean;
  };
  employee: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  created_by: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface ExpenseListResponse {
  items: Expense[];
  total: number;
  skip: number;
  limit: number;
}
