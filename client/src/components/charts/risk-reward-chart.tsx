import { useRef } from "react";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";
import { Scatter } from "react-chartjs-2";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

interface RiskRewardChartProps {
  data: Array<{ risk: number; reward: number; symbol: string; pnl: number }>;
  className?: string;
}

export function RiskRewardChart({ data, className = "" }: RiskRewardChartProps) {
  const chartRef = useRef<ChartJS<"scatter">>(null);

  const chartData = {
    datasets: [
      {
        label: "Trades",
        data: data.map(d => ({ x: d.risk, y: d.reward })),
        backgroundColor: data.map(d => 
          d.pnl >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"
        ),
        borderColor: data.map(d => 
          d.pnl >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"
        ),
        pointRadius: 6,
        pointHoverRadius: 8,
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
          title: function(context: any) {
            const dataIndex = context[0].dataIndex;
            return data[dataIndex]?.symbol || "";
          },
          label: function(context: any) {
            const dataIndex = context.dataIndex;
            const trade = data[dataIndex];
            return [
              `Risk: ${context.parsed.x.toFixed(2)}`,
              `Reward: ${context.parsed.y.toFixed(2)}`,
              `P&L: $${trade?.pnl?.toLocaleString() || 0}`
            ];
          }
        }
      },
    },
    scales: {
      x: {
        type: "linear" as const,
        title: {
          display: true,
          text: "Risk",
          color: "hsl(var(--muted-foreground))",
        },
        ticks: {
          color: "hsl(var(--muted-foreground))",
        },
        grid: {
          color: "hsl(var(--border))",
        },
      },
      y: {
        type: "linear" as const,
        title: {
          display: true,
          text: "Reward",
          color: "hsl(var(--muted-foreground))",
        },
        ticks: {
          color: "hsl(var(--muted-foreground))",
        },
        grid: {
          color: "hsl(var(--border))",
        },
      },
    },
  };

  return (
    <div className={`h-64 ${className}`}>
      <Scatter ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
