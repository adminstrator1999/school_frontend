import { apiClient } from "./client";
import { Position, CreatePositionData, PositionListResponse } from "@/types/api";

export const positionsApi = {
  async getPositions(token: string, schoolId: string): Promise<PositionListResponse> {
    return apiClient.get<PositionListResponse>(`/positions?school_id=${schoolId}`, token);
  },

  async createPosition(token: string, data: CreatePositionData): Promise<Position> {
    return apiClient.post<Position>(`/positions`, data, token);
  },

  async deletePosition(token: string, id: string): Promise<void> {
    return apiClient.delete<void>(`/positions/${id}`, token);
  },
};
