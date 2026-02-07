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
