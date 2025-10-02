import { useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
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

interface MonthlyPerformanceChartProps {
  data: Array<{ month: string; return: number; trades: number }>;
  className?: string;
}

export function MonthlyPerformanceChart({ data, className = "" }: MonthlyPerformanceChartProps) {
  const chartRef = useRef<ChartJS<"bar">>(null);

  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        label: "Monthly Return %",
        data: data.map(d => d.return),
        backgroundColor: data.map(d => 
          d.return >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"
        ),
        borderColor: data.map(d => 
          d.return >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"
        ),
        borderWidth: 1,
        borderRadius: 4,
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
        },
      },
      tooltip: {
        backgroundColor: "hsl(var(--card))",
        titleColor: "hsl(var(--card-foreground))",
        bodyColor: "hsl(var(--card-foreground))",
        borderColor: "hsl(var(--border))",
        borderWidth: 1,
        callbacks: {
          afterBody: function(context: any) {
            const dataIndex = context[0].dataIndex;
            const trades = data[dataIndex]?.trades || 0;
            return [`Trades: ${trades}`];
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
            return `${value}%`;
          }
        },
        grid: {
          color: "hsl(var(--border))",
        },
      },
    },
  };

  return (
    <div className={`h-64 ${className}`}>
      <Bar ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
