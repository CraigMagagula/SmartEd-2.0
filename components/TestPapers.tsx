import React, { useState } from 'react';
import { searchPastPapers } from '../services/geminiService';
import type { PastPaperResult } from '../services/geminiService';
import { ArrowLeftIcon, LoadingIcon, FileTextIcon, DownloadIcon } from './icons';

const subjects = [
  "Accounting",
  "Business Studies",
  "Computer Application Technology",
  "Economics",
  "English", 
  "Geography",
  "History", 
  "Life Orientation",
  "Life Sciences",
  "Mathematics",
  "Physical Sciences",
];

const years = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - i - 1);

export const TestPapers: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const [subject, setSubject] = useState(subjects[0]);
    const [year, setYear] = useState(String(years[0]));
    const [papers, setPapers] = useState<PastPaperResult[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const handleSearch = async () => {
        setIsLoading(true);
        setError(null);
        setPapers(null);
        try {
            const results = await searchPastPapers(subject, year);
            if (results && results.length > 0) {
                setPapers(results);
            } else {
                setError(`No papers found for ${subject} in ${year}. Please try different options.`);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <button onClick={() => setCurrentPage('Overview')} className="p-2 rounded-md hover:bg-slate-200 transition-colors">
                    <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Past Test Papers</h1>
                    <p className="text-slate-500">Find official NSC past examination papers and memorandums.</p>
                </div>
            </div>
            
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="subject-select" className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                        <select id="subject-select" value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-2 bg-slate-800 text-white border border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
                            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="year-select" className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                        <select id="year-select" value={year} onChange={e => setYear(e.target.value)} className="w-full p-2 bg-slate-800 text-white border border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="md:self-end">
                        <button onClick={handleSearch} disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-violet-600 text-white font-semibold rounded-lg shadow hover:bg-violet-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
                            {isLoading ? <LoadingIcon className="w-5 h-5"/> : <span>Search Papers</span>}
                        </button>
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="text-center py-12">
                    <LoadingIcon className="w-10 h-10 text-violet-600 mx-auto" />
                    <p className="mt-2 text-slate-600 font-semibold">Searching for papers...</p>
                </div>
            )}

            {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-center">{error}</div>
            )}

            {papers && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Results for {subject} - {year}</h2>
                    <ul className="space-y-3">
                        {papers.map((paper, index) => (
                            <li key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <FileTextIcon className="w-5 h-5 text-slate-500 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-slate-800">{paper.name}</p>
                                        <p className="text-sm text-slate-500">{paper.type}</p>
                                    </div>
                                </div>
                                <a href={paper.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-violet-100 text-violet-700 text-sm font-semibold rounded-md hover:bg-violet-200 transition-colors">
                                    <DownloadIcon className="w-4 h-4" />
                                    <span>View PDF</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};