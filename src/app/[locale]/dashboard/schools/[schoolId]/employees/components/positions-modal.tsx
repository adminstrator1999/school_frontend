"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Trash2, Plus, X } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { positionsApi } from "@/lib/api/positions";
import type { Position } from "@/types/api";
import { Modal, Input, Button, Label } from "@/components/ui";

interface PositionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
}

export function PositionsModal({ isOpen, onClose, schoolId }: PositionsModalProps) {
  const t = useTranslations("employees");
  const tCommon = useTranslations("common");
  const { getAccessToken } = useAuth();
  
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPositionName, setNewPositionName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!schoolId || !isOpen) return;

    try {
      setIsLoading(true);
      const token = await getAccessToken();
      if (!token) return;

      const response = await positionsApi.getPositions(token, schoolId);
      setPositions(response.items);
      setError(null);
    } catch (error) {
      console.error("Error fetching positions:", error);
      setError(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, isOpen, getAccessToken, tCommon]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPositionName.trim()) return;

    try {
      setIsCreating(true);
      const token = await getAccessToken();
      if (!token) return;

      await positionsApi.createPosition(token, {
        name: newPositionName,
        school_id: schoolId,
      });

      setNewPositionName("");
      fetchPositions();
    } catch (error) {
      console.error("Error creating position:", error);
      setError(t("createFailed"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      await positionsApi.deletePosition(token, id);
      fetchPositions();
    } catch (error) {
      console.error("Error deleting position:", error);
      setError(t("deleteFailed")); // Ensure this key exists or use generic error
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("managePositions")} // Ensure key exists
      className="max-w-[500px]"
    >
      <div className="space-y-6">
        {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
            </div>
        )}

        <form onSubmit={handleCreate} className="flex gap-2 items-end">
          <div className="flex-1 space-y-2">
            <Label>{t("newPosition")}</Label>
            <Input
              value={newPositionName}
              onChange={(e) => setNewPositionName(e.target.value)}
              placeholder={t("positionNamePlaceholder")}
            />
          </div>
          <Button type="submit" disabled={isCreating || !newPositionName.trim()}>
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </form>

        <div className="space-y-2">
            <Label>{t("existingPositions")}</Label>
            <div className="border border-border rounded-md divide-y divide-border max-h-[300px] overflow-y-auto">
                {isLoading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : positions.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        {t("noPositions")}
                    </div>
                ) : (
                    positions.map((position) => (
                        <div key={position.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                            <span className="text-sm font-medium">{position.name}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(position.id)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </Modal>
  );
}
