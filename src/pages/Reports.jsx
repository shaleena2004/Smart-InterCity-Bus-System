 import { useState, useEffect } from 'react';
import { getReport } from '../api/api';

function fmt(n) {
  if (!n) return 'Rs. 0';
  if (n >= 1_000_000) return `Rs. ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `Rs. ${(n / 1_000).toFixed(1)}K`;
  return `Rs. ${n.toLocaleString()}`;
}

export default function Reports() {
  const [period,  setPeriod]  = useState('monthly');
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const load = async (p) => {
    setLoading(true);
    setError('');
    try {
      const r = await getReport(p);
      setReport(r.data);
    } catch (e) {
      setError('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(period); }, [period]);

  const netProfit = report ? report.netProfit : 0;

  return (
    <div className="page">
      <div className="header">
        <div className="page-title-row">
          <h1 className="page-title">Reports</h1>
        </div>
      </div>

      <div className="period-tabs">
        {['daily', 'weekly', 'monthly'].map(p => (
          <button
            key={p}
            className={`period-tab${period === p ? ' active' : ''}`}
            onClick={() => setPeriod(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /> Generating report...</div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <p>{error}</p>
        </div>
      ) : report ? (
        <>
          <div className="report-card">
            <div className="report-card-label">
              {period.charAt(0).toUpperCase() + period.slice(1)} Net Profit
            </div>
            <div className={`report-card-value ${netProfit >= 0 ? 'profit' : 'loss'}`}>
              {netProfit < 0 ? '-' : ''}{fmt(Math.abs(netProfit))}
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              {new Date(report.startDate).toLocaleDateString()} — {new Date(report.endDate).toLocaleDateString()}
            </div>
          </div>

          <div className="list-container">
            <div className="list-item">
              <div className="list-item-left">
                <span className="list-item-title">💰 Total Revenue</span>
                <span className="list-item-sub">{report.revenueCount} entries</span>
              </div>
              <div className="list-item-right">
                <span className="list-item-amount" style={{ color: '#16a34a' }}>
                  +{fmt(report.totalRevenue)}
                </span>
              </div>
            </div>

            <div className="list-item">
              <div className="list-item-left">
                <span className="list-item-title">👤 Total Salaries</span>
                <span className="list-item-sub">{report.salaryCount} payments</span>
              </div>
              <div className="list-item-right">
                <span className="list-item-amount" style={{ color: '#dc2626' }}>
                  -{fmt(report.totalSalaries)}
                </span>
              </div>
            </div>

            <div className="list-item">
              <div className="list-item-left">
                <span className="list-item-title">🚌 Total Commissions</span>
                <span className="list-item-sub">{report.commissionCount} companies</span>
              </div>
              <div className="list-item-right">
                <span className="list-item-amount" style={{ color: '#dc2626' }}>
                  -{fmt(report.totalCommissions)}
                </span>
              </div>
            </div>

            <div className="list-item" style={{
              background: netProfit >= 0 ? '#f0fdf4' : '#fef2f2',
              borderColor: netProfit >= 0 ? '#bbf7d0' : '#fecaca',
              marginTop: 8
            }}>
              <div className="list-item-left">
                <span className="list-item-title" style={{ color: netProfit >= 0 ? '#166534' : '#991b1b' }}>
                  Net Profit / Loss
                </span>
                <span className="list-item-sub">Revenue − Salaries − Commissions</span>
              </div>
              <div className="list-item-right">
                <span className="list-item-amount" style={{ color: netProfit >= 0 ? '#16a34a' : '#dc2626', fontSize: 17 }}>
                  {netProfit < 0 ? '-' : '+'}{fmt(Math.abs(netProfit))}
                </span>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
