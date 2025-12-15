import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface DocumentImportProps {
  onImportComplete: (extractedData: Record<string, string>) => void;
  onCancel: () => void;
}

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  error?: string;
}

export default function DocumentImport({ onImportComplete, onCancel }: DocumentImportProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      const ext = file.name.toLowerCase();
      return ext.endsWith('.pdf') || 
             ext.endsWith('.docx') || 
             ext.endsWith('.doc') ||
             ext.endsWith('.pptx') ||
             ext.endsWith('.ppt') ||
             ext.endsWith('.xlsx') ||
             ext.endsWith('.xls') ||
             ext.endsWith('.txt');
    });

    const uploadedFiles: UploadedFile[] = validFiles.map(file => ({
      file,
      id: crypto.randomUUID(),
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...uploadedFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

const analyzeDocuments = async () => {
  if (files.length === 0) return;

  setIsAnalyzing(true);
  setAnalysisProgress('Processing documents...');

  try {
    // Process all files
    const processedFiles = await Promise.all(
      files.map(async (uploadedFile) => {
        try {
          setFiles(prev => prev.map(f => 
            f.id === uploadedFile.id ? { ...f, status: 'processing' } : f
          ));

          const base64Data = await convertFileToBase64(uploadedFile.file);
          
          return {
            id: uploadedFile.id,
            name: uploadedFile.file.name,
            type: uploadedFile.file.type,
            base64Data,
            success: true
          };
        } catch (error) {
          console.error('File processing error:', error);
          setFiles(prev => prev.map(f => 
            f.id === uploadedFile.id 
              ? { ...f, status: 'error', error: 'Failed to process file' } 
              : f
          ));
          return {
            id: uploadedFile.id,
            name: uploadedFile.file.name,
            success: false
          };
        }
      })
    );

    const successfulFiles = processedFiles.filter(f => f.success);

    if (successfulFiles.length === 0) {
      throw new Error('No files could be processed');
    }

    setAnalysisProgress('Analyzing with Claude AI...');

    // Call your API route instead of Claude directly
    const response = await fetch('/api/analyze-documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: successfulFiles })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      // Surface server-provided error messages (including rate-limit info)
      const serverMessage = data.error + (data.headers ? `\nServer headers: ${JSON.stringify(data.headers)}` : '');
      throw new Error(serverMessage);
    }

    const extractedData = data.extractedData;

    // Mark all files as complete
    setFiles(prev => prev.map(f => ({ ...f, status: 'complete' })));
    
    setAnalysisProgress('Complete! Review extracted information...');
    
    // Pass extracted data back to parent
    setTimeout(() => {
      onImportComplete(extractedData);
    }, 1000);

  } catch (error) {
    console.error('Analysis error:', error);
    setAnalysisProgress('');
    setFiles(prev => prev.map(f => 
      f.status === 'processing' 
        ? { ...f, status: 'error', error: 'Analysis failed' } 
        : f
    ));
    // Show a more descriptive message to the user when available
    const msg = error instanceof Error ? error.message : String(error);
    alert(`Failed to analyze documents: ${msg}\nPlease try again or enter information manually.`);
  } finally {
    setIsAnalyzing(false);
  }
};

  const getFileIcon = (filename: string) => {
    const ext = filename.toLowerCase();
    if (ext.endsWith('.pdf')) return '📄';
    if (ext.endsWith('.docx') || ext.endsWith('.doc')) return '📝';
    if (ext.endsWith('.pptx') || ext.endsWith('.ppt')) return '📊';
    if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) return '📈';
    return '📎';
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="text-blue-400" size={20} />;
      case 'processing':
        return <Loader2 className="text-yellow-400 animate-spin" size={20} />;
      case 'complete':
        return <CheckCircle className="text-green-400" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-400" size={20} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/20 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Import Discovery Documents</h2>
              <p className="text-blue-200 mt-1">Upload PDFs, Word docs, PowerPoint, or Excel files</p>
            </div>
            <button
              onClick={onCancel}
              className="text-white/60 hover:text-white transition"
              disabled={isAnalyzing}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
              isDragging
                ? 'border-blue-400 bg-blue-400/10'
                : 'border-white/30 hover:border-blue-400/50 bg-white/5'
            } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Upload className="mx-auto text-blue-400 mb-4" size={48} />
            <p className="text-white font-semibold mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-blue-200 text-sm">
              Supports PDF, Word, PowerPoint, Excel, and text files
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isAnalyzing}
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-white font-semibold">Uploaded Files ({files.length})</h3>
              {files.map(file => (
                <div
                  key={file.id}
                  className="bg-white/10 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{getFileIcon(file.file.name)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {file.file.name}
                      </p>
                      <p className="text-blue-200 text-sm">
                        {(file.file.size / 1024).toFixed(1)} KB
                        {file.error && (
                          <span className="text-red-400 ml-2">• {file.error}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusIcon(file.status)}
                    {file.status === 'pending' && !isAnalyzing && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-red-400 hover:text-red-300 transition"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          {analysisProgress && (
            <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="text-blue-400 animate-spin" size={24} />
                <p className="text-white font-medium">{analysisProgress}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={analyzeDocuments}
              disabled={files.length === 0 || isAnalyzing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileText size={20} />
                  Analyze Documents
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={isAnalyzing}
              className="px-6 py-3 rounded-lg border border-white/30 text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-200 text-sm">
              <strong>💡 Tip:</strong> Upload meeting notes, proposals, technical diagrams, or any documents containing customer information. Claude will automatically extract and organize the relevant details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}