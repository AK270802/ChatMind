"use client";

import { useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
} from "chart.js";
import { Chart } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface FinancialPerformanceChartProps {
  data: Array<{ month: string; return: number; trades: number }>;
  className?: string;
}

export function FinancialPerformanceChart({ data, className = "" }: FinancialPerformanceChartProps) {
  const chartRef = useRef<any>(null);

  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        type: 'bar' as const,
        label: "Monthly Return %",
        data: data.map(d => d.return),
        backgroundColor: data.map(d => 
          d.return >= 0 ? "rgba(16, 185, 129, 0.8)" : "rgba(239, 68, 68, 0.8)"
        ),
        borderColor: data.map(d => 
          d.return >= 0 ? "rgba(16, 185, 129, 1)" : "rgba(239, 68, 68, 1)"
        ),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        type: 'line' as const,
        label: "Cumulative Return %",
        data: data.map((d, index) => {
          const cumulative = data.slice(0, index + 1).reduce((sum, item) => sum + item.return, 0);
          return cumulative;
        }),
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: "rgba(59, 130, 246, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        yAxisID: 'y1',
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
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
          title: (context: any) => `Month: ${context[0].label}`,
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const dataIndex = context.dataIndex;
            const trades = data[dataIndex]?.trades || 0;
            
            if (label.includes('Monthly Return')) {
              return [
                `${label}: ${value.toFixed(2)}%`,
                `Trades: ${trades}`
              ];
            }
            return `${label}: ${value.toFixed(2)}%`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: "#94a3b8",
          font: {
            size: 11,
          },
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
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
        title: {
          display: true,
          text: 'Monthly Return %',
          color: "#94a3b8",
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: "#3b82f6",
          font: {
            size: 11,
          },
          callback: (value: any) => `${value}%`,
        },
        title: {
          display: true,
          text: 'Cumulative Return %',
          color: "#3b82f6",
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
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
        <p className="text-slate-400">No performance data available</p>
      </div>
    );
  }

  return (
    <div className={`h-96 ${className}`}>
      <Chart ref={chartRef} type="bar" data={chartData} options={options} />
    </div>
  );
}
