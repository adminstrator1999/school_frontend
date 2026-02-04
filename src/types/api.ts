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
  role: "super_admin" | "school_admin" | "accountant" | "staff";
  school_id: string | null;
  profile_picture: string | null;
  is_active: boolean;
  language: Language;
  theme: Theme;
  created_at: string;
  updated_at: string;
}
