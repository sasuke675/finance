import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getMonthlyStats, getMonthlyTotals, formatCurrency } from '../lib/api';
import StatCard from '../components/StatCard';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: '8px 12px',
        fontSize: 'var(--font-size-sm)',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Tanggal {label}</div>
      {payload.map((entry) => (
        <div key={entry.name} style={{ color: entry.color, display: 'flex', gap: 8 }}>
          <span>{entry.name}:</span>
          <span style={{ fontWeight: 600 }}>{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsView() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [chartData, setChartData] = useState([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stats, monthTotals] = await Promise.all([
        getMonthlyStats(year, month),
        getMonthlyTotals(year, month),
      ]);

      // Fill in all days of the month
      const daysInMonth = new Date(year, month, 0).getDate();
      const filled = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const existing = stats.find((s) => s.day === d);
        filled.push({
          day: d.toString(),
          Pemasukan: existing ? Number(existing.total_in) : 0,
          Pengeluaran: existing ? Number(existing.total_out) : 0,
        });
      }

      setChartData(filled);
      setTotals(monthTotals);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const goPrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const netProfit = totals.income - totals.expense;

  return (
    <div className="page-content" id="analytics-view">
      {/* Header */}
      <h1
        style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 700,
          marginBottom: 'var(--spacing-base)',
        }}
      >
        Analitik
      </h1>

      {/* Month Selector */}
      <div className="month-selector">
        <button
          className="month-selector__btn"
          onClick={goPrevMonth}
          aria-label="Previous month"
          id="prev-month-btn"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="month-selector__label" id="month-label">
          {MONTH_NAMES[month - 1]} {year}
        </div>
        <button
          className="month-selector__btn"
          onClick={goNextMonth}
          aria-label="Next month"
          id="next-month-btn"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="stats-row mb-lg">
        <StatCard
          label="Pemasukan"
          value={formatCurrency(totals.income)}
          variant="income"
        />
        <StatCard
          label="Pengeluaran"
          value={formatCurrency(totals.expense)}
          variant="expense"
        />
        <StatCard
          label="Laba Bersih"
          value={formatCurrency(netProfit)}
          variant={netProfit >= 0 ? 'income' : 'expense'}
        />
      </div>

      {/* Chart */}
      <div className="chart-container">
        <div className="chart-container__title">Arus Kas Harian</div>
        {loading ? (
          <div className="spinner spinner--center" />
        ) : chartData.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--spacing-xl) 0' }}>
            <Activity className="empty-state__icon" />
            <div className="empty-state__title">Belum ada data</div>
            <div className="empty-state__text">Transaksi bulan ini akan ditampilkan di sini.</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148, 163, 184, 0.1)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(148, 163, 184, 0.15)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  v >= 1000000
                    ? `${(v / 1000000).toFixed(0)}jt`
                    : v >= 1000
                    ? `${(v / 1000).toFixed(0)}rb`
                    : v
                }
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.06)' }} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                dataKey="Pemasukan"
                fill="#10b981"
                radius={[3, 3, 0, 0]}
                maxBarSize={16}
              />
              <Bar
                dataKey="Pengeluaran"
                fill="#ef4444"
                radius={[3, 3, 0, 0]}
                maxBarSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Profit Indicator */}
      <div
        className={`card ${netProfit >= 0 ? 'card--income' : 'card--expense'}`}
        style={{ textAlign: 'center' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-sm">
            {netProfit >= 0 ? (
              <TrendingUp size={20} className="text-income" />
            ) : (
              <TrendingDown size={20} className="text-expense" />
            )}
            <span className="font-semibold">
              {netProfit >= 0 ? 'Bulan ini untung' : 'Bulan ini rugi'}
            </span>
          </div>
          <span
            className={`font-bold ${netProfit >= 0 ? 'text-income' : 'text-expense'}`}
            style={{ fontSize: 'var(--font-size-lg)' }}
          >
            {formatCurrency(Math.abs(netProfit))}
          </span>
        </div>
      </div>
    </div>
  );
}
