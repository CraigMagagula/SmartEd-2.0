import React, { useState, useEffect, useRef } from 'react';
import { 
    searchEducationalVideos, 
    generateVideoSummary, 
    generateQuizFromVideo, 
    YouTubeVideo, 
    VideoSummary, 
    QuizQuestion 
} from '../services/geminiService';
import { QuizDisplay } from './QuizDisplay';
import { LoadingIcon, SparklesIcon, TextIcon, HelpCircleIcon } from './icons';

interface YouTubeSearchProps {
  setCurrentPage: (page: string) => void;
}

export const YouTubeSearch: React.FC<YouTubeSearchProps> = ({ setCurrentPage }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [videos, setVideos] = useState<YouTubeVideo[]>([]);
    const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // For AI tools
    const [isToolLoading, setIsToolLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'summary' | 'quiz'>('summary');
    const [summary, setSummary] = useState<VideoSummary | null>(null);
    const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);

    const playerRef = useRef<HTMLDivElement>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) return;
        setIsLoading(true);
        setError(null);
        setVideos([]);
        try {
            const results = await searchEducationalVideos(searchTerm);
            setVideos(results);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to search for videos.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSelectVideo = (video: YouTubeVideo) => {
        if (selectedVideo?.videoId === video.videoId) return;
        setSelectedVideo(video);
        setSummary(null);
        setQuiz(null);
        setActiveTab('summary');
    };

    useEffect(() => {
        if (selectedVideo && playerRef.current) {
            playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [selectedVideo]);
    
    const handleGenerateSummary = async () => {
        if (!selectedVideo) return;
        setIsToolLoading(true);
        setSummary(null);
        try {
            const result = await generateVideoSummary(selectedVideo.title);
            setSummary(result);
        } catch (e) {
            // TODO: Handle error in UI
            console.error(e);
        } finally {
            setIsToolLoading(false);
        }
    };

    const handleGenerateQuiz = async () => {
        if (!selectedVideo) return;
        setIsToolLoading(true);
        setQuiz(null);
        try {
            const result = await generateQuizFromVideo(selectedVideo.title);
            setQuiz(result);
        } catch (e) {
            // TODO: Handle error in UI
            console.error(e);
        } finally {
            setIsToolLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {selectedVideo && (
                <div ref={playerRef} className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 flex flex-col space-y-4">
                            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                                <iframe
                                    key={selectedVideo.videoId}
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube-nocookie.com/embed/${selectedVideo.videoId}?autoplay=1`}
                                    title="YouTube video player"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    className="border-0"
                                ></iframe>
                            </div>
                             <div className="bg-white p-4 rounded-xl border border-slate-200">
                                <h2 className="text-xl font-bold text-slate-800">{selectedVideo.title}</h2>
                                <p className="text-md text-slate-500">{selectedVideo.channelName}</p>
                            </div>
                        </div>

                        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden max-h-[500px] lg:max-h-none">
                            <div className="border-b border-slate-200 flex-shrink-0">
                                <nav className="-mb-px flex space-x-4 px-4">
                                    <button onClick={() => setActiveTab('summary')} className={`flex items-center gap-1.5 py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'summary' ? 'border-violet-500 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><TextIcon className="w-5 h-5"/>Summary</button>
                                    <button onClick={() => setActiveTab('quiz')} className={`flex items-center gap-1.5 py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'quiz' ? 'border-violet-500 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><HelpCircleIcon className="w-5 h-5"/>Quiz</button>
                                </nav>
                            </div>
                            <div className="flex-grow overflow-y-auto p-4">
                                {isToolLoading && <div className="flex justify-center items-center h-full"><LoadingIcon className="w-8 h-8 text-violet-600"/></div>}
                                {!isToolLoading && activeTab === 'summary' && (
                                     summary ? (
                                        <div className="space-y-4 animate-fade-in">
                                            <div>
                                                <h4 className="font-bold text-slate-700">TL;DR</h4>
                                                <p className="text-slate-600">{summary.tldr}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-700">Key Points</h4>
                                                <ul className="list-disc list-inside space-y-1 text-slate-600">
                                                    {summary.keyPoints.map((p, i) => <li key={i}>{p}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                     ) : (
                                         <button onClick={handleGenerateSummary} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg shadow hover:bg-violet-700">
                                             <SparklesIcon className="w-5 h-5"/> Generate Summary
                                         </button>
                                     )
                                )}
                                {!isToolLoading && activeTab === 'quiz' && (
                                    quiz ? (
                                        <div className="animate-fade-in">
                                            <QuizDisplay quiz={quiz} onCompleteQuiz={() => {}} />
                                        </div>
                                    ) : (
                                        <button onClick={handleGenerateQuiz} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white font-semibold rounded-lg shadow hover:bg-violet-700">
                                             <SparklesIcon className="w-5 h-5"/> Generate Quiz
                                         </button>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-slate-900">Discover Educational Videos</h1>
                <form onSubmit={handleSearch} className="relative">
                    <input 
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search for educational videos (e.g., 'how does photosynthesis work?')"
                        className="w-full pl-12 pr-4 py-3 bg-slate-800 text-white placeholder-slate-400 border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                        disabled={isLoading}
                    />
                    <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" disabled={isLoading}>
                        <SparklesIcon className="w-5 h-5" />
                    </button>
                     {isLoading && <div className="absolute right-4 top-1/2 -translate-y-1/2"><LoadingIcon className="w-5 h-5 text-violet-600"/></div>}
                </form>
                {error && <p className="text-red-500 text-center">{error}</p>}
                
                <h2 className="text-xl font-semibold text-slate-800 mt-4">Search Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {videos.map(video => (
                        <div key={video.videoId} onClick={() => handleSelectVideo(video)} className={`bg-white rounded-xl border shadow-sm cursor-pointer hover:shadow-lg hover:border-violet-300 transition-all overflow-hidden group ${selectedVideo?.videoId === video.videoId ? 'ring-2 ring-violet-500 border-violet-500' : 'border-slate-200'}`}>
                            <div className="relative">
                                <img src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`} alt={video.title} className="w-full aspect-video object-cover"/>
                                {selectedVideo?.videoId === video.videoId && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <p className="text-white font-bold text-lg">Now Playing</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-slate-800 line-clamp-2">{video.title}</h3>
                                <p className="text-sm text-slate-500 mt-1">{video.channelName}</p>
                            </div>
                        </div>
                    ))}
                </div>
                 {videos.length === 0 && !isLoading && !error && (
                    <div className="text-center py-16 text-slate-500">
                        <p>Find educational videos from YouTube to start learning.</p>
                    </div>
                )}
            </div>
        </div>
    );
};