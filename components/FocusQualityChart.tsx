import React, { useEffect, useRef, useMemo } from 'react';
import type { StudySession } from '../types';

// Make Chart.js available from the global scope
declare const Chart: any;

interface FocusQualityChartProps {
  data: StudySession[];
}

export const FocusQualityChart: React.FC<FocusQualityChartProps> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const chartData = useMemo(() => {
    const deepFocusMinutes = data.filter(s => s.rating === 'deep').reduce((sum, s) => sum + s.minutes, 0);
    const distractedMinutes = data.filter(s => s.rating === 'distracted').reduce((sum, s) => sum + s.minutes, 0);
    
    return {
        labels: ['Deep Focus', 'Distracted'],
        minutes: [deepFocusMinutes, distractedMinutes]
    };
  }, [data]);


  useEffect(() => {
    if (!chartRef.current) return;
    
    if (chartInstance.current) {
        chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: chartData.labels,
        datasets: [{
          label: 'Study Time (minutes)',
          data: chartData.minutes,
          backgroundColor: [
            '#8b5cf6', // violet-500 for Deep Focus
            '#f97316', // orange-500 for Distracted
          ],
          borderColor: '#ffffff',
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
             labels: {
                padding: 20
            }
          },
          tooltip: {
             callbacks: {
                label: function(context: any) {
                    let label = context.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed !== null) {
                        label += `${context.parsed} minutes`;
                    }
                    return label;
                }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData]);

  if (chartData.minutes.every(m => m === 0)) {
      return <div className="text-center text-slate-500">No focus data recorded yet. Complete a Pomodoro session to see your stats.</div>;
  }

  return <canvas id="focus-quality-canvas" ref={chartRef} />;
};
