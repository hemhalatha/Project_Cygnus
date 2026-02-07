const API_BASE = import.meta.env.VITE_API_URL || "";

export async function getHealth(): Promise<{ status: string; version?: string }> {
  const r = await fetch(`${API_BASE}/health`);
  if (!r.ok) throw new Error("Health check failed");
  return r.json();
}

export async function getAgentRankings(): Promise<AgentRanking[]> {
  const r = await fetch(`${API_BASE}/api/v1/agents/rankings`);
  if (!r.ok) throw new Error("Failed to load rankings");
  return r.json();
}

export interface AgentRanking {
  rank: number;
  agentId: string;
  label: string;
  tradesCount: number;
  profitXlm: string;
  volumeXlm: string;
}

export interface NativePaymentRequest {
  destination_public: string;
  amount_xlm: string;
  memo?: string;
}

export async function postNativePayment(body: NativePaymentRequest): Promise<unknown> {
  const r = await fetch(`${API_BASE}/api/v1/payments/native`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as { detail?: string }).detail || "Payment failed");
  return data;
}

export interface PaymentStep {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  detail?: string;
}

export interface NativePaymentWithStepsResponse {
  success: boolean;
  steps: PaymentStep[];
  result?: { hash?: string };
  error?: string;
  message?: string;
}

export async function postNativePaymentWithSteps(
  body: NativePaymentRequest
): Promise<NativePaymentWithStepsResponse> {
  const r = await fetch(`${API_BASE}/api/v1/payments/native/with-steps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const raw = await r.json().catch(() => ({}));
  if (!r.ok) {
    const detail = (raw.detail ?? raw) as NativePaymentWithStepsResponse;
    const err = new Error(detail?.message ?? "Payment failed") as Error & { response?: NativePaymentWithStepsResponse };
    err.response = { ...detail, steps: detail?.steps ?? [] };
    throw err;
  }
  return raw as NativePaymentWithStepsResponse;
}
