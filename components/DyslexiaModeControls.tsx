import React from 'react';

export interface DyslexiaSettings {
    enabled: boolean;
    font: 'opendyslexic' | 'comic-sans' | 'arial' | 'verdana';
    fontSize: number; // 14-24px
    lineSpacing: number; // 1.5-2.5
    letterSpacing: number; // 0-3px
    wordSpacing: number; // 0-5px
    colorScheme: 'default' | 'high-contrast' | 'cream' | 'blue-tint';
    highlightLinks: boolean;
    simplifyLanguage: boolean;
    textToSpeech: boolean;
    readingGuide: boolean;
}

export const DEFAULT_DYSLEXIA_SETTINGS: DyslexiaSettings = {
    enabled: false,
    font: 'opendyslexic',
    fontSize: 16,
    lineSpacing: 1.8,
    letterSpacing: 1,
    wordSpacing: 2,
    colorScheme: 'default',
    highlightLinks: true,
    simplifyLanguage: false,
    textToSpeech: false,
    readingGuide: false,
};

interface DyslexiaModeControlsProps {
    settings: DyslexiaSettings;
    onChange: (settings: DyslexiaSettings) => void;
}

export const DyslexiaModeControls: React.FC<DyslexiaModeControlsProps> = ({ settings, onChange }) => {
    const updateSetting = <K extends keyof DyslexiaSettings>(key: K, value: DyslexiaSettings[K]) => {
        onChange({ ...settings, [key]: value });
    };

    return (
        <div className="dyslexia-controls space-y-6">
            {/* Main Toggle */}
            <div className="flex items-center justify-between p-4 bg-purple-500/10 border-2 border-purple-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-universal-access text-purple-500 text-2xl"></i>
                    <div>
                        <h3 className="font-bold text-lg">Dyslexia Support Mode</h3>
                        <p className="text-sm opacity-70">Optimize reading experience</p>
                    </div>
                </div>
                <button
                    onClick={() => updateSetting('enabled', !settings.enabled)}
                    className={`relative w-16 h-8 rounded-full transition-colors ${settings.enabled ? 'bg-purple-500' : 'bg-zinc-700'
                        }`}
                >
                    <div
                        className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${settings.enabled ? 'translate-x-9' : 'translate-x-1'
                            }`}
                    ></div>
                </button>
            </div>

            {settings.enabled && (
                <>
                    {/* Font Selection */}
                    <div className="space-y-3">
                        <label className="block font-bold text-sm">
                            <i className="fa-solid fa-font mr-2"></i>
                            Font Style
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: 'opendyslexic', label: 'OpenDyslexic', desc: 'Designed for dyslexia' },
                                { value: 'comic-sans', label: 'Comic Sans', desc: 'Easy to read' },
                                { value: 'arial', label: 'Arial', desc: 'Clean & simple' },
                                { value: 'verdana', label: 'Verdana', desc: 'Wide spacing' },
                            ].map((font) => (
                                <button
                                    key={font.value}
                                    onClick={() => updateSetting('font', font.value as any)}
                                    className={`p-3 rounded-lg border-2 text-left transition-all ${settings.font === font.value
                                            ? 'border-purple-500 bg-purple-500/20'
                                            : 'border-zinc-700 hover:border-zinc-600'
                                        }`}
                                >
                                    <div className="font-bold text-sm">{font.label}</div>
                                    <div className="text-xs opacity-70">{font.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-3">
                        <label className="block font-bold text-sm">
                            <i className="fa-solid fa-text-height mr-2"></i>
                            Font Size: {settings.fontSize}px
                        </label>
                        <input
                            type="range"
                            min="14"
                            max="24"
                            value={settings.fontSize}
                            onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                            className="w-full accent-purple-500"
                        />
                        <div className="flex justify-between text-xs opacity-70">
                            <span>Small (14px)</span>
                            <span>Large (24px)</span>
                        </div>
                    </div>

                    {/* Line Spacing */}
                    <div className="space-y-3">
                        <label className="block font-bold text-sm">
                            <i className="fa-solid fa-align-justify mr-2"></i>
                            Line Spacing: {settings.lineSpacing.toFixed(1)}
                        </label>
                        <input
                            type="range"
                            min="1.5"
                            max="2.5"
                            step="0.1"
                            value={settings.lineSpacing}
                            onChange={(e) => updateSetting('lineSpacing', parseFloat(e.target.value))}
                            className="w-full accent-purple-500"
                        />
                        <div className="flex justify-between text-xs opacity-70">
                            <span>Compact (1.5)</span>
                            <span>Spacious (2.5)</span>
                        </div>
                    </div>

                    {/* Letter Spacing */}
                    <div className="space-y-3">
                        <label className="block font-bold text-sm">
                            <i className="fa-solid fa-text-width mr-2"></i>
                            Letter Spacing: {settings.letterSpacing}px
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="3"
                            value={settings.letterSpacing}
                            onChange={(e) => updateSetting('letterSpacing', parseInt(e.target.value))}
                            className="w-full accent-purple-500"
                        />
                    </div>

                    {/* Word Spacing */}
                    <div className="space-y-3">
                        <label className="block font-bold text-sm">
                            <i className="fa-solid fa-grip-lines mr-2"></i>
                            Word Spacing: {settings.wordSpacing}px
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="5"
                            value={settings.wordSpacing}
                            onChange={(e) => updateSetting('wordSpacing', parseInt(e.target.value))}
                            className="w-full accent-purple-500"
                        />
                    </div>

                    {/* Color Scheme */}
                    <div className="space-y-3">
                        <label className="block font-bold text-sm">
                            <i className="fa-solid fa-palette mr-2"></i>
                            Color Scheme
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: 'default', label: 'Default', bg: 'bg-zinc-900', text: 'text-white' },
                                { value: 'high-contrast', label: 'High Contrast', bg: 'bg-black', text: 'text-yellow-300' },
                                { value: 'cream', label: 'Cream Paper', bg: 'bg-amber-50', text: 'text-gray-900' },
                                { value: 'blue-tint', label: 'Blue Tint', bg: 'bg-blue-950', text: 'text-blue-100' },
                            ].map((scheme) => (
                                <button
                                    key={scheme.value}
                                    onClick={() => updateSetting('colorScheme', scheme.value as any)}
                                    className={`p-3 rounded-lg border-2 transition-all ${scheme.bg} ${scheme.text} ${settings.colorScheme === scheme.value
                                            ? 'border-purple-500 ring-2 ring-purple-500/50'
                                            : 'border-zinc-700 hover:border-zinc-600'
                                        }`}
                                >
                                    <div className="font-bold text-sm">{scheme.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reading Assistance */}
                    <div className="space-y-3">
                        <label className="block font-bold text-sm mb-3">
                            <i className="fa-solid fa-book-reader mr-2"></i>
                            Reading Assistance
                        </label>

                        <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-700 hover:bg-zinc-800/50 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <i className="fa-solid fa-link text-teal-500"></i>
                                <div>
                                    <div className="font-semibold text-sm">Highlight Links</div>
                                    <div className="text-xs opacity-70">Make links more visible</div>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.highlightLinks}
                                onChange={(e) => updateSetting('highlightLinks', e.target.checked)}
                                className="w-5 h-5 accent-purple-500"
                            />
                        </label>

                        <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-700 hover:bg-zinc-800/50 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <i className="fa-solid fa-language text-blue-500"></i>
                                <div>
                                    <div className="font-semibold text-sm">Simplify Language</div>
                                    <div className="text-xs opacity-70">Use simpler words</div>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.simplifyLanguage}
                                onChange={(e) => updateSetting('simplifyLanguage', e.target.checked)}
                                className="w-5 h-5 accent-purple-500"
                            />
                        </label>

                        <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-700 hover:bg-zinc-800/50 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <i className="fa-solid fa-volume-high text-green-500"></i>
                                <div>
                                    <div className="font-semibold text-sm">Text-to-Speech</div>
                                    <div className="text-xs opacity-70">Read messages aloud</div>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.textToSpeech}
                                onChange={(e) => updateSetting('textToSpeech', e.target.checked)}
                                className="w-5 h-5 accent-purple-500"
                            />
                        </label>

                        <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-700 hover:bg-zinc-800/50 cursor-pointer">
                            <div className="flex items-center gap-3">
                                <i className="fa-solid fa-ruler-horizontal text-amber-500"></i>
                                <div>
                                    <div className="font-semibold text-sm">Reading Guide</div>
                                    <div className="text-xs opacity-70">Highlight current line</div>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.readingGuide}
                                onChange={(e) => updateSetting('readingGuide', e.target.checked)}
                                className="w-5 h-5 accent-purple-500"
                            />
                        </label>
                    </div>

                    {/* Preview */}
                    <div className="p-4 rounded-lg border-2 border-purple-500/30 bg-purple-500/5">
                        <div className="text-xs font-bold uppercase tracking-wider opacity-50 mb-2">Preview</div>
                        <div
                            style={{
                                fontFamily: settings.font === 'opendyslexic' ? 'OpenDyslexic, sans-serif' :
                                    settings.font === 'comic-sans' ? 'Comic Sans MS, cursive' :
                                        settings.font === 'arial' ? 'Arial, sans-serif' : 'Verdana, sans-serif',
                                fontSize: `${settings.fontSize}px`,
                                lineHeight: settings.lineSpacing,
                                letterSpacing: `${settings.letterSpacing}px`,
                                wordSpacing: `${settings.wordSpacing}px`,
                            }}
                        >
                            The quick brown fox jumps over the lazy dog. This is how your text will appear with the current settings.
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DyslexiaModeControls;
