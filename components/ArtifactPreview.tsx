
import React from 'react';
import { ArtifactData } from '../types';

interface ArtifactPreviewProps {
    artifact: ArtifactData;
}

const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({ artifact }) => {
    return (
        <div className="my-6 rounded-xl border border-zinc-700 overflow-hidden bg-white">
            <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2 flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-zinc-600">Live Preview: {artifact.title}</span>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
            </div>
            <iframe 
                srcDoc={artifact.code}
                className="w-full h-[400px] border-none"
                sandbox="allow-scripts"
            />
        </div>
    );
};

export default ArtifactPreview;