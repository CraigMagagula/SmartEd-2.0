import React, { useState } from 'react';
import { generateQuiz, generateQuizFromContent, QuizQuestion } from '../services/geminiService';
import { ArrowLeftIcon, LoadingIcon, HelpCircleIcon, UploadCloudIcon, ClipboardPasteIcon, LinkIcon, DownloadIcon } from './icons';
import { QuizDisplay } from './QuizDisplay';
import type { QuizResult } from '../types';

// Make pdfjsLib available from the global scope (loaded via script tag in index.html)
declare const pdfjsLib: any;
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;
}

// Make mammoth.js available from the global scope
declare const mammoth: any;

const grades = [
  "Kindergarten", "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", 
  "5th Grade", "6th Grade", "7th Grade", "8th Grade", "9th Grade", 
  "10th Grade", "11th Grade", "12th Grade"
];
const subjects = [
  "Math", 
  "Science", 
  "History", 
  "English/Language Arts", 
  "Geography",
  "Business Studies",
  "Computer Application Technology",
  "Accounting",
  "Life Orientation",
  "Economics"
];

interface QuizGeneratorProps {
  setCurrentPage: (page: string) => void;
  onCompleteQuiz: (result: Omit<QuizResult, 'date'>) => void;
}

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

export const QuizGenerator: React.FC<QuizGeneratorProps> = ({ setCurrentPage, onCompleteQuiz }) => {
  const [mode, setMode] = useState<'subject' | 'content'>('subject');
  const [contentMode, setContentMode] = useState<'paste' | 'upload' | 'url'>('paste');
  
  // State for subject mode
  const [grade, setGrade] = useState<string>(grades[9]);
  const [subject, setSubject] = useState<string>(subjects[0]);

  // State for content mode
  const [pastedText, setPastedText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Generating...');
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const resetQuizState = () => {
    setQuiz(null);
    setError(null);
  };
  
  const handleGenerateQuiz = async () => {
    setIsLoading(true);
    resetQuizState();
    
    try {
      let generatedQuiz: QuizQuestion[] | null = null;
      if (mode === 'subject') {
        setLoadingMessage('Generating quiz...');
        generatedQuiz = await generateQuiz(grade, subject);
      } else {
        let content = '';
        if (contentMode === 'paste') {
            if (!pastedText.trim()) throw new Error('Please paste some text.');
            content = pastedText;
        } else if (contentMode === 'upload' && file) {
            setLoadingMessage('Reading file...');
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
        } else if (contentMode === 'url') {
            if (!url.trim()) throw new Error('Please enter a URL.');
            // Note: This is a simplified fetch and may be blocked by CORS on many websites.
            // A server-side proxy would be needed for a robust implementation.
            setLoadingMessage('Fetching content from URL...');
            try {
                const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
                if (!response.ok) throw new Error(`Failed to fetch URL content. Status: ${response.status}`);
                const html = await response.text();
                // Simple text extraction
                const doc = new DOMParser().parseFromString(html, 'text/html');
                content = doc.body.innerText || "";
            } catch (e) {
                console.error("URL fetch error:", e);
                throw new Error("Could not fetch content from the URL. The site may be blocking requests. Try another source.");
            }
        }
        
        if (!content.trim()) {
            throw new Error('Could not extract any content to generate a quiz from.');
        }

        setLoadingMessage('Generating quiz from content...');
        generatedQuiz = await generateQuizFromContent(content);
      }
      
      if (generatedQuiz && generatedQuiz.length > 0) {
        setQuiz(generatedQuiz);
      } else {
        setError("The AI couldn't generate a quiz. Please try different options or content.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleQuizCompletion = (result: { score: number, total: number }) => {
      onCompleteQuiz({
          ...result,
          subject: mode === 'subject' ? subject : 'Custom Content',
      });
  };

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

  const handleTryAgain = () => resetQuizState();

  const handleDownloadQuiz = () => {
    if (!quiz) return;

    let quizText = `Quiz on ${mode === 'subject' ? subject : 'your content'}\n\n`;
    quizText += '================================\n\n';

    quiz.forEach((q, index) => {
        quizText += `Question ${index + 1}: ${q.question}\n`;
        q.options.forEach(option => {
            quizText += `- ${option}\n`;
        });
        quizText += `\nCorrect Answer: ${q.answer}\n`;
        quizText += '\n--------------------------------\n\n';
    });

    downloadTextFile(quizText, 'smarted-quiz.txt');
  };

  const renderQuizSetup = () => (
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg mb-6">
            <button onClick={() => setMode('subject')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${mode === 'subject' ? 'bg-white shadow' : 'text-slate-500'}`}>From Subject</button>
            <button onClick={() => setMode('content')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${mode === 'content' ? 'bg-white shadow' : 'text-slate-500'}`}>From My Content</button>
        </div>

        {mode === 'subject' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="grade-select" className="block text-sm font-medium text-slate-700 mb-1">Grade Level</label>
                    <select id="grade-select" value={grade} onChange={e => setGrade(e.target.value)} className="w-full p-2 bg-slate-800 text-white border border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
                        {grades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="subject-select" className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                    <select id="subject-select" value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-2 bg-slate-800 text-white border border-slate-600 rounded-md shadow-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500">
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
        )}

        {mode === 'content' && (
            <div className="space-y-4">
                <div className="flex flex-wrap border-b border-slate-200">
                    <button onClick={() => setContentMode('paste')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${contentMode === 'paste' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-500'}`}><ClipboardPasteIcon className="w-5 h-5" /> Paste Text</button>
                    <button onClick={() => setContentMode('upload')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${contentMode === 'upload' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-500'}`}><UploadCloudIcon className="w-5 h-5" /> Upload File</button>
                    <button onClick={() => setContentMode('url')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${contentMode === 'url' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-500'}`}><LinkIcon className="w-5 h-5" /> From URL</button>
                </div>
                {contentMode === 'paste' && <textarea value={pastedText} onChange={e => setPastedText(e.target.value)} rows={5} placeholder="Paste your notes here..." className="w-full p-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-md shadow-sm resize-y" />}
                {contentMode === 'upload' && (
                    <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg text-center">
                        <input type="file" id="file-upload" className="hidden" accept=".txt,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => setFile(e.target.files?.[0] || null)} />
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <UploadCloudIcon className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                            <p className="font-semibold text-violet-600">{file ? 'Change file' : 'Choose a file'}</p>
                            <p className="text-xs text-slate-500">TXT, PDF, or DOCX</p>
                            {file && <p className="text-sm text-slate-600 mt-2 font-medium break-all">{file.name}</p>}
                        </label>
                    </div>
                )}
                {contentMode === 'url' && <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/article" className="w-full p-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-md shadow-sm" />}
            </div>
        )}

        <button onClick={handleGenerateQuiz} disabled={isLoading} className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg shadow hover:bg-violet-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
            {isLoading ? <LoadingIcon className="w-5 h-5"/> : <HelpCircleIcon className="w-5 h-5" />}
            <span>{isLoading ? loadingMessage : 'Generate Quiz'}</span>
        </button>
        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
    </div>
  );

  const renderQuiz = () => (
    <div className="space-y-8">
        <QuizDisplay quiz={quiz!} onCompleteQuiz={handleQuizCompletion} />
        <div className="flex gap-4">
            <button onClick={handleTryAgain} className="w-full px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg shadow hover:bg-violet-700 transition-colors">
                Create Another Quiz
            </button>
             <button
                onClick={handleDownloadQuiz}
                className="flex-shrink-0 px-4 py-3 bg-slate-600 text-white font-semibold rounded-lg shadow hover:bg-slate-700 transition-colors"
                aria-label="Download Quiz"
            >
                <DownloadIcon className="w-5 h-5" />
            </button>
        </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => setCurrentPage('Overview')} className="p-2 rounded-md hover:bg-slate-200 transition-colors">
            <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
        </button>
        <div>
            <h1 className="text-3xl font-bold text-slate-900">Quiz Generator</h1>
            <p className="text-slate-500">Create a personalized quiz on any subject or from your own content</p>
        </div>
      </div>
      
      {!quiz ? renderQuizSetup() : renderQuiz()}
    </div>
  );
};
