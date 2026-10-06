import { api } from "../shared/services/api";


export type AuthorizationItem = {
  id: string;
  code: string;
  type: string;
  concept?: string;
  requesterName: string;
  requesterRole?: string | null;
  companyName?: string | null;
  costCenter?: string | null;
  budgetAccount?: string | null;
  estimatedAmount: number;
  currency: string;
  status: string;
  priority?: string;
  currentStep?: string;
  createdAt: string;
};

export type StatusMonitorItem = {
  id: string;
  code: string;
  type: string;
  concept?: string | null;
  requesterName: string;
  requesterRole?: string | null;
  companyName?: string | null;
  costCenter?: string | null;
  budgetAccount?: string | null;
  estimatedAmount: number;
  currency: string;
  status: string;
  priority?: string | null;
  currentStep?: string | null;
  slaStatus: "DENTRO_TIEMPO" | "EN_RIESGO" | "FUERA_SLA" | string;
  lastEvent?: string | null;
  lastEventDescription?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StatusMonitorDetail = StatusMonitorItem & {
  items?: unknown[];
  validations?: unknown[];
  timeline?: {
    id: string;
    event: string;
    description?: string | null;
    userName?: string | null;
    fromStatus?: string | null;
    toStatus?: string | null;
    createdAt: string;
  }[];
};

export type SlaEscalationItem = {
  id: string;
  code: string;
  type: string;
  concept?: string | null;
  requesterName: string;
  requesterRole?: string | null;
  companyName?: string | null;
  costCenter?: string | null;
  estimatedAmount: number;
  currency: string;
  status: string;
  priority?: string | null;
  currentStep?: string | null;
  slaStatus: "DENTRO_TIEMPO" | "EN_RIESGO" | "FUERA_SLA" | string;
  hoursInCurrentState: number;
  alreadyEscalated: boolean;
  lastEvent?: string | null;
  lastEventDescription?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EventLogItem = {
  id: string;
  requestId: string;
  requestCode?: string | null;
  requestType?: string | null;
  concept?: string | null;
  requesterName?: string | null;
  currentRequestStatus?: string | null;
  costCenter?: string | null;
  amount: number;
  currency: string;
  event: string;
  description?: string | null;
  userName?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  createdAt: string;
};

export type EventLogDetail = {
  id: string;
  code: string;
  type: string;
  concept?: string | null;
  requesterName: string;
  status: string;
  traces: {
    id: string;
    event: string;
    description?: string | null;
    userName?: string | null;
    fromStatus?: string | null;
    toStatus?: string | null;
    createdAt: string;
  }[];
};

export const getEventLogs = async () => {
  const response = await api.get<EventLogItem[]>(
    "/traceability/event-logs",
  );

  return response.data;
};

export const getEventLogsByRequest = async (requestId: string) => {
  const response = await api.get<EventLogDetail>(
    `/traceability/event-logs/${requestId}`,
  );

  return response.data;
};

export const getSlaEscalations = async () => {
  const response = await api.get<SlaEscalationItem[]>(
    "/traceability/sla-escalations",
  );

  return response.data;
};

export const escalateSla = async (id: string, comment?: string) => {
  const response = await api.post(
    `/traceability/sla-escalations/${id}/escalate`,
    { comment },
  );

  return response.data;
};
export const getStatusMonitor = async () => {
  const response = await api.get<StatusMonitorItem[]>(
    "/traceability/status-monitor",
  );

  return response.data;
};

export const getStatusMonitorDetail = async (id: string) => {
  const response = await api.get<StatusMonitorDetail>(
    `/traceability/status-monitor/${id}`,
  );

  return response.data;
};

export const getPendingAuthorizations = async () => {
  const response = await api.get<AuthorizationItem[]>(
    "/traceability/authorizations",
  );

  return response.data;
};

export const approveAuthorization = async (
  id: string,
  comment?: string,
) => {
  const response = await api.post(
    `/traceability/authorizations/${id}/approve`,
    { comment },
  );

  return response.data;
};

export const rejectAuthorization = async (
  id: string,
  comment: string,
) => {
  const response = await api.post(
    `/traceability/authorizations/${id}/reject`,
    { comment },
  );

  return response.data;
};

export const observeAuthorization = async (
  id: string,
  comment: string,
) => {
  const response = await api.post(
    `/traceability/authorizations/${id}/observe`,
    { comment },
  );

  return response.data;
};