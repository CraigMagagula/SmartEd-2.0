
import React, { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { 
    generateTitleAndTags, 
    semanticSearch,
    getAiResponse,
    summarizeText,
    generateFlashcards,
    generateQuizFromSelection,
    Summary,
    QuizQuestion
} from '../services/geminiService';
import { MiniQuizModal } from './MiniQuizModal';
import { ChatInterface } from './ChatInterface';
import type { Message, Flashcard } from '../types';
import { 
    ArrowLeftIcon, 
    BookmarkIcon, 
    FileTextIcon, 
    LinkIcon, 
    TagIcon, 
    UploadCloudIcon, 
    XIcon, 
    LoadingIcon,
    SparklesIcon,
    ClipboardPasteIcon,
    FileQuestionIcon,
    LayersIcon,
    TextIcon,
    RefreshCwIcon,
    ArrowRightIcon
} from './icons';


// Make pdfjsLib and mammoth available from the global scope
declare const pdfjsLib: any;
declare const mammoth: any;
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;
}

// --- TYPES AND MOCK DATA ---
export interface LibraryItem {
    id: string;
    title: string;
    content: string;
    type: 'pdf' | 'docx' | 'txt' | 'url' | 'paste';
    tags: string[];
    bookmarked: boolean;
    progress: number; // 0-100
    createdAt: number;
}

const sampleLibraryItems: LibraryItem[] = [
    {
        id: '1',
        title: "Introduction to Photosynthesis",
        content: "Photosynthesis is a process used by plants, algae, and certain bacteria to convert light energy into chemical energy, through a process that converts carbon dioxide and water into glucose (a sugar) and oxygen. This process is crucial for life on Earth as it produces most of the oxygen in the atmosphere. The overall balanced chemical equation for photosynthesis is 6 CO2 + 6 H2O → C6H12O6 + 6 O2. This means that six molecules of carbon dioxide and six molecules of water are used to produce one molecule of glucose and six molecules of oxygen. The process takes place in chloroplasts, which are small organelles found in plant cells. Chloroplasts contain a green pigment called chlorophyll, which absorbs the light energy needed for photosynthesis.",
        type: 'paste',
        tags: ['Biology', 'Plants', 'Energy'],
        bookmarked: true,
        progress: 75,
        createdAt: Date.now() - 1000 * 60 * 60 * 24,
    },
    {
        id: '2',
        title: "The Basics of Supply and Demand",
        content: "Supply and demand is a fundamental concept in economics that describes the relationship between the quantity of a commodity that producers wish to sell at various prices and the quantity that consumers wish to buy. It is the main model of price determination used in economic theory. The price of a commodity is settled at the point where the quantity demanded is equal to the quantity supplied, known as the equilibrium point. When demand exceeds supply, prices tend to rise. Conversely, when supply exceeds demand, prices tend to fall.",
        type: 'paste',
        tags: ['Economics', 'Market', 'Theory'],
        bookmarked: false,
        progress: 20,
        createdAt: Date.now(),
    }
];

// --- MAIN LIBRARY COMPONENT ---
export const Library: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const [libraryItems, setLibraryItems] = useLocalStorage<LibraryItem[]>('libraryItems', sampleLibraryItems);
    const [selectedContent, setSelectedContent] = useState<LibraryItem | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    const handleUpdateItem = (updatedItem: LibraryItem) => {
        setLibraryItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
        if (selectedContent && selectedContent.id === updatedItem.id) {
            setSelectedContent(updatedItem);
        }
    };
    
    const handleAddItem = (newItem: Omit<LibraryItem, 'id' | 'createdAt'>) => {
        const fullNewItem: LibraryItem = {
            ...newItem,
            id: Date.now().toString(),
            createdAt: Date.now(),
        };
        setLibraryItems(prev => [fullNewItem, ...prev]);
    };
    
    if (selectedContent) {
        return (
            <ContentDetailView 
                item={selectedContent} 
                onBack={() => setSelectedContent(null)}
                onUpdate={handleUpdateItem}
            />
        );
    }
    
    return (
        <div className="h-full">
            <AddContentModal 
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddItem}
            />
            <LibraryGridView 
                items={libraryItems}
                onSelect={setSelectedContent}
                onUpdate={handleUpdateItem}
                onAdd={() => setIsAddModalOpen(true)}
            />
        </div>
    );
};

// --- LIBRARY GRID VIEW ---
const LibraryGridView: React.FC<{
    items: LibraryItem[],
    onSelect: (item: LibraryItem) => void,
    onUpdate: (item: LibraryItem) => void,
    onAdd: () => void
}> = ({ items, onSelect, onUpdate, onAdd }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredItems, setFilteredItems] = useState<LibraryItem[]>(items);
    const [isLoading, setIsLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'bookmarked'>('all');
    
    useEffect(() => {
        let results = items;
        if(activeFilter === 'bookmarked') {
            results = results.filter(item => item.bookmarked);
        }
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            results = results.filter(item => 
                item.title.toLowerCase().includes(lowercasedTerm) || 
                item.tags.some(tag => tag.toLowerCase().includes(lowercasedTerm))
            );
        }
        setFilteredItems(results);
    }, [items, searchTerm, activeFilter]);
    
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            setFilteredItems(items);
            return;
        }
        setIsLoading(true);
        const documentInfos = items.map(item => ({ id: item.id, title: item.title }));
        try {
            const relevantIds = await semanticSearch(searchTerm, documentInfos);
            const searchResults = items.filter(item => relevantIds.includes(item.id));
            setFilteredItems(searchResults);
        } catch (error) {
            console.error(error);
            setFilteredItems([]); // Or show an error message
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">My Library</h1>
                    <p className="text-slate-500">Your personal content repository</p>
                </div>
                <button onClick={onAdd} className="px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg shadow hover:bg-violet-700 transition-colors">
                    + Add Content
                </button>
            </div>

            <form onSubmit={handleSearch} className="relative">
                <input 
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by concept (e.g., 'energy conversion in plants')"
                    className="w-full pl-12 pr-4 py-3 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <SparklesIcon className="w-5 h-5" />
                </div>
                 {isLoading && <div className="absolute right-4 top-1/2 -translate-y-1/2"><LoadingIcon className="w-5 h-5 text-violet-600"/></div>}
            </form>

            <div>
                <div className="border-b border-slate-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveFilter('all')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeFilter === 'all' ? 'border-violet-500 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>All Content</button>
                        <button onClick={() => setActiveFilter('bookmarked')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeFilter === 'bookmarked' ? 'border-violet-500 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Bookmarked</button>
                    </nav>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map(item => <ContentCard key={item.id} item={item} onSelect={onSelect} onUpdate={onUpdate} />)}
                    {filteredItems.length === 0 && <p className="text-slate-500 col-span-full text-center py-8">No content found. Try a different search or add new content.</p>}
                </div>
            </div>
        </div>
    );
};

// --- CONTENT CARD ---
const ContentCard: React.FC<{ 
    item: LibraryItem, 
    onSelect: (item: LibraryItem) => void,
    onUpdate: (item: LibraryItem) => void,
}> = ({ item, onSelect, onUpdate }) => {
    
    const getFileIcon = (type: LibraryItem['type']) => {
        const commonClasses = "w-5 h-5";
        switch (type) {
            case 'pdf': return <FileTextIcon className={`${commonClasses} text-red-500`} />;
            case 'docx': return <FileTextIcon className={`${commonClasses} text-blue-500`} />;
            case 'txt': return <FileTextIcon className={`${commonClasses} text-gray-500`} />;
            case 'paste': return <ClipboardPasteIcon className={`${commonClasses} text-green-500`} />;
            case 'url': return <LinkIcon className={`${commonClasses} text-sky-500`} />;
            default: return <FileTextIcon className={`${commonClasses} text-gray-500`} />;
        }
    }

    const handleBookmark = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUpdate({ ...item, bookmarked: !item.bookmarked });
    };

    return (
        <div onClick={() => onSelect(item)} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full cursor-pointer hover:border-violet-400 hover:shadow-md transition-all">
            <div className="flex-grow">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="text-lg font-bold text-slate-800 pr-2">{item.title}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                       {getFileIcon(item.type)}
                       <button onClick={handleBookmark} className="p-1 rounded-full text-slate-400 hover:bg-amber-100">
                           <BookmarkIcon className={`w-5 h-5 transition-colors ${item.bookmarked ? 'text-amber-500 fill-amber-400' : 'hover:text-amber-500'}`} />
                       </button>
                    </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                    {item.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">{tag}</span>
                    ))}
                </div>
            </div>
            <div className="mt-4">
                <p className="text-xs text-slate-400 font-medium mb-1">{item.progress}% Read</p>
                <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div className="bg-violet-600 h-1.5 rounded-full" style={{ width: `${item.progress}%` }}></div>
                </div>
            </div>
        </div>
    );
};

// --- CONTENT DETAIL VIEW (INTERACTIVE WORKSPACE) ---
const ContentDetailView: React.FC<{
    item: LibraryItem,
    onBack: () => void,
    onUpdate: (item: LibraryItem) => void
}> = ({ item, onBack, onUpdate }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    
    // States for AI tools
    const [activeTab, setActiveTab] = useState<'qa' | 'summary'>('qa');
    const [chatMessages, setChatMessages] = useState<Message[]>([{ id: Date.now(), sender: 'ai', text: `Hi! Ask me anything about "${item.title}".`}]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    
    // States for highlight-to-action
    const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
    const [miniQuiz, setMiniQuiz] = useState<QuizQuestion[] | null>(null);
    const [generatedFlashcards, setGeneratedFlashcards] = useState<Flashcard[] | null>(null);

    // Progress Tracking
    useEffect(() => {
        const handleScroll = () => {
            if (contentRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
                if (scrollHeight <= clientHeight) {
                    if (item.progress !== 100) onUpdate({ ...item, progress: 100 });
                    return;
                }
                const progress = Math.min(100, Math.round((scrollTop / (scrollHeight - clientHeight)) * 100));
                if (progress !== item.progress) {
                    onUpdate({ ...item, progress });
                }
            }
        };
        const currentRef = contentRef.current;
        currentRef?.addEventListener('scroll', handleScroll);
        if (currentRef) {
            currentRef.scrollTop = (item.progress / 100) * (currentRef.scrollHeight - currentRef.clientHeight);
        }
        return () => currentRef?.removeEventListener('scroll', handleScroll);
    }, [item, onUpdate]);

    // Text Selection Handling
    const handleMouseUp = () => {
        const selectedText = window.getSelection()?.toString() || '';
        if (selectedText.length > 20) {
            const range = window.getSelection()?.getRangeAt(0);
            if (range) {
                const rect = range.getBoundingClientRect();
                setSelection({ text: selectedText, x: rect.left + rect.width / 2, y: rect.bottom });
            }
        } else {
            setSelection(null);
        }
    };
    
    const handleGenerateMiniQuiz = async () => {
        if (!selection?.text) return;
        setIsLoadingAi(true);
        try {
            const result = await generateQuizFromSelection(selection.text);
            setMiniQuiz(result);
        } catch(e) { console.error(e) } finally {
            setIsLoadingAi(false);
            setSelection(null);
        }
    };
    
    const handleGenerateFlashcards = async () => {
        if (!selection?.text) return;
        setIsLoadingAi(true);
        try {
            const result = await generateFlashcards(selection.text);
            setGeneratedFlashcards(result);
        } catch(e) { console.error(e) } finally {
            setIsLoadingAi(false);
            setSelection(null);
        }
    };
    
    // AI Actions
    const handleSendMessage = async (text: string) => {
        setChatMessages(prev => [...prev, { id: Date.now(), sender: 'user', text }]);
        setIsLoadingAi(true);
        try {
            const responseText = await getAiResponse(text, item.content);
            setChatMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: responseText }]);
        } catch (e) {
            const errorText = e instanceof Error ? e.message : 'An unknown error occurred.';
            setChatMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: `Error: ${errorText}` }]);
        } finally {
            setIsLoadingAi(false);
        }
    };

    const handleGenerateSummary = async () => {
        setIsLoadingAi(true);
        try {
            const result = await summarizeText(item.content);
            setSummary(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingAi(false);
        }
    };
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <MiniQuizModal isOpen={!!miniQuiz} onClose={() => setMiniQuiz(null)} quiz={miniQuiz || []} />
            <FlashcardViewerModal isOpen={!!generatedFlashcards} onClose={() => setGeneratedFlashcards(null)} flashcards={generatedFlashcards || []} />
            {selection && (
                <div 
                    className="absolute z-20 bg-slate-800 text-white rounded-lg shadow-lg flex divide-x divide-slate-600"
                    style={{ left: selection.x, top: selection.y, transform: 'translateX(-50%) translateY(8px)' }}
                >
                    <button onClick={handleGenerateFlashcards} className="flex items-center gap-2 text-sm px-3 py-2 hover:bg-slate-700 rounded-l-lg"><LayersIcon className="w-4 h-4" /> Flashcards</button>
                    <button onClick={handleGenerateMiniQuiz} className="flex items-center gap-2 text-sm px-3 py-2 hover:bg-slate-700 rounded-r-lg"><FileQuestionIcon className="w-4 h-4" /> Quiz</button>
                </div>
            )}

            {/* Left Panel: Document Viewer */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-full overflow-hidden">
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200 flex-shrink-0">
                    <button onClick={onBack} className="p-2 rounded-md hover:bg-slate-200 transition-colors"><ArrowLeftIcon className="w-5 h-5 text-slate-600" /></button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{item.title}</h1>
                        <div className="flex items-center gap-2 mt-1"><TagIcon className="w-4 h-4 text-slate-400" />{item.tags.map(tag => (<span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">{tag}</span>))}</div>
                    </div>
                </div>
                <div ref={contentRef} onMouseUp={handleMouseUp} onBlur={() => setTimeout(() => setSelection(null), 200)} className="flex-grow overflow-y-auto prose max-w-none prose-slate pr-4 -mr-4">
                    <p className="whitespace-pre-wrap">{item.content}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 flex-shrink-0">
                    <div className="w-full bg-slate-200 rounded-full h-2.5"><div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${item.progress}%` }}></div></div>
                    <p className="text-center text-sm text-slate-500 mt-2">Reading Progress: {item.progress}%</p>
                </div>
            </div>

            {/* Right Panel: AI Tools */}
            <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
                <div className="border-b border-slate-200 flex-shrink-0">
                    <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
                        <button onClick={() => setActiveTab('qa')} className={`flex items-center gap-1.5 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'qa' ? 'border-violet-500 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><FileQuestionIcon className="w-5 h-5"/>Q&A</button>
                        <button onClick={() => setActiveTab('summary')} className={`flex items-center gap-1.5 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'summary' ? 'border-violet-500 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><TextIcon className="w-5 h-5"/>Summary</button>
                    </nav>
                </div>
                {activeTab === 'qa' ? (
                    <div className="flex-grow flex flex-col h-0">
                        <ChatInterface messages={chatMessages} onSendMessage={handleSendMessage} isLoading={isLoadingAi} error={null} />
                    </div>
                ) : (
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {summary ? (
                            <ul className="list-disc list-inside space-y-2 text-slate-700">
                                {summary.summaryPoints.map((point, i) => <li key={i}>{point}</li>)}
                            </ul>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-slate-500 mb-4">Distill this document into key points.</p>
                                <button onClick={handleGenerateSummary} disabled={isLoadingAi} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg shadow hover:bg-violet-700 disabled:bg-slate-400">
                                    {isLoadingAi ? <LoadingIcon className="w-5 h-5"/> : <SparklesIcon className="w-5 h-5"/>}
                                    Generate Summary
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};


// --- ADD CONTENT MODAL ---
const AddContentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAdd: (item: Omit<LibraryItem, 'id'| 'createdAt'>) => void;
}> = ({ isOpen, onClose, onAdd }) => {
    const [mode, setMode] = useState<'upload' | 'paste'>('upload');
    const [pastedText, setPastedText] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');

    const resetState = () => {
        setMode('upload');
        setPastedText('');
        setFile(null);
        setIsLoading(false);
        setError(null);
        setLoadingMessage('');
    };

    const handleClose = () => {
        resetState();
        onClose();
    }

    const handleSubmit = async () => {
        setIsLoading(true);
        setError(null);
        let content = '';
        let type: LibraryItem['type'] = 'paste';

        try {
            if (mode === 'paste') {
                if (!pastedText.trim()) throw new Error('Please paste some text.');
                content = pastedText;
                type = 'paste';
                setLoadingMessage('Analyzing text...');
            } else if (file) {
                 setLoadingMessage(`Reading ${file.name}...`);
                const fileType = file.type;
                const fileName = file.name.toLowerCase();

                if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
                    content = await parsePdfFile(file);
                    type = 'pdf';
                } else if (
                    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                    fileName.endsWith('.docx')
                ) {
                    content = await parseDocxFile(file);
                    type = 'docx';
                } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
                    content = await file.text();
                    type = 'txt';
                } else {
                    throw new Error('Unsupported file type. Please use .txt, .pdf, or .docx.');
                }
            } else {
                throw new Error("No content provided.");
            }
            
            if (!content.trim()) throw new Error("Could not extract any content.");

            setLoadingMessage('Generating title and tags...');
            const { title, tags } = await generateTitleAndTags(content);

            onAdd({ title, tags, content, type, bookmarked: false, progress: 0 });
            handleClose();

        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const parsePdfFile = async (pdfFile: File): Promise<string> => {
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
        const arrayBuffer = await docxFile.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg relative space-y-4">
                <button onClick={handleClose} disabled={isLoading} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed">
                    <XIcon className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold text-slate-800 text-center">Add Content to Library</h2>
                
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setMode('upload')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${mode === 'upload' ? 'bg-white shadow' : 'text-slate-500'}`}>Upload File</button>
                    <button onClick={() => setMode('paste')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${mode === 'paste' ? 'bg-white shadow' : 'text-slate-500'}`}>Paste Text</button>
                </div>

                {mode === 'upload' ? (
                     <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg text-center">
                        <input type="file" id="lib-file-upload" className="hidden" accept=".txt,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => setFile(e.target.files?.[0] || null)} />
                        <label htmlFor="lib-file-upload" className="cursor-pointer">
                            <UploadCloudIcon className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                            <p className="font-semibold text-violet-600">{file ? 'Change file' : 'Choose a file'}</p>
                            <p className="text-xs text-slate-500">TXT, PDF, or DOCX</p>
                            {file && <p className="text-sm text-slate-600 mt-2 font-medium break-all">{file.name}</p>}
                        </label>
                    </div>
                ) : (
                    <textarea value={pastedText} onChange={e => setPastedText(e.target.value)} rows={8} placeholder="Paste your notes here..." className="w-full p-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-md shadow-sm resize-y" />
                )}

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <button onClick={handleSubmit} disabled={isLoading || (mode === 'upload' && !file) || (mode === 'paste' && !pastedText.trim())} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg shadow hover:bg-violet-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
                    {isLoading ? <><LoadingIcon className="w-5 h-5"/><span>{loadingMessage || 'Processing...'}</span></> : 'Add to Library'}
                </button>
            </div>
        </div>
    );
};

const FlashcardViewerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    flashcards: Flashcard[];
}> = ({ isOpen, onClose, flashcards }) => {
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCurrentCardIndex(0);
            setIsFlipped(false);
        }
    }, [isOpen]);
    
    if (!isOpen || flashcards.length === 0) return null;

    const handleNextCard = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentCardIndex(prev => (prev + 1) % flashcards.length), 150);
    };

    const handlePrevCard = () => {
        setIsFlipped(false);
        setTimeout(() => setCurrentCardIndex(prev => (prev - 1 + flashcards.length) % flashcards.length), 150);
    };

    const card = flashcards[currentCardIndex];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative transform transition-all space-y-4">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600" aria-label="Close"><XIcon className="w-6 h-6" /></button>
                <h3 className="text-xl font-bold text-slate-800 text-center">Generated Flashcards</h3>
                <p className="text-slate-500 text-center -mt-2 mb-4">{currentCardIndex + 1} / {flashcards.length}</p>

                <div className="w-full h-64 [perspective:1000px]">
                    <div className={`relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] ${isFlipped ? 'rotate-y-180' : ''}`} onClick={() => setIsFlipped(!isFlipped)}>
                        <div className="absolute w-full h-full [backface-visibility:hidden] bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center p-6 cursor-pointer">
                            <p className="text-2xl font-bold text-slate-800 text-center">{card.term}</p>
                        </div>
                        <div className="absolute w-full h-full [backface-visibility:hidden] bg-slate-100 border-2 border-slate-200 rounded-xl flex items-center justify-center p-6 rotate-y-180 cursor-pointer">
                            <p className="text-lg text-slate-700 text-center">{card.definition}</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                    <button onClick={handlePrevCard} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200" aria-label="Previous Card"><ArrowLeftIcon className="w-5 h-5" /></button>
                    <button onClick={() => setIsFlipped(!isFlipped)} className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition">
                        <RefreshCwIcon className="w-5 h-5" /> Flip Card
                    </button>
                    <button onClick={handleNextCard} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200" aria-label="Next Card"><ArrowRightIcon className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
    );
};