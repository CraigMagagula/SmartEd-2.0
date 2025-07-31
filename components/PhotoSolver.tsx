
import React, { useState, useRef, useEffect } from 'react';
import { solveFromImage, PhotoSolverResponse } from '../services/geminiService';
import DrawingCanvas, { DrawingCanvasRef } from './DrawingCanvas';
import { 
    ArrowLeftIcon, 
    CameraIcon, 
    ImageIcon, 
    PenToolIcon, 
    UploadCloudIcon, 
    LoadingIcon, 
    SparklesIcon, 
    CheckCircleIcon,
    FileQuestionIcon,
    TrashIcon,
    XIcon
} from './icons';


const CameraModal: React.FC<{
    onClose: () => void;
    onTakePicture: (dataUrl: string) => void;
}> = ({ onClose, onTakePicture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                streamRef.current = stream;
            } catch (err) {
                console.error("Camera error:", err);
                setCameraError("Could not access camera. Please check your browser permissions.");
            }
        };

        startCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleCapture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                onTakePicture(dataUrl);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-4 w-full max-w-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-100 bg-black/20 rounded-full p-1 hover:bg-black/40 transition-colors z-10">
                    <XIcon className="w-6 h-6" />
                </button>
                {cameraError ? (
                    <div className="p-8 text-center text-red-600">{cameraError}</div>
                ) : (
                    <>
                        <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-slate-900 aspect-video"></video>
                        <div className="flex justify-center mt-4">
                             <button onClick={handleCapture} className="p-4 bg-violet-600 text-white rounded-full shadow-lg hover:bg-violet-700 transition" aria-label="Take picture">
                                <CameraIcon className="w-8 h-8"/>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};


export const PhotoSolver: React.FC<{ setCurrentPage: (page: string) => void }> = ({ setCurrentPage }) => {
    const [mode, setMode] = useState<'upload' | 'draw'>('upload');
    const [image, setImage] = useState<{ src: string; mimeType: string; } | null>(null);
    const [result, setResult] = useState<PhotoSolverResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const drawingCanvasRef = useRef<DrawingCanvasRef>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 500, height: 300 });

    useEffect(() => {
        const handleResize = () => {
            if (canvasContainerRef.current) {
                const width = canvasContainerRef.current.offsetWidth;
                setCanvasSize({ width: width, height: width * 0.6 });
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [mode]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage({ src: reader.result as string, mimeType: file.type });
                setResult(null);
                setError(null);
            };
            reader.readAsDataURL(file);
        } else {
            setError('Please upload a valid image file.');
        }
    };
    
    const handlePictureTaken = (dataUrl: string) => {
        setImage({ src: dataUrl, mimeType: 'image/jpeg' });
        setResult(null);
        setError(null);
        setIsCameraOpen(false);
    };

    const handleSolve = async () => {
        let imageData = image;
        
        if (mode === 'draw') {
            const isBlank = drawingCanvasRef.current?.isCanvasBlank();
            if (isBlank) {
                setError("Please draw something on the canvas first.");
                return;
            }
            const dataUrl = drawingCanvasRef.current?.getImageDataUrl();
            if (dataUrl) {
                 imageData = { src: dataUrl, mimeType: 'image/png' };
            } else {
                setError("Could not get image from canvas.");
                return;
            }
        }
        
        if (!imageData) {
            setError('Please upload an image or draw the problem first.');
            return;
        }

        setIsLoading(true);
        setResult(null);
        setError(null);

        try {
            // Remove the data URL prefix "data:image/png;base64,"
            const base64String = imageData.src.split(',')[1];
            const response = await solveFromImage(base64String, imageData.mimeType);
            setResult(response);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred while solving.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetAll = () => {
        setImage(null);
        setResult(null);
        setError(null);
        setIsLoading(false);
        setIsCameraOpen(false);
        drawingCanvasRef.current?.clear();
    };

    const ConfidenceMeter: React.FC<{ score: number }> = ({ score }) => {
        const getColor = () => {
            if (score < 40) return 'bg-red-500';
            if (score < 75) return 'bg-amber-500';
            return 'bg-green-500';
        };
        return (
            <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Confidence Score</p>
                <div className="flex items-center gap-3">
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div className={`${getColor()} h-2.5 rounded-full`} style={{ width: `${score}%` }}></div>
                    </div>
                    <span className="font-bold text-slate-800">{score}%</span>
                </div>
            </div>
        );
    };

    const renderInputArea = () => (
        <>
        {isCameraOpen && <CameraModal onClose={() => setIsCameraOpen(false)} onTakePicture={handlePictureTaken} />}
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex border-b border-slate-200 mb-6">
                <button onClick={() => setMode('upload')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${mode === 'upload' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-500 hover:text-slate-600'}`}><ImageIcon className="w-5 h-5" /> Upload Photo</button>
                <button onClick={() => setMode('draw')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${mode === 'draw' ? 'text-violet-600 border-b-2 border-violet-600' : 'text-slate-500 hover:text-slate-600'}`}><PenToolIcon className="w-5 h-5" /> Draw to Solve</button>
            </div>

            {mode === 'upload' && (
                <div className="text-center">
                    <input type="file" id="photo-upload" accept="image/*" className="hidden" onChange={handleFileChange} />
                    {!image ? (
                        <div className="space-y-4">
                            <label htmlFor="photo-upload" className="cursor-pointer p-8 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center hover:bg-slate-50 transition-colors">
                                <UploadCloudIcon className="w-12 h-12 text-slate-400 mb-2" />
                                <p className="font-semibold text-violet-600">Upload a photo</p>
                                <p className="text-xs text-slate-500">From your device</p>
                            </label>
                            <div className="flex items-center gap-2">
                                <hr className="flex-grow border-slate-200" />
                                <span className="text-slate-500 font-semibold text-sm">OR</span>
                                <hr className="flex-grow border-slate-200" />
                            </div>
                            <button onClick={() => setIsCameraOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 text-white font-semibold rounded-lg shadow hover:bg-slate-800 transition-colors">
                                <CameraIcon className="w-5 h-5"/>
                                Use Camera
                            </button>
                        </div>
                    ) : (
                        <div>
                             <img src={image.src} alt="Problem preview" className="max-h-80 mx-auto rounded-lg shadow-md mb-4" />
                             <button onClick={() => setImage(null)} className="w-full font-semibold text-slate-600 hover:text-red-600 transition py-2 flex items-center justify-center gap-2">
                                <TrashIcon className="w-4 h-4" /> Clear Image
                            </button>
                        </div>
                    )}
                </div>
            )}
            
            {mode === 'draw' && (
                 <div ref={canvasContainerRef} className="space-y-4">
                    <DrawingCanvas ref={drawingCanvasRef} width={canvasSize.width} height={canvasSize.height} className="border-2 border-slate-300 rounded-lg shadow-inner cursor-crosshair touch-none" />
                    <button onClick={() => drawingCanvasRef.current?.clear()} className="text-sm font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1 mx-auto">
                        <TrashIcon className="w-4 h-4"/> Clear Canvas
                    </button>
                </div>
            )}
            
            <button onClick={handleSolve} disabled={isLoading || (mode === 'upload' && !image)} className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg shadow hover:bg-violet-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
                {isLoading ? <LoadingIcon className="w-5 h-5"/> : <SparklesIcon className="w-5 h-5" />}
                <span>{isLoading ? 'Solving...' : 'Solve Problem'}</span>
            </button>
        </div>
        </>
    );
    
    const renderResultArea = () => (
         <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div>
                 <h2 className="text-2xl font-bold text-slate-900 mb-2">Solution</h2>
                 <p className="text-slate-500">Here's the breakdown of the solution.</p>
            </div>
            
            {result?.stepByStepExplanation && (
                <div>
                    <h3 className="font-bold text-slate-800 mb-2">Step-by-step Explanation</h3>
                    <ol className="list-decimal list-inside space-y-3 text-slate-700">
                        {result.stepByStepExplanation.map((step, i) => <li key={i}>{step}</li>)}
                    </ol>
                </div>
            )}
            
            {result?.finalAnswer && (
                <div className="bg-violet-50 border-l-4 border-violet-500 p-4 rounded-r-lg">
                    <p className="font-semibold text-slate-800">Final Answer:</p>
                    <p className="text-lg font-bold text-violet-700">{result.finalAnswer}</p>
                </div>
            )}

            {result?.confidenceScore != null && <ConfidenceMeter score={result.confidenceScore} />}

            {result?.relatedConcepts && result.relatedConcepts.length > 0 && (
                <div>
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><FileQuestionIcon className="w-5 h-5 text-sky-600" /> Related Concepts</h3>
                    <div className="flex flex-wrap gap-2">
                        {result.relatedConcepts.map(concept => (
                            <button key={concept.name} className="px-3 py-1.5 bg-sky-100 text-sky-800 text-sm font-semibold rounded-full hover:bg-sky-200 transition-colors">
                                {concept.name} &rarr;
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            <button onClick={resetAll} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition">
                Solve Another Problem
            </button>
        </div>
    );

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <button onClick={() => setCurrentPage('Overview')} className="p-2 rounded-md hover:bg-slate-200 transition-colors">
                    <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Photo Solver</h1>
                    <p className="text-slate-500">Get step-by-step solutions from a photo or a drawing</p>
                </div>
            </div>
            {error && <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-center">{error}</div>}
            {result ? renderResultArea() : renderInputArea()}
        </div>
    );
};
