import { apiClient } from "./client";
import type { Token, LoginRequest, User, Language, Theme } from "@/types/api";

export interface UserUpdateData {
  language?: Language;
  theme?: Theme;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_picture?: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<Token> => {
    return apiClient.post<Token>("/auth/login", data);
  },

  refresh: async (refreshToken: string): Promise<Token> => {
    return apiClient.post<Token>("/auth/refresh", { refresh_token: refreshToken });
  },

  getMe: async (token: string): Promise<User> => {
    return apiClient.get<User>("/users/me", token);
  },

  updateMe: async (token: string, data: UserUpdateData): Promise<User> => {
    return apiClient.patch<User>("/users/me", data, token);
  },
};
