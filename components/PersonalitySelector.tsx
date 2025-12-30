import React, { useState } from 'react';
import { AIPersonality, PersonalityMode, PersonalitySettings } from '../types/personalities';
import { personalityService } from '../services/personalityService';

interface PersonalitySelectorProps {
    settings: PersonalitySettings;
    onChange: (settings: PersonalitySettings) => void;
}

export const PersonalitySelector: React.FC<PersonalitySelectorProps> = ({ settings, onChange }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [previewPersonality, setPreviewPersonality] = useState<AIPersonality | null>(null);

    const allPersonalities = personalityService.getAllPersonalities();

    const categories = [
        { id: 'all', name: 'All', icon: '🌟' },
        { id: 'science', name: 'Science', icon: '🔬' },
        { id: 'creative', name: 'Creative', icon: '🎨' },
        { id: 'innovation', name: 'Innovation', icon: '💡' },
        { id: 'strategy', name: 'Strategy', icon: '🎯' },
        { id: 'philosophy', name: 'Philosophy', icon: '🧘' },
        { id: 'motivation', name: 'Motivation', icon: '💪' },
        { id: 'gaming', name: 'Gaming', icon: '🎮' },
        { id: 'technical', name: 'Technical', icon: '🔧' },
    ];

    const filteredPersonalities = selectedCategory === 'all'
        ? allPersonalities
        : allPersonalities.filter(p => p.category === selectedCategory);

    const currentPersonality = settings.fixedPersonalityId
        ? personalityService.getPersonalityById(settings.fixedPersonalityId)
        : allPersonalities[0];

    const handleModeChange = (mode: PersonalityMode) => {
        onChange({ ...settings, mode });
    };

    const handlePersonalitySelect = (personalityId: string) => {
        onChange({ ...settings, fixedPersonalityId: personalityId });
    };

    const handleRandomPersonality = () => {
        const random = personalityService.getRandomPersonality();
        onChange({ ...settings, fixedPersonalityId: random.id });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-inherit pb-2">
                <h3 className="font-bold flex items-center gap-2">
                    <span className="text-2xl">🎭</span>
                    AI Personality System
                </h3>
                <p className="text-sm opacity-70 mt-1">
                    Choose how the AI responds - 40 unique personalities!
                </p>
            </div>

            {/* Mode Selection */}
            <div className="space-y-3">
                <label className="block font-bold text-sm">Personality Mode</label>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => handleModeChange('fixed')}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${settings.mode === 'fixed'
                                ? 'border-teal-500 bg-teal-500/20'
                                : 'border-zinc-700 hover:border-zinc-600'
                            }`}
                    >
                        <div className="font-bold text-sm flex items-center gap-2">
                            <span>📌</span> Fixed Personality
                        </div>
                        <div className="text-xs opacity-70 mt-1">Always use selected personality</div>
                    </button>

                    <button
                        onClick={() => handleModeChange('auto-match')}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${settings.mode === 'auto-match'
                                ? 'border-purple-500 bg-purple-500/20'
                                : 'border-zinc-700 hover:border-zinc-600'
                            }`}
                    >
                        <div className="font-bold text-sm flex items-center gap-2">
                            <span>🤖</span> Smart Auto-Match
                        </div>
                        <div className="text-xs opacity-70 mt-1">AI picks best personality for question</div>
                    </button>

                    <button
                        onClick={() => handleModeChange('random')}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${settings.mode === 'random'
                                ? 'border-amber-500 bg-amber-500/20'
                                : 'border-zinc-700 hover:border-zinc-600'
                            }`}
                    >
                        <div className="font-bold text-sm flex items-center gap-2">
                            <span>🎲</span> Random Each Time
                        </div>
                        <div className="text-xs opacity-70 mt-1">Different personality every question</div>
                    </button>

                    <button
                        onClick={() => handleModeChange('conversation')}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${settings.mode === 'conversation'
                                ? 'border-blue-500 bg-blue-500/20'
                                : 'border-zinc-700 hover:border-zinc-600'
                            }`}
                    >
                        <div className="font-bold text-sm flex items-center gap-2">
                            <span>💬</span> Conversation Mode
                        </div>
                        <div className="text-xs opacity-70 mt-1">Same personality for entire chat</div>
                    </button>
                </div>
            </div>

            {/* Current/Selected Personality */}
            {settings.mode === 'fixed' && currentPersonality && (
                <div className="p-4 rounded-lg border-2 border-teal-500/30 bg-teal-500/10">
                    <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-sm">Selected Personality</div>
                        <button
                            onClick={handleRandomPersonality}
                            className="px-3 py-1 rounded-lg border border-teal-500/50 hover:bg-teal-500/20 transition-all text-xs font-bold"
                        >
                            🎲 Random
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">{currentPersonality.emoji}</span>
                        <div className="flex-1">
                            <div className="font-bold">{currentPersonality.name}</div>
                            <div className="text-sm opacity-70">{currentPersonality.description}</div>
                            <div className="text-xs opacity-50 mt-1 italic">"{currentPersonality.catchphrase}"</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Filter */}
            <div className="space-y-3">
                <label className="block font-bold text-sm">Browse Personalities</label>
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-lg border transition-all text-sm font-semibold ${selectedCategory === cat.id
                                    ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                                    : 'border-zinc-700 hover:border-zinc-600 opacity-70 hover:opacity-100'
                                }`}
                        >
                            {cat.icon} {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Personality Grid */}
            <div className="space-y-2">
                <div className="text-sm font-bold opacity-70">
                    {filteredPersonalities.length} personalit{filteredPersonalities.length === 1 ? 'y' : 'ies'}
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-2 scrollbar-thin">
                    {filteredPersonalities.map(personality => (
                        <button
                            key={personality.id}
                            onClick={() => {
                                handlePersonalitySelect(personality.id);
                                setPreviewPersonality(personality);
                            }}
                            onMouseEnter={() => setPreviewPersonality(personality)}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${settings.fixedPersonalityId === personality.id
                                    ? 'border-teal-500 bg-teal-500/20'
                                    : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">{personality.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm truncate">{personality.name}</div>
                                    <div className="text-xs opacity-70 truncate">{personality.description}</div>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {personality.traits.slice(0, 3).map((trait, idx) => (
                                    <span
                                        key={idx}
                                        className="text-xs px-2 py-0.5 rounded-full bg-zinc-700/50 opacity-70"
                                    >
                                        {trait}
                                    </span>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Preview Panel */}
            {previewPersonality && (
                <div className="p-4 rounded-lg border-2 border-purple-500/30 bg-purple-500/5">
                    <div className="text-xs font-bold uppercase tracking-wider opacity-50 mb-2">Preview</div>
                    <div className="flex items-start gap-3 mb-3">
                        <span className="text-4xl">{previewPersonality.emoji}</span>
                        <div className="flex-1">
                            <div className="font-bold text-lg">{previewPersonality.name}</div>
                            <div className="text-sm opacity-70">{previewPersonality.description}</div>
                        </div>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div>
                            <span className="font-bold opacity-70">Style:</span> {previewPersonality.style}
                        </div>
                        <div>
                            <span className="font-bold opacity-70">Catchphrase:</span> "{previewPersonality.catchphrase}"
                        </div>
                        <div>
                            <span className="font-bold opacity-70">Expertise:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {previewPersonality.expertise.map((exp, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded-full bg-purple-500/20 text-xs">
                                        {exp}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Display Options */}
            <div className="space-y-3">
                <label className="block font-bold text-sm">Display Options</label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-700 hover:bg-zinc-800/50 cursor-pointer">
                    <div>
                        <div className="font-semibold text-sm">Show Personality Badge</div>
                        <div className="text-xs opacity-70">Display personality in chat messages</div>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.showBadge}
                        onChange={(e) => onChange({ ...settings, showBadge: e.target.checked })}
                        className="w-5 h-5 accent-teal-500"
                    />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-700 hover:bg-zinc-800/50 cursor-pointer">
                    <div>
                        <div className="font-semibold text-sm">Show Match Confidence</div>
                        <div className="text-xs opacity-70">Display % match in auto-match mode</div>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.showConfidence}
                        onChange={(e) => onChange({ ...settings, showConfidence: e.target.checked })}
                        className="w-5 h-5 accent-teal-500"
                    />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-700 hover:bg-zinc-800/50 cursor-pointer">
                    <div>
                        <div className="font-semibold text-sm">Allow Manual Override</div>
                        <div className="text-xs opacity-70">Let user change personality mid-conversation</div>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.allowManualOverride}
                        onChange={(e) => onChange({ ...settings, allowManualOverride: e.target.checked })}
                        className="w-5 h-5 accent-teal-500"
                    />
                </label>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-500/10 border-2 border-blue-500/30 rounded-lg">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <i className="fa-solid fa-lightbulb text-blue-500"></i>
                    How It Works
                </h4>
                <ul className="text-sm space-y-1.5 opacity-80">
                    <li className="flex items-start gap-2">
                        <i className="fa-solid fa-check text-green-500 mt-0.5"></i>
                        <span><strong>Fixed:</strong> Always use your chosen personality</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <i className="fa-solid fa-check text-green-500 mt-0.5"></i>
                        <span><strong>Auto-Match:</strong> AI analyzes your question and picks the best expert</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <i className="fa-solid fa-check text-green-500 mt-0.5"></i>
                        <span><strong>Random:</strong> Surprise me with a different personality each time!</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <i className="fa-solid fa-check text-green-500 mt-0.5"></i>
                        <span><strong>Conversation:</strong> First message picks personality, then stays consistent</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default PersonalitySelector;
