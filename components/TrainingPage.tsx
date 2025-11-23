
import React, { useMemo } from 'react';
import { ChatSession } from '../types';
import { exportSessionsToJSONL, exportKnowledgeBase, downloadFile } from '../services/trainingService';

interface TrainingPageProps {
  sessions: ChatSession[];
  onClose: () => void;
}

const TrainingPage: React.FC<TrainingPageProps> = ({ sessions, onClose }) => {
  
  const stats = useMemo(() => {
    let totalMessages = 0;
    let totalChunks = 0;
    let userTurns = 0;
    let aiTurns = 0;
    let thumbsUp = 0;
    let thumbsDown = 0;

    sessions.forEach(s => {
        totalMessages += s.messages.length;
        s.messages.forEach(m => {
            if (m.sender === 'user') userTurns++;
            else {
                aiTurns++;
                if (m.feedback?.rating === 'up') thumbsUp++;
                if (m.feedback?.rating === 'down') thumbsDown++;
            }
        });
        if (s.knowledgeBase) totalChunks += s.knowledgeBase.length;
    });

    return { totalMessages, totalChunks, userTurns, aiTurns, sessionCount: sessions.length, thumbsUp, thumbsDown };
  }, [sessions]);

  const handleDownloadJSONL = (onlyPositive: boolean) => {
    // Filter sessions or messages based on ratings
    let exportData = sessions;
    if (onlyPositive) {
        // Create a deep copy and filter out non-positive exchanges
        // Ideally, we export sessions that contain at least one positive interaction, 
        // or filter down to specific turn pairs. For now, we export full sessions that have high rating.
        exportData = sessions.filter(s => s.messages.some(m => m.feedback?.rating === 'up'));
    }
    const data = exportSessionsToJSONL(exportData);
    const filename = `ranger_training_data${onlyPositive ? '_high_quality' : ''}_${new Date().toISOString().slice(0,10)}.jsonl`;
    downloadFile(data, filename, 'application/json');
  };

  const handleDownloadKB = () => {
    const data = exportKnowledgeBase(sessions);
    const filename = `ranger_knowledge_base_${new Date().toISOString().slice(0,10)}.json`;
    downloadFile(data, filename, 'application/json');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 sticky top-0 z-10">
            <div>
                <h2 className="text-2xl font-bold">Model Training Center</h2>
                <p className="text-gray-500 dark:text-zinc-400 text-sm">Curate and export your research data for LLM Fine-tuning.</p>
            </div>
            <button 
                onClick={onClose} 
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
            >
                <i className="fa-solid fa-xmark text-xl"></i>
            </button>
        </div>

        <div className="p-6 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Stats Card */}
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                    <div className="text-gray-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Total Conversations</div>
                    <div className="text-3xl font-mono font-bold text-teal-600 dark:text-teal-400">{stats.sessionCount}</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                    <div className="text-gray-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Human Feedback</div>
                    <div className="flex items-center gap-4">
                         <div className="flex items-center gap-1 text-green-500 font-bold">
                             <i className="fa-solid fa-thumbs-up"></i> {stats.thumbsUp}
                         </div>
                         <div className="flex items-center gap-1 text-red-500 font-bold">
                             <i className="fa-solid fa-thumbs-down"></i> {stats.thumbsDown}
                         </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                    <div className="text-gray-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Vector Chunks</div>
                    <div className="text-3xl font-mono font-bold text-purple-600 dark:text-purple-400">{stats.totalChunks}</div>
                </div>
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                    <div className="text-gray-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Dataset Balance</div>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-2 flex-1 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden flex">
                            <div className="bg-blue-500 h-full" style={{ width: `${(stats.userTurns / stats.totalMessages) * 100}%` }}></div>
                        </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                        <span>User ({stats.userTurns})</span>
                        <span>AI ({stats.aiTurns})</span>
                    </div>
                </div>
            </div>

            {/* Export Actions */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <i className="fa-solid fa-file-export text-teal-500"></i>
                        Export Datasets
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-zinc-700 rounded-xl hover:border-teal-500/50 transition-colors">
                            <div>
                                <div className="font-semibold">Raw Chat History (JSONL)</div>
                                <div className="text-sm text-gray-500 dark:text-zinc-400">Full export of all conversations.</div>
                            </div>
                            <button onClick={() => handleDownloadJSONL(false)} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-medium">
                                Download All
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-green-500/20 bg-green-500/5 rounded-xl hover:border-green-500/50 transition-colors">
                            <div>
                                <div className="font-semibold text-green-500">High Quality Dataset (RLHF)</div>
                                <div className="text-sm text-gray-500 dark:text-zinc-400">Only conversations with Positive Feedback (Thumbs Up).</div>
                            </div>
                            <button onClick={() => handleDownloadJSONL(true)} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-green-900/20">
                                Download Best
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-zinc-700 rounded-xl hover:border-purple-500/50 transition-colors">
                            <div>
                                <div className="font-semibold">Knowledge Base Vectors</div>
                                <div className="text-sm text-gray-500 dark:text-zinc-400">Raw chunks extracted from documents for RAG analysis.</div>
                            </div>
                            <button onClick={handleDownloadKB} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-medium border border-zinc-600">
                                Download JSON
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 text-white p-6 rounded-2xl border border-zinc-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <h3 className="text-lg font-bold mb-2 relative z-10">RLHF Training Guide</h3>
                    <ul className="space-y-2 text-sm text-zinc-300 relative z-10">
                        <li className="flex items-start gap-2">
                            <i className="fa-solid fa-check-circle text-green-400 mt-0.5"></i>
                            <strong>Rate Responses:</strong> Use Thumbs Up/Down to label quality. This is the gold standard for fine-tuning.
                        </li>
                        <li className="flex items-start gap-2">
                            <i className="fa-solid fa-check-circle text-teal-400 mt-0.5"></i>
                            <strong>Curate:</strong> Use the "High Quality" export to train models on only your best interactions.
                        </li>
                        <li className="flex items-start gap-2">
                            <i className="fa-solid fa-check-circle text-teal-400 mt-0.5"></i>
                            <strong>JSONL:</strong> This format is ready for Gemini 1.5 Pro/Flash tuning jobs.
                        </li>
                    </ul>
                </div>
            </div>

            {/* Script / Code Snippet Area */}
            <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 font-mono text-xs">
                 <div className="flex justify-between items-center mb-4 text-zinc-400">
                    <span className="uppercase font-bold">Python Training Snippet</span>
                    <button className="hover:text-white"><i className="fa-regular fa-copy"></i></button>
                 </div>
                 <div className="text-zinc-300 overflow-x-auto">
<pre>{`import google.generativeai as genai

# Configure API
genai.configure(api_key="YOUR_API_KEY")

# Upload Dataset
training_file = genai.upload_file(
    path="ranger_training_data_high_quality.jsonl"
)

# Create Tuning Job
operation = genai.create_tuned_model(
    source_model="models/gemini-1.5-flash-001-tuning",
    training_data=training_file,
    id="my-ranger-rlhf-model",
    epoch_count=5,
    batch_size=4,
    learning_rate=0.001,
)

print("RLHF Tuning started...")
`}</pre>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default TrainingPage;
