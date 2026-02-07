import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FreighterAPI from "@stellar/freighter-api";
import { getHealth, postNativePayment, postNativePaymentWithSteps, type PaymentStep } from "../api";

function getFreighter(): typeof FreighterAPI | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { freighterApi?: typeof FreighterAPI }).freighterApi ?? FreighterAPI;
}

export default function Home() {
  const [pubKey, setPubKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [testDestination, setTestDestination] = useState("");
  const [testAmount, setTestAmount] = useState("10");
  const [testMemo, setTestMemo] = useState("");
  const [steps, setSteps] = useState<PaymentStep[]>([]);
  const [stepError, setStepError] = useState<string | null>(null);
  const [stepsRunning, setStepsRunning] = useState(false);

  const checkFreighter = useCallback(async () => {
    const api = getFreighter();
    if (!api) {
      setError("Freighter not detected. Install the Freighter wallet extension and refresh the page.");
      setPubKey(null);
      setChecking(false);
      return;
    }
    try {
      const conn = await api.isConnected();
      const connected = conn?.isConnected === true && !conn?.error;
      if (connected) {
        const addr = await api.getAddress();
        const key = addr?.error ? null : addr?.address ?? null;
        setPubKey(key);
        setError(null);
      } else {
        setPubKey(null);
      }
    } catch (e) {
      setError("Freighter not detected. Install the Freighter wallet extension and refresh the page.");
      setPubKey(null);
    }
    setChecking(false);
  }, []);

  const connectFreighter = useCallback(async () => {
    setError(null);
    const api = getFreighter();
    if (!api) {
      setError("Freighter not detected. Install the extension and refresh the page.");
      return;
    }
    try {
      const result = await api.requestAccess();
      const key = result?.error ? null : result?.address ?? null;
      setPubKey(key);
      if (result?.error) {
        setError(result.error.message ?? "Connection denied or failed");
      } else {
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection denied or failed");
    }
  }, []);

  useEffect(() => {
    setChecking(true);
    const retryDelays = [0, 300, 800, 1500, 3000];
    let attempt = 0;
    const tryCheck = () => {
      const api = getFreighter();
      if (api) {
        checkFreighter();
        return;
      }
      if (attempt < retryDelays.length) {
        setTimeout(tryCheck, retryDelays[attempt++]);
      } else {
        setError("Freighter not detected. Install the Freighter wallet extension and refresh the page.");
        setChecking(false);
      }
    };
    tryCheck();
    getHealth()
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false));
  }, [checkFreighter]);

  const handleSendTestPayment = async () => {
    if (!pubKey) return;
    setPaymentStatus("Sending...");
    try {
      await postNativePayment({
        destination_public: pubKey,
        amount_xlm: "1",
        memo: "Cygnus demo from Freighter",
      });
      setPaymentStatus("Success! (Check with backend agent key configured)");
    } catch (e) {
      setPaymentStatus(e instanceof Error ? e.message : "Payment failed");
    }
  };

  const handleRunAgentTest = async () => {
    const dest = testDestination.trim();
    const amount = testAmount.trim();
    if (!dest || !amount) {
      setStepError("Enter destination address and amount.");
      return;
    }
    if (dest.length !== 56) {
      setStepError("Destination must be a 56-character Stellar public key (G...).");
      return;
    }
    setStepError(null);
    setSteps([]);
    setStepsRunning(true);
    try {
      const res = await postNativePaymentWithSteps({
        destination_public: dest,
        amount_xlm: amount,
        memo: testMemo.trim() || undefined,
      });
      setSteps(res.steps ?? []);
      if (!res.success) {
        setStepError(res.message ?? "Payment failed");
      }
    } catch (e) {
      const err = e as Error & { response?: { steps?: PaymentStep[] } };
      setStepError(err.message ?? "Request failed");
      if (err.response?.steps?.length) setSteps(err.response.steps);
      else setSteps([]);
    } finally {
      setStepsRunning(false);
    }
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: "1rem" }}>Cygnus — Machine Economy</h1>
      <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
        Connect with Freighter to see your Stellar address and test the flow.
      </p>

      {apiOk === false && (
        <div className="card" style={{ marginBottom: "1rem", borderColor: "#b91c1c" }}>
          Backend not reachable. Start it with: <code>python scripts/run_api.py</code> (port 8000).
        </div>
      )}

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginBottom: "0.75rem" }}>Freighter Wallet</h2>
        {checking ? (
          <p style={{ color: "#94a3b8" }}>Checking for Freighter…</p>
        ) : !pubKey ? (
          <button onClick={connectFreighter}>Connect Freighter</button>
        ) : (
          <div>
            <p style={{ marginBottom: "0.5rem" }}>
              <strong>Connected:</strong> <code style={{ wordBreak: "break-all" }}>{pubKey}</code>
            </p>
            <button onClick={checkFreighter} style={{ marginRight: "0.5rem" }}>
              Refresh
            </button>
            <button onClick={handleSendTestPayment} disabled={!apiOk}>
              Send test payment (to self)
            </button>
            {paymentStatus && (
              <p style={{ marginTop: "0.75rem", color: "#94a3b8" }}>{paymentStatus}</p>
            )}
          </div>
        )}
        {!checking && error && <p style={{ marginTop: "0.75rem", color: "#f87171" }}>{error}</p>}
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginBottom: "0.75rem" }}>Test agent payment</h2>
        <p style={{ color: "#94a3b8", marginBottom: "1rem" }}>
          Send a specific amount (XLM) from the agent to any testnet address and see each step.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Destination wallet (G...)</span>
            <input
              type="text"
              placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              value={testDestination}
              onChange={(e) => setTestDestination(e.target.value)}
              disabled={stepsRunning}
              style={{
                padding: "0.5rem 0.75rem",
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "6px",
                color: "#f1f5f9",
                fontFamily: "monospace",
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Amount (XLM)</span>
            <input
              type="text"
              placeholder="10"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              disabled={stepsRunning}
              style={{
                padding: "0.5rem 0.75rem",
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "6px",
                color: "#f1f5f9",
                width: "6rem",
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Memo (optional)</span>
            <input
              type="text"
              placeholder="Cygnus test"
              value={testMemo}
              onChange={(e) => setTestMemo(e.target.value)}
              disabled={stepsRunning}
              style={{
                padding: "0.5rem 0.75rem",
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "6px",
                color: "#f1f5f9",
              }}
            />
          </label>
        </div>
        <button
          onClick={handleRunAgentTest}
          disabled={!apiOk || stepsRunning}
          style={{ marginBottom: steps.length > 0 ? "1rem" : 0 }}
        >
          {stepsRunning ? "Running…" : "Run and show steps"}
        </button>
        {stepError && (
          <p style={{ marginTop: "0.75rem", color: "#f87171" }}>{stepError}</p>
        )}
        {steps.length > 0 && (
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #334155" }}>
            <h3 style={{ marginBottom: "0.75rem", fontSize: "1rem" }}>Steps</h3>
            <ol style={{ listStyle: "none", paddingLeft: 0, margin: 0 }}>
              {steps.map((s, i) => (
                <li
                  key={s.id + i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                    padding: "0.5rem 0.75rem",
                    background: s.status === "error" ? "rgba(248,113,113,0.1)" : s.status === "done" ? "rgba(34,197,94,0.08)" : "rgba(148,163,184,0.06)",
                    borderRadius: "6px",
                    borderLeft: `3px solid ${
                      s.status === "error" ? "#f87171" : s.status === "done" ? "#22c55e" : "#64748b"
                    }`,
                  }}
                >
                  <span style={{ color: "#64748b", minWidth: "1.5rem" }}>{i + 1}.</span>
                  <div>
                    <strong>{s.label}</strong>
                    {s.status === "running" && " …"}
                    {s.status === "done" && " ✓"}
                    {s.status === "error" && " ✗"}
                    {s.detail && (
                      <p style={{ margin: "0.25rem 0 0", color: "#94a3b8", fontSize: "0.875rem" }}>
                        {s.detail}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginBottom: "0.75rem" }}>How it works</h2>
        <ul style={{ paddingLeft: "1.5rem", color: "#94a3b8" }}>
          <li>Stellar L1 (Horizon/Soroban) for settlement</li>
          <li>Programmable payments: native, claimable balances, time-bound</li>
          <li>x402 for HTTP Payment Required flows</li>
          <li>Agent rankings by trades and profit</li>
        </ul>
        <p style={{ marginTop: "0.75rem" }}>
          <Link to="/rankings">View Agent Rankings →</Link>
        </p>
      </div>
    </div>
  );
}
