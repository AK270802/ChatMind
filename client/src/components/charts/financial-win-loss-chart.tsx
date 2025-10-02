"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface FinancialWinLossChartProps {
  wins: number;
  losses: number;
  className?: string;
}

export function FinancialWinLossChart({ wins, losses, className = "" }: FinancialWinLossChartProps) {
  // Add data validation
  const validatedWins = typeof wins === 'number' && !isNaN(wins) ? wins : 0;
  const validatedLosses = typeof losses === 'number' && !isNaN(losses) ? losses : 0;
  
  if (validatedWins === 0 && validatedLosses === 0) {
    return (
      <div className={`flex items-center justify-center h-48 ${className}`}>
        <p className="text-gray-400">No win/loss data available</p>
      </div>
    );
  }

  // Create bar chart data
  const chartData = {
    labels: ["Trading Performance"],
    datasets: [
      {
        label: "Wins",
        data: [validatedWins],
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "#10b981",
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: "Losses",
        data: [validatedLosses],
        backgroundColor: "rgba(239, 68, 68, 0.8)",
        borderColor: "#ef4444",
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          color: "#ffffff",
          font: {
            size: 14,
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "#374151",
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value} trades`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#9ca3af",
          font: {
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(75, 85, 99, 0.3)",
          drawBorder: false,
        },
        ticks: {
          color: "#9ca3af",
          font: {
            size: 12,
          },
          callback: (value: any) => `${value} trades`,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
  };

  return (
    <div className={`w-full h-48 ${className}`}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
