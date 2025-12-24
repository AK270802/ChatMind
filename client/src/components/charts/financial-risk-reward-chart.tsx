"use client";

import { useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ScatterController
} from "chart.js";
import { Chart } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ScatterController,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface FinancialRiskRewardChartProps {
  data: Array<{ risk: number; reward: number; symbol: string; pnl: number }>;
  className?: string;
}

export function FinancialRiskRewardChart({ data, className = "" }: FinancialRiskRewardChartProps) {
  const chartRef = useRef<any>(null);

  // Calculate breakeven line (where risk = reward)
  const maxRisk = Math.max(...data.map(d => d.risk), 10);
  const maxReward = Math.max(...data.map(d => d.reward), 10);
  const maxValue = Math.max(maxRisk, maxReward);

  const chartData = {
    datasets: [
      {
        type: 'scatter' as const,
        label: "Trades",
        data: data.map(d => ({
          x: d.risk,
          y: d.reward,
        })),
        backgroundColor: data.map(d => 
          d.pnl >= 0 ? "rgba(16, 185, 129, 0.8)" : "rgba(239, 68, 68, 0.8)"
        ),
        borderColor: data.map(d => 
          d.pnl >= 0 ? "rgba(16, 185, 129, 1)" : "rgba(239, 68, 68, 1)"
        ),
        borderWidth: 2,
        pointRadius: data.map(d => Math.abs(d.pnl) / 100 + 6),
        pointHoverRadius: data.map(d => Math.abs(d.pnl) / 100 + 8),
      },
      {
        type: 'line' as const,
        label: "Breakeven Line",
        data: [
          { x: 0, y: 0 },
          { x: maxValue, y: maxValue }
        ],
        borderColor: "rgba(148, 163, 184, 0.8)",
        backgroundColor: "rgba(148, 163, 184, 0.1)",
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0,
      },
      {
        type: 'line' as const,
        label: "Profit Zone",
        data: [
          { x: 0, y: maxValue },
          { x: maxValue, y: maxValue }
        ],
        borderColor: "rgba(16, 185, 129, 0.6)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderWidth: 1,
        fill: '+1', // Fill to the line above
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0,
      },
      {
        type: 'line' as const,
        label: "Loss Zone",
        data: [
          { x: 0, y: 0 },
          { x: maxValue, y: 0 },
          { x: maxValue, y: maxValue }
        ],
        borderColor: "rgba(239, 68, 68, 0.6)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderWidth: 1,
        fill: 'origin',
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'point' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: "#e2e8f0",
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "rgba(30, 41, 59, 0.95)",
        titleColor: "#f1f5f9",
        bodyColor: "#e2e8f0",
        borderColor: "rgba(148, 163, 184, 0.3)",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: true,
        callbacks: {
          title: (context: any) => {
            const dataIndex = context[0]?.dataIndex;
            if (dataIndex !== undefined && data[dataIndex]) {
              return `Symbol: ${data[dataIndex].symbol}`;
            }
            return context[0]?.dataset.label || '';
          },
          label: (context: any) => {
            const label = context.dataset.label || '';
            const dataIndex = context.dataIndex;
            
            if (label === 'Trades' && data[dataIndex]) {
              const trade = data[dataIndex];
              return [
                `Risk: ${trade.risk.toFixed(2)}%`,
                `Reward: ${trade.reward.toFixed(2)}%`,
                `P&L: ${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}`,
                `Ratio: ${(trade.reward / trade.risk).toFixed(2)}:1`
              ];
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
        title: {
          display: true,
          text: 'Risk %',
          color: "#94a3b8",
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: "#94a3b8",
          font: {
            size: 11,
          },
          callback: (value: any) => `${value}%`,
        },
        min: 0,
        max: maxValue * 1.1,
      },
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Reward %',
          color: "#94a3b8",
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: "#94a3b8",
          font: {
            size: 11,
          },
          callback: (value: any) => `${value}%`,
        },
        min: 0,
        max: maxValue * 1.1,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    },
  };

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <p className="text-slate-400">No risk-reward data available</p>
      </div>
    );
  }

  return (
    <div className={`h-96 ${className}`}>
      <Chart ref={chartRef} type="scatter" data={chartData} options={options} />
    </div>
  );
}
