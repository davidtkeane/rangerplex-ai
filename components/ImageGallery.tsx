
import React, { useState, useEffect } from 'react';
import { GeneratedImage } from '../types';

interface ImageGalleryProps {
    images: GeneratedImage[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
    const [selected, setSelected] = useState<GeneratedImage | null>(null);

    // ESC key to close preview
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selected) {
                setSelected(null);
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [selected]);

    if (!images || images.length === 0) return null;

    const handleDownload = async (img: GeneratedImage, e?: React.MouseEvent) => {
        e?.stopPropagation();

        try {
            // Use proxy server to download image (bypasses CORS)
            const proxyUrl = `http://localhost:3000/api/image/download?url=${encodeURIComponent(img.url)}`;

            // Fetch through proxy
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();

            // Create a local blob URL
            const blobUrl = URL.createObjectURL(blob);

            // Create download link
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `rangerplex_${img.provider}_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download image. Please try right-click → Save Image As...');
        }
    };

    return (
        <div className="my-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((img, idx) => (
                    <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border border-white/10 cursor-pointer" onClick={() => setSelected(img)}>
                        <img src={img.url} alt={img.prompt} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center">
                            <span className="font-bold uppercase text-teal-400">{img.provider}</span>
                            <button
                                onClick={(e) => handleDownload(img, e)}
                                className="px-2 py-1 bg-teal-600 rounded text-white hover:bg-teal-500 transition-colors"
                                title="Download"
                            >
                                <i className="fa-solid fa-download"></i>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selected && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-8" onClick={() => setSelected(null)}>
                    {/* Close button - Top Right */}
                    <button
                        onClick={() => setSelected(null)}
                        className="absolute top-4 right-4 w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-2xl transition-all shadow-lg hover:scale-110 z-10"
                        title="Close (ESC)"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>

                    <div className="max-w-4xl w-full flex flex-col gap-4" onClick={e => e.stopPropagation()}>
                        <img src={selected.url} className="w-full h-auto rounded-lg shadow-2xl border border-white/20" />
                        <div className="flex justify-between items-center text-white bg-black/50 p-4 rounded-lg backdrop-blur">
                            <div className="flex-1">
                                <div className="text-xs uppercase font-bold text-teal-400 mb-1">{selected.provider}</div>
                                <div className="text-sm opacity-80">{selected.prompt}</div>
                            </div>
                            <button
                                onClick={() => handleDownload(selected)}
                                className="px-6 py-3 bg-teal-600 hover:bg-teal-500 rounded-lg font-bold text-sm uppercase transition-colors flex items-center gap-2 shadow-lg"
                            >
                                <i className="fa-solid fa-download"></i>
                                Download
                            </button>
                        </div>
                        <div className="text-center text-xs text-white/50">
                            Click outside or press ESC to close
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageGallery;