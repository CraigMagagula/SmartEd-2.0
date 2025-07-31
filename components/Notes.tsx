

import React, { useState, useRef, useEffect } from 'react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { summarizeText, generateMindMap, generateQuizFromSelection, Summary, MindMapNode, QuizQuestion } from '../services/geminiService';
import MindMap from './MindMap';
import { MiniQuizModal } from './MiniQuizModal';
import { ArrowLeftIcon, MicIcon, StopCircleIcon, LoadingIcon, ListTreeIcon, SitemapIcon, FileQuestionIcon, UploadCloudIcon, DownloadIcon } from './icons';

// Make pdfjsLib available from the global scope (loaded via script tag in index.html)
declare const pdfjsLib: any;
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;
}

// Make mammoth.js available from the global scope
declare const mammoth: any;

const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const Notes: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const [notes, setNotes] = useState('');
    const [selection, setSelection] = useState({ text: '', x: 0, y: 0 });
    const [summary, setSummary] = useState<Summary | null>(null);
    const [mindMap, setMindMap] = useState<MindMapNode | null>(null);
    const [miniQuiz, setMiniQuiz] = useState<QuizQuestion[] | null>(null);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState('');
    const [error, setError] = useState<string | null>(null);

    const { isListening, transcript, startListening, stopListening } = useSpeechToText();
    const notesRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (transcript) {
            setNotes(prev => prev + transcript);
        }
    }, [transcript]);

    const handleMouseUp = () => {
        const selectedText = window.getSelection()?.toString() || '';
        if (selectedText.length > 20 && notesRef.current) {
            const range = window.getSelection()?.getRangeAt(0);
            if(range) {
                const rect = range.getBoundingClientRect();
                setSelection({ text: selectedText, x: rect.left + rect.width / 2, y: rect.bottom });
            }
        } else {
            setSelection({ text: '', x: 0, y: 0 });
        }
    };
    
    const clearResults = () => {
        setSummary(null);
        setMindMap(null);
        setError(null);
    };

    const handleSummarize = async () => {
        clearResults();
        setIsLoading(true);
        setLoadingAction('Summarizing...');
        try {
            const result = await summarizeText(notes);
            setSummary(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateMindMap = async () => {
        clearResults();
        setIsLoading(true);
        setLoadingAction('Generating Mind Map...');
        try {
            const result = await generateMindMap(notes);
            setMindMap(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadNotes = () => {
        downloadTextFile(notes, 'smarted-notes.txt');
    };

    const handleGenerateMiniQuiz = async () => {
        if (!selection.text) return;
        setIsLoading(true);
        setLoadingAction('Creating Quiz...');
        try {
            const result = await generateQuizFromSelection(selection.text);
            setMiniQuiz(result);
        } catch(e) {
             setError(e instanceof Error ? e.message : 'An error occurred creating the quiz.');
        } finally {
            setIsLoading(false);
            setSelection({ text: '', x: 0, y: 0 });
        }
    }

    const parsePdfFile = async (pdfFile: File): Promise<string> => {
        if (typeof pdfjsLib === 'undefined') {
            throw new Error('PDF library is not loaded. Cannot parse PDF file.');
        }
        const arrayBuffer = await pdfFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        return fullText;
    };

    const parseDocxFile = async (docxFile: File): Promise<string> => {
        if (typeof mammoth === 'undefined') {
            throw new Error('Word document library (mammoth.js) is not loaded.');
        }
        const arrayBuffer = await docxFile.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        clearResults();
        setIsLoading(true);
        setLoadingAction(`Reading ${file.name}...`);
        setError(null);
        setNotes('');
        setUploadedFileName(null);

        try {
            let content = '';
            const fileType = file.type;
            const fileName = file.name.toLowerCase();

            if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
                content = await parsePdfFile(file);
            } else if (
                fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                fileType === 'application/msword' || 
                fileName.endsWith('.docx') || 
                fileName.endsWith('.doc')
            ) {
                content = await parseDocxFile(file);
            } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
                content = await file.text();
            } else {
                throw new Error('Unsupported file type. Please upload a .txt, .pdf, or .docx file.');
            }
            setNotes(content);
            setUploadedFileName(file.name);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to read file.');
        } finally {
            setIsLoading(false);
            e.target.value = ''; 
        }
    };

    return (
        <>
            <MiniQuizModal isOpen={!!miniQuiz} onClose={() => setMiniQuiz(null)} quiz={miniQuiz || []} />
            {selection.text && (
                <div 
                    className="absolute z-20 bg-slate-800 text-white rounded-lg shadow-lg px-3 py-2"
                    style={{ left: selection.x, top: selection.y, transform: 'translateX(-50%) translateY(8px)' }}
                >
                    <button onClick={handleGenerateMiniQuiz} className="flex items-center gap-2 text-sm">
                        <FileQuestionIcon className="w-4 h-4" />
                        Create Quiz from Selection
                    </button>
                </div>
            )}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentPage('Overview')} className="p-2 rounded-md hover:bg-slate-200 transition-colors">
                        <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Smart Notes & Summaries</h1>
                        <p className="text-slate-500">Take notes, summarize, and generate study aids with AI</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="relative">
                            <textarea
                                ref={notesRef}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                onMouseUp={handleMouseUp}
                                onBlur={() => setTimeout(() => setSelection({ text: '', x: 0, y: 0 }), 200)}
                                rows={20}
                                placeholder="Start typing, paste, use the microphone, or upload a document..."
                                className="w-full p-4 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-xl shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-y"
                            />
                             <button
                                type="button"
                                onClick={isListening ? stopListening : startListening}
                                className={`absolute bottom-4 right-4 p-3 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                                aria-label={isListening ? 'Stop recording' : 'Start recording notes'}
                            >
                                {isListening ? <StopCircleIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-4 sticky top-8">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                             <h3 className="text-lg font-bold text-slate-800 mb-4">AI Toolbox</h3>
                             <div className="space-y-3">
                                <button onClick={handleSummarize} disabled={isLoading || !notes.trim()} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-sky-500 text-white font-semibold rounded-lg shadow hover:bg-sky-600 transition disabled:bg-slate-400">
                                    <ListTreeIcon className="w-5 h-5" />
                                    Summarize Notes
                                </button>
                                <button onClick={handleGenerateMindMap} disabled={isLoading || !notes.trim()} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg shadow hover:bg-emerald-600 transition disabled:bg-slate-400">
                                    <SitemapIcon className="w-5 h-5" />
                                    Generate Mind Map
                                </button>
                                <button onClick={handleDownloadNotes} disabled={isLoading || !notes.trim()} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow hover:bg-slate-700 transition disabled:bg-slate-400">
                                    <DownloadIcon className="w-5 h-5" />
                                    Download Notes
                                </button>
                             </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Upload Document</h3>
                            <input
                                type="file"
                                id="note-file-upload"
                                className="hidden"
                                accept=".txt,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={handleFileChange}
                            />
                            <label
                                htmlFor="note-file-upload"
                                className="cursor-pointer w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-200 transition"
                            >
                                <UploadCloudIcon className="w-5 h-5" />
                                <span>Upload (.txt, .pdf, .docx)</span>
                            </label>
                            {uploadedFileName && (
                                <p className="text-xs text-slate-500 mt-2 text-center break-all">
                                    Loaded: {uploadedFileName}
                                </p>
                            )}
                        </div>
                         {isLoading && (
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center gap-3">
                                <LoadingIcon className="w-6 h-6 text-violet-600" />
                                <span className="text-slate-600 font-semibold">{loadingAction}</span>
                            </div>
                         )}
                         {error && (
                            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
                                <p className="font-bold">Error</p>
                                <p>{error}</p>
                            </div>
                         )}
                    </div>
                </div>

                {summary && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">Summary</h2>
                        <ul className="list-disc list-inside space-y-2 text-slate-700">
                            {summary.summaryPoints.map((point, i) => <li key={i}>{point}</li>)}
                        </ul>
                    </div>
                )}
                
                {mindMap && <MindMap node={mindMap} />}

            </div>
        </>
    );
};