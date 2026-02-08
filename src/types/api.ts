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
