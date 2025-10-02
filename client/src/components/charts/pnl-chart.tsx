import { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { Line } from "react-chartjs-2";

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

interface PnLChartProps {
  data: Array<{ date: string; cumulative: number; daily?: number }>;
  className?: string;
}

export function PnLChart({ data, className = "" }: PnLChartProps) {
  const chartRef = useRef<ChartJS<"line">>(null);

  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: "Cumulative P&L",
        data: data.map(d => d.cumulative),
        borderColor: "hsl(var(--chart-1))",
        backgroundColor: "hsla(var(--chart-1), 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "hsl(var(--chart-1))",
        pointBorderColor: "hsl(var(--background))",
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
        labels: {
          color: "hsl(var(--muted-foreground))",
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "hsl(var(--card))",
        titleColor: "hsl(var(--card-foreground))",
        bodyColor: "hsl(var(--card-foreground))",
        borderColor: "hsl(var(--border))",
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `P&L: $${context.parsed.y.toLocaleString()}`;
          }
        }
      },
    },
    scales: {
      x: {
        ticks: {
          color: "hsl(var(--muted-foreground))",
        },
        grid: {
          color: "hsl(var(--border))",
        },
      },
      y: {
        ticks: {
          color: "hsl(var(--muted-foreground))",
          callback: function(value: any) {
            return `$${value.toLocaleString()}`;
          }
        },
        grid: {
          color: "hsl(var(--border))",
        },
      },
    },
    elements: {
      point: {
        hoverBorderWidth: 2,
      },
    },
  };

  return (
    <div className={`h-64 ${className}`}>
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
