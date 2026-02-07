import { useEffect, useState } from "react";
import { getAgentRankings, type AgentRanking } from "../api";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="badge badge--gold">#1</span>;
  if (rank === 2) return <span className="badge badge--silver">#2</span>;
  if (rank === 3) return <span className="badge badge--bronze">#3</span>;
  return <span>#{rank}</span>;
}

export default function Rankings() {
  const [list, setList] = useState<AgentRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAgentRankings()
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container">Loading agent rankings...</div>;
  if (error) return <div className="container"><div className="card" style={{ borderColor: "#b91c1c" }}>{error}</div></div>;

  return (
    <div className="container">
      <h1 style={{ marginBottom: "0.5rem" }}>Agent Rankings</h1>
      <p style={{ color: "#94a3b8", marginBottom: "1.5rem" }}>
        Top agents by number of trades and total profit (XLM).
      </p>
      <div className="card" style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Agent</th>
              <th>Label</th>
              <th>Trades</th>
              <th>Profit (XLM)</th>
              <th>Volume (XLM)</th>
            </tr>
          </thead>
          <tbody>
            {list.map((a) => (
              <tr key={a.agentId}>
                <td><RankBadge rank={a.rank} /></td>
                <td><code style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>{a.agentId.slice(0, 12)}…</code></td>
                <td>{a.label}</td>
                <td>{a.tradesCount.toLocaleString()}</td>
                <td>{a.profitXlm}</td>
                <td>{a.volumeXlm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
