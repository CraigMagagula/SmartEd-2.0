import React, { useEffect, useRef, useMemo } from 'react';
import type { ProgressData } from '../hooks/useProgressData';

// Make Chart.js available from the global scope
declare const Chart: any;

interface TrendGraphProps {
  data: ProgressData;
}

export const TrendGraph: React.FC<TrendGraphProps> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  const chartData = useMemo(() => {
    const labels: string[] = [];
    const studyMinutes: number[] = [];
    const quizScores: (number | null)[] = [];

    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        labels.push(dayOfWeek);

        // Aggregate study time for the day
        const totalMinutes = data.studyHistory
            .filter(s => s.date === dateString)
            .reduce((sum, s) => sum + s.minutes, 0);
        studyMinutes.push(totalMinutes);

        // Aggregate quiz scores for the day
        const quizzesToday = data.quizHistory.filter(q => q.date === dateString);
        if (quizzesToday.length > 0) {
            const avgScore = quizzesToday.reduce((sum, q) => sum + (q.score / q.total), 0) / quizzesToday.length * 100;
            quizScores.push(avgScore);
        } else {
            quizScores.push(null);
        }
    }
    return { labels, studyMinutes, quizScores };
  }, [data]);


  useEffect(() => {
    if (!chartRef.current) return;
    
    if (chartInstance.current) {
        chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartData.labels,
        datasets: [
          {
            type: 'line',
            label: 'Avg. Quiz Score (%)',
            data: chartData.quizScores,
            borderColor: '#10b981', // green-500
            backgroundColor: '#10b981',
            tension: 0.3,
            yAxisID: 'y1',
            spanGaps: true, // Connect lines over null data points
          },
          {
            type: 'bar',
            label: 'Study Time (minutes)',
            data: chartData.studyMinutes,
            backgroundColor: '#8b5cf6', // violet-500
            borderColor: '#8b5cf6',
            yAxisID: 'y',
          },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: {
              display: false,
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Study Time (minutes)',
            },
            beginAtZero: true,
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Avg. Quiz Score (%)',
            },
            min: 0,
            max: 100,
            grid: {
              drawOnChartArea: false, // only draw grid for the first Y-axis
            },
          }
        },
        plugins: {
          legend: {
            position: 'top',
          },
           tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        interaction: {
            intersect: false,
            mode: 'index',
        },
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData]);

  return <canvas id="trend-graph-canvas" ref={chartRef} />;
};
