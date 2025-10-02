"use client";

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
} from "chart.js";
import { Line } from "react-chartjs-2";
import { format } from "date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface FinancialPnLChartProps {
  data: Array<{ date: string; cumulative: number; daily?: number }>;
  className?: string;
}

export function FinancialPnLChart({ data, className = "" }: FinancialPnLChartProps) {
  // Add data validation
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-48 ${className}`}>
        <p className="text-gray-400">No P&L data available</p>
      </div>
    );
  }

  // Transform data for Chart.js format
  const chartData = {
    labels: data.map(item => format(new Date(item.date), "MMM dd")),
    datasets: [
      {
        label: "Cumulative P&L",
        data: data.map(item => item.cumulative),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#10b981",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "#374151",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            return format(new Date(data[index].date), "MMMM dd, yyyy");
          },
          label: (context: any) => {
            const value = context.parsed.y;
            return `P&L: ${value >= 0 ? '+' : ''}$${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(75, 85, 99, 0.3)",
          drawBorder: false,
        },
        ticks: {
          color: "#9ca3af",
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: "rgba(75, 85, 99, 0.3)",
          drawBorder: false,
        },
        ticks: {
          color: "#9ca3af",
          font: {
            size: 12,
          },
          callback: (value: any) => `$${value}`,
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
      <Line data={chartData} options={options} />
    </div>
  );
}
