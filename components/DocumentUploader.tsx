
import React, { useState, useCallback } from 'react';
import { FileTextIcon, UploadCloudIcon, CheckCircleIcon } from './icons';

interface DocumentUploaderProps {
  onDocumentUpload: (text: string) => void;
  initialFileName?: string | null;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onDocumentUpload, initialFileName }) => {
  const [fileName, setFileName] = useState<string | null>(initialFileName || null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        onDocumentUpload(text);
        setFileName(file.name);
        localStorage.setItem('documentFileName', file.name);
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a valid .txt file.');
    }
  }, [onDocumentUpload]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 backdrop-blur-sm shadow-2xl p-6 h-full flex flex-col">
      <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
        <FileTextIcon className="w-6 h-6" />
        Knowledge Base
      </h2>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`flex-1 flex flex-col justify-center items-center border-2 border-dashed rounded-lg transition-colors duration-300 ${isDragOver ? 'border-cyan-400 bg-gray-700/50' : 'border-gray-600'}`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".txt"
          onChange={handleFileChange}
        />
        {fileName ? (
          <div className="text-center p-4">
            <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="text-gray-300 font-medium">File Loaded:</p>
            <p className="text-cyan-400 break-all">{fileName}</p>
            <button
                onClick={() => document.getElementById('file-upload')?.click()}
                className="mt-4 px-4 py-2 bg-cyan-600/80 text-white rounded-md hover:bg-cyan-600 transition-colors text-sm"
            >
                Upload another file
            </button>
          </div>
        ) : (
          <label htmlFor="file-upload" className="text-center cursor-pointer p-4">
            <UploadCloudIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">
              <span className="font-semibold text-cyan-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">.TXT files only</p>
          </label>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-4 text-center">
        Your document provides context for the AI. The chat will reset when you upload a new file.
      </p>
    </div>
  );
};
