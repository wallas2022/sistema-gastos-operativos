import { api } from "../shared/services/api";
import type { PendingApproval } from "./approvalFlows.service";

export type NotificationBox = "NOTIFICATIONS" | "OBSERVED" | "DELEGATED" | "APPROVED" | "HISTORY" | "PENDING";
export interface WorkflowNotification { id: string; eventType: string; title: string; description: string; priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"; status: "UNREAD" | "READ"; link?: string | null; entityId?: string | null; metadata?: Record<string, unknown> | null; readAt?: string | null; createdAt: string; }
export interface NotificationPage { items: WorkflowNotification[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }
export interface SlaResult { priority: string; targetMinutes: number; warningMinutes: number; elapsedMinutes: number; remainingMinutes: number; overdueMinutes: number; indicator: "GREEN" | "YELLOW" | "RED"; }
export type PendingWithSla = PendingApproval & { sla: SlaResult };

export const notificationsService = {
  async list(box: NotificationBox, page = 1, pageSize = 20): Promise<NotificationPage> { return (await api.get("/notifications", { params: { box, page, pageSize } })).data; },
  async latest(): Promise<WorkflowNotification[]> { return (await api.get("/notifications/latest")).data; },
  async unreadCount(): Promise<number> { return (await api.get("/notifications/unread-count")).data.count; },
  async get(id: string): Promise<WorkflowNotification> { return (await api.get(`/notifications/${id}`)).data; },
  async markRead(id: string) { return (await api.patch(`/notifications/${id}/read`)).data; },
  async markAllRead() { return (await api.patch("/notifications/read-all")).data; },
  async pendingWithSla(): Promise<PendingWithSla[]> { return (await api.get("/workflow/sla/pending/me")).data; },
};
