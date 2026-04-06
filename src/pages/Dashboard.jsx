 import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRevenue, getAllSalaries, getAllCommissions } from '../api/api';

function fmt(n) {
  if (n >= 1_000_000) return `Rs. ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `Rs. ${(n / 1_000).toFixed(1)}K`;
  return `Rs. ${n.toLocaleString()}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0, totalSalaries: 0, totalCommissions: 0, netProfit: 0,
    revenueCount: 0, salaryCount: 0, commissionCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentRevenue, setRecentRevenue] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [rev, sal, com] = await Promise.all([
          getAllRevenue(), getAllSalaries(), getAllCommissions()
        ]);
        const revenues    = rev.data;
        const salaries    = sal.data;
        const commissions = com.data;
        const totalRevenue     = revenues.reduce((s, r) => s + r.ticketSales, 0);
        const totalSalaries    = salaries.reduce((s, r) => s + r.amount, 0);
        const totalCommissions = commissions.reduce((s, r) => s + r.amount, 0);
        setStats({
          totalRevenue, totalSalaries, totalCommissions,
          netProfit: totalRevenue - totalSalaries - totalCommissions,
          revenueCount: revenues.length,
          salaryCount: salaries.length,
          commissionCount: commissions.length,
        });
        setRecentRevenue(revenues.slice(0, 3));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="page">
      <div className="header">
        <div className="header-top">
          <div>
            <div className="header-greeting">Ayubowan (Welcome)</div>
            <div className="header-title">Financial Dashboard</div>
          </div>
          <div className="avatar">👤</div>
        </div>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Loading...</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-amount">{fmt(stats.totalRevenue)}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-amount">{fmt(Math.max(0, stats.netProfit))}</div>
              <div className="stat-label">Net Profit</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-amount">{fmt(stats.totalSalaries)}</div>
              <div className="stat-label">Total Salaries</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon danger">🚌</div>
              <div className="stat-amount">{fmt(stats.totalCommissions)}</div>
              <div className="stat-label">Commissions</div>
            </div>
          </div>

          <div className="section-title">Quick Actions</div>
          <div className="quick-actions">
            <button className="action-btn" onClick={() => navigate('/revenue')}>💳 Add Revenue</button>
            <button className="action-btn" onClick={() => navigate('/salary')}>👤 Add Salary</button>
            <button className="action-btn" onClick={() => navigate('/commission')}>🚌 Commission</button>
            <button className="action-btn" onClick={() => navigate('/reports')}>📊 Reports</button>
          </div>

          <div className="section-title">Summary</div>
          <div className="list-container">
            <div className="list-item">
              <div className="list-item-left">
                <span className="list-item-title">Revenue Entries</span>
                <span className="list-item-sub">{stats.revenueCount} records</span>
              </div>
              <div className="list-item-right">
                <span className="list-item-amount">{fmt(stats.totalRevenue)}</span>
              </div>
            </div>
            <div className="list-item">
              <div className="list-item-left">
                <span className="list-item-title">Salary Payments</span>
                <span className="list-item-sub">{stats.salaryCount} staff</span>
              </div>
              <div className="list-item-right">
                <span className="list-item-amount">{fmt(stats.totalSalaries)}</span>
              </div>
            </div>
            <div className="list-item">
              <div className="list-item-left">
                <span className="list-item-title">Commissions</span>
                <span className="list-item-sub">{stats.commissionCount} companies</span>
              </div>
              <div className="list-item-right">
                <span className="list-item-amount">{fmt(stats.totalCommissions)}</span>
              </div>
            </div>
            <div className="list-item" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <div className="list-item-left">
                <span className="list-item-title" style={{ color: '#166534' }}>Net Profit</span>
                <span className="list-item-sub">Revenue − Salaries − Commissions</span>
              </div>
              <div className="list-item-right">
                <span className="list-item-amount" style={{ color: stats.netProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                  {stats.netProfit < 0 ? '-' : ''}{fmt(Math.abs(stats.netProfit))}
                </span>
              </div>
            </div>
          </div>

          {recentRevenue.length > 0 && (
            <>
              <div className="section-title" style={{ marginTop: 8 }}>Recent Revenue</div>
              <div className="list-container">
                {recentRevenue.map(r => (
                  <div className="list-item" key={r._id}>
                    <div className="list-item-left">
                      <span className="list-item-title">{r.source}</span>
                      <span className="list-item-sub">
                        {r.description || 'Ticket Sales'} · {new Date(r.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="list-item-right">
                      <span className="list-item-amount">Rs. {r.ticketSales.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
