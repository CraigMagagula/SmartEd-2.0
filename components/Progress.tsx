import React, { useMemo } from 'react';
import type { ProgressData } from '../hooks/useProgressData';
import { ArrowLeftIcon, BarChartIcon, DownloadIcon, ActivityIcon, BrainCircuitIcon, ClockIcon } from './icons';
import { TrendGraph } from './TrendGraph';
import { FocusQualityChart } from './FocusQualityChart';

// Make jsPDF and autoTable available from the global scope
declare const jspdf: any;
declare const autoTable: any;


interface ProgressProps {
  setCurrentPage: (page: string) => void;
  progressData: ProgressData;
}

const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string, color: string }> = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
             <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">{title}</p>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
            </div>
        </div>
    </div>
);

const SubjectBreakdown: React.FC<{ data: ProgressData['quizHistory'] }> = ({ data }) => {
    const subjectStats = useMemo<Array<{ subject: string; averageScore: number; quizzesTaken: number }>>(() => {
        const stats: { [subject: string]: { totalScore: number, count: number, totalQuestions: number } } = {};
        data.forEach(quiz => {
            if (!quiz.subject) return;
            if (!stats[quiz.subject]) {
                stats[quiz.subject] = { totalScore: 0, count: 0, totalQuestions: 0 };
            }
            stats[quiz.subject].totalScore += quiz.score;
            stats[quiz.subject].count += 1;
            stats[quiz.subject].totalQuestions += quiz.total;
        });
        
        return Object.entries(stats).map(([subject, { totalScore, count, totalQuestions }]) => ({
            subject,
            averageScore: totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0,
            quizzesTaken: count,
        })).sort((a, b) => b.averageScore - a.averageScore);
    }, [data]);

    if (subjectStats.length === 0) {
        return <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center text-slate-500">No quiz data available for subject breakdown.</div>
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Subject-wise Breakdown</h3>
            <div className="overflow-x-auto">
                <table id="subject-breakdown-table" className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="p-3 font-semibold rounded-l-lg">Subject</th>
                            <th className="p-3 font-semibold text-center">Quizzes Taken</th>
                            <th className="p-3 font-semibold text-right rounded-r-lg">Average Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjectStats.map(({ subject, quizzesTaken, averageScore }) => (
                            <tr key={subject} className="border-b border-slate-100 last:border-0">
                                <td className="p-3 font-medium text-slate-800">{subject}</td>
                                <td className="p-3 text-center text-slate-600">{quizzesTaken}</td>
                                <td className="p-3 text-right font-semibold text-violet-600">{averageScore.toFixed(1)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


export const Progress: React.FC<ProgressProps> = ({ setCurrentPage, progressData }) => {
    
    const { totalStudyTime, totalQuizzes, averageScore } = useMemo(() => {
        const totalStudyTime = progressData.studyHistory.reduce((sum, s) => sum + s.minutes, 0);
        const totalQuizzes = progressData.quizHistory.length;
        const totalScore = progressData.quizHistory.reduce((sum, q) => sum + (q.score / q.total), 0);
        const averageScore = totalQuizzes > 0 ? (totalScore / totalQuizzes) * 100 : 0;
        return { totalStudyTime, totalQuizzes, averageScore };
    }, [progressData]);
    
    const formatMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const handleExport = () => {
        const doc = new jspdf.jsPDF();
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('SmartEd: Progress Report', 14, 22);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Report generated on: ${new Date().toLocaleDateString()}`, 14, 28);

        // Summary Cards
        doc.setFontSize(16);
        doc.text('Overall Stats', 14, 45);
        doc.autoTable({
            startY: 48,
            body: [
                ['Total Study Time', formatMinutes(totalStudyTime)],
                ['Total Quizzes Taken', `${totalQuizzes}`],
                ['Average Quiz Score', `${averageScore.toFixed(1)}%`],
            ],
            theme: 'grid',
            styles: { fontSize: 11 },
        });

        const trendChartCanvas = document.getElementById('trend-graph-canvas') as HTMLCanvasElement;
        if (trendChartCanvas) {
            const trendChartImage = trendChartCanvas.toDataURL('image/png', 1.0);
            doc.addPage();
            doc.setFontSize(16);
            doc.text('Study vs. Performance Trend', 14, 22);
            doc.addImage(trendChartImage, 'PNG', 14, 28, 180, 90);
        }

        const focusChartCanvas = document.getElementById('focus-quality-canvas') as HTMLCanvasElement;
        if (focusChartCanvas) {
            doc.setFontSize(16);
            doc.text('Focus Quality Breakdown', 14, 130);
            doc.addImage(focusChartCanvas, 'PNG', 14, 136, 80, 80);
        }
        
        doc.setFontSize(16);
        doc.text('Subject-wise Breakdown', 14, doc.autoTable.previous.finalY ? doc.autoTable.previous.finalY + 20 : 225);
        autoTable(doc, { 
            html: '#subject-breakdown-table',
            startY: doc.autoTable.previous.finalY ? doc.autoTable.previous.finalY + 24 : 229
        });
        
        doc.save('SmartEd_Progress_Report.pdf');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentPage('Overview')} className="p-2 rounded-md hover:bg-slate-200 transition-colors">
                        <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">My Progress</h1>
                        <p className="text-slate-500">Track your learning journey and find insights</p>
                    </div>
                </div>
                 <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow hover:bg-slate-800 transition-colors">
                    <DownloadIcon className="w-5 h-5"/>
                    <span>Export Report</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <StatCard icon={ClockIcon} title="Total Study Time" value={formatMinutes(totalStudyTime)} color="bg-sky-500" />
                 <StatCard icon={ActivityIcon} title="Total Quizzes" value={String(totalQuizzes)} color="bg-amber-500" />
                 <StatCard icon={BrainCircuitIcon} title="Average Score" value={`${averageScore.toFixed(1)}%`} color="bg-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Study vs. Performance Trend (Last 7 Days)</h3>
                    <div className="h-80">
                         <TrendGraph data={progressData} />
                    </div>
                </div>
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Focus Quality</h3>
                    <div className="h-80 flex items-center justify-center">
                        <FocusQualityChart data={progressData.studyHistory} />
                    </div>
                </div>
            </div>

            <SubjectBreakdown data={progressData.quizHistory} />

        </div>
    );
};