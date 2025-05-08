import { useEffect, useRef } from 'react';
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from 'chart.js';

// Register the required Chart.js components
Chart.register(ArcElement, Tooltip, Legend, DoughnutController);

interface DonutChartProps {
  percentage: number;
  color: string;
  size?: number;
}

export default function DonutChart({ percentage, color, size = 112 }: DonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy previous chart if it exists
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Ensure percentage is between 0-100
    const normalizedPercentage = Math.min(Math.max(percentage, 0), 100);
    
    // Log the percentage value for debugging
    console.log('Donut Chart Percentage:', normalizedPercentage);

    // Create new chart
    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: [normalizedPercentage, 100 - normalizedPercentage],
            backgroundColor: [color, '#E5E7EB'],
            borderWidth: 0,
            circumference: 360,
            rotation: 270,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '80%', // Move cutout to options object
        plugins: {
          tooltip: {
            enabled: false,
          },
          legend: {
            display: false,
          },
        },
      },
    });

    // Clean up on unmount
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [percentage, color]);

  return <canvas ref={canvasRef} width={size} height={size} />;
}
