import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicKey, isConnected, requestAccess } from "@stellar/freighter-api";
import { getHealth, postNativePayment } from "../api";

export default function Home() {
  const [pubKey, setPubKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  const checkFreighter = useCallback(async () => {
    try {
      const connected = await isConnected();
      if (connected) {
        const key = await getPublicKey();
        setPubKey(key ?? null);
        setError(null);
      } else {
        setPubKey(null);
      }
    } catch (e) {
      setError("Freighter not detected. Install the Freighter wallet extension.");
      setPubKey(null);
    }
  }, []);

  const connectFreighter = useCallback(async () => {
    try {
      const key = await requestAccess();
      setPubKey(key ?? null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection denied or failed");
    }
  }, []);

  useEffect(() => {
    checkFreighter();
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
        {!pubKey ? (
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
        {error && <p style={{ marginTop: "0.75rem", color: "#f87171" }}>{error}</p>}
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
