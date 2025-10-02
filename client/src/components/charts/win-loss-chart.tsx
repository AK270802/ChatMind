import { useRef } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface WinLossChartProps {
  wins: number;
  losses: number;
  className?: string;
}

export function WinLossChart({ wins, losses, className = "" }: WinLossChartProps) {
  const chartRef = useRef<ChartJS<"doughnut">>(null);

  const total = wins + losses;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";

  const chartData = {
    labels: ["Wins", "Losses"],
    datasets: [
      {
        data: [wins, losses],
        backgroundColor: [
          "rgba(16, 185, 129, 0.8)", // Green for wins
          "rgba(239, 68, 68, 0.8)",   // Red for losses
        ],
        borderColor: [
          "rgba(16, 185, 129, 1)",
          "rgba(239, 68, 68, 1)",
        ],
        borderWidth: 2,
        cutout: "70%",
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#e2e8f0",
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold' as const,
          },
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
        callbacks: {
          label: function(context: any) {
            const label = context.label || "";
            const value = context.parsed;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1000,
      easing: 'easeInOutQuart' as const,
    },
  };

  return (
    <div className={`relative h-64 ${className}`}>
      <Doughnut ref={chartRef} data={chartData} options={options} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{winRate}%</div>
          <div className="text-sm text-slate-400">Win Rate</div>
        </div>
      </div>
    </div>
  );
}
