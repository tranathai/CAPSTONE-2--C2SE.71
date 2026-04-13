import { useEffect, useState } from "react";
import { listSubmissions } from "../../../lib/api";
import "../../../styles/content.css";

function DashboardPage() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const rows = await listSubmissions();
        if (active) setCount(rows.length);
      } catch {
        if (active) setCount(0);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="submissions-page">
      <div className="page-header-row">
        <h1 className="page-title">Student Dashboard</h1>
        <p className="page-lead">Theo doi thong tin do an va tien do nop bai.</p>
      </div>
      <div className="pm-card">
        <h2 className="section-title">Tong quan</h2>
        <p className="page-muted">{`Ban hien co ${count} bai nop trong he thong.`}</p>
      </div>
    </div>
  );
}

export default DashboardPage;
