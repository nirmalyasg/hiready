import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfSlideViewerProps {
  fileUrl: string;
  currentPage: number;
  onLoadSuccess?: (numPages: number) => void;
  className?: string;
}

export default function PdfSlideViewer({ 
  fileUrl, 
  currentPage, 
  onLoadSuccess,
  className = ''
}: PdfSlideViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updateWidth = () => {
      const container = document.getElementById('pdf-slide-container');
      if (container) {
        setContainerWidth(container.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
    onLoadSuccess?.(numPages);
  };

  const handleLoadError = (err: Error) => {
    console.error('PDF load error:', err);
    setError('Failed to load PDF');
    setIsLoading(false);
  };

  return (
    <div 
      id="pdf-slide-container"
      className={`relative flex items-center justify-center bg-white ${className}`}
      style={{ overflow: 'hidden' }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
            <p className="text-slate-500 text-sm">Loading slide...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50">
          <div className="text-center text-red-600">
            <p className="font-medium">Error loading PDF</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      <Document
        file={fileUrl}
        onLoadSuccess={handleLoadSuccess}
        onLoadError={handleLoadError}
        loading={null}
        className="flex items-center justify-center"
      >
        <Page
          pageNumber={currentPage}
          width={Math.min(containerWidth - 32, 1200)}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="shadow-lg"
          loading={null}
        />
      </Document>
    </div>
  );
}
