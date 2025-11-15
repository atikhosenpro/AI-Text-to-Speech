
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { generateSpeech } from './services/geminiService';
import { decode, decodeAudioData } from './utils/audio';

const initialText = `Hi, I’m Atik Hosen — a professional WordPress LMS developer.

I specialize in creating and customizing eLearning platforms using LearnDash, TutorLMS, LearnPress, and LifterLMS. I also work with top education themes like Eduma, eCademy, and MasterStudy.

I build complete LMS websites, design course structures, set up quizzes, assignments, certificates, dashboards, and optimize the full learning experience for students.

I also integrate Google Meet, Zoom, BuddyPress, and Youzify to create a powerful community and live class environment.

If you need custom features, I build advanced solutions like dynamic course elements, custom profile tabs, progress tracking, and tailor-made WordPress plugins.

I focus on clean design, fast performance, and smooth user experience.

If you want a fully functional and professional LMS website, feel free to contact me.
Let’s build your eLearning platform together.`;

const voices = [
    { id: 'Kore', name: 'Kore (Female)' },
    { id: 'Puck', name: 'Puck (Male)' },
    { id: 'Charon', name: 'Charon (Male)' },
    { id: 'Fenrir', name: 'Fenrir (Male)' },
    { id: 'Zephyr', name: 'Zephyr (Female)' },
];

const SpeakerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
    </svg>
);

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);

const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
);

const App: React.FC = () => {
    const [text, setText] = useState<string>(initialText);
    const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState<string | null>(null);
    const [rate, setRate] = useState<number>(1.0);
    const [pitch, setPitch] = useState<number>(0.0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const stopPlayback = useCallback(() => {
        if (sourceNodeRef.current) {
            sourceNodeRef.current.stop();
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    const handleSpeak = async () => {
        if (isPlaying) {
            stopPlayback();
            return;
        }
        
        if (isLoading || isPreviewLoading) return;

        if (!text.trim()) {
            setError("Please enter some text to generate speech.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (!audioContextRef.current) {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContext({ sampleRate: 24000 });
            }
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const base64Audio = await generateSpeech(text, selectedVoice, rate, pitch);
            const audioData = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);

            stopPlayback(); 

            const sourceNode = audioContextRef.current.createBufferSource();
            sourceNode.buffer = audioBuffer;
            sourceNode.connect(audioContextRef.current.destination);
            
            sourceNode.onended = () => {
                setIsPlaying(false);
                sourceNodeRef.current = null;
            };

            sourceNode.start();
            sourceNodeRef.current = sourceNode;
            setIsPlaying(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            setIsPlaying(false);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePreview = async (voiceId: string) => {
        if (isLoading || isPreviewLoading) {
            return;
        }
        stopPlayback();
    
        setIsPreviewLoading(voiceId);
        setError(null);
    
        try {
            if (!audioContextRef.current) {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContext({ sampleRate: 24000 });
            }
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }
    
            const base64Audio = await generateSpeech("Hello, this is a voice preview.", voiceId, rate, pitch);
            const audioData = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
    
            const sourceNode = audioContextRef.current.createBufferSource();
            sourceNode.buffer = audioBuffer;
            sourceNode.connect(audioContextRef.current.destination);
            
            sourceNode.onended = () => {
                setIsPlaying(false);
                sourceNodeRef.current = null;
            };
    
            sourceNode.start();
            sourceNodeRef.current = sourceNode;
            setIsPlaying(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during preview.");
            setIsPlaying(false);
        } finally {
            setIsPreviewLoading(null);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="min-h-screen bg-base-100 text-text-primary flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-2xl mx-auto space-y-8">
                <header className="text-center">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-secondary">
                        AI Text-to-Speech
                    </h1>
                    <p className="mt-2 text-lg text-text-secondary">
                        Convert your text into lifelike speech with Gemini.
                    </p>
                </header>
                
                <main className="bg-base-200 p-6 rounded-2xl shadow-2xl space-y-6">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter text here..."
                        className="w-full h-64 p-4 bg-base-300 text-text-primary rounded-lg border-2 border-transparent focus:border-brand-primary focus:ring-brand-primary transition duration-300 resize-none placeholder-gray-500"
                        aria-label="Text to convert to speech"
                    />

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Select a Voice
                        </label>
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full flex justify-between items-center p-3 bg-base-300 text-text-primary rounded-lg border-2 border-transparent focus:border-brand-primary focus:ring-brand-primary transition duration-300"
                                aria-haspopup="listbox"
                                aria-expanded={isDropdownOpen}
                            >
                                <span>{voices.find(v => v.id === selectedVoice)?.name}</span>
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </button>
                            {isDropdownOpen && (
                                <ul className="absolute z-10 w-full mt-1 bg-base-300 rounded-lg shadow-lg overflow-hidden border border-base-100" role="listbox">
                                    {voices.map((voice) => (
                                        <li
                                            key={voice.id}
                                            className={`flex items-center justify-between p-3 cursor-pointer transition-colors duration-200 hover:bg-brand-dark/50 ${selectedVoice === voice.id ? 'bg-brand-dark' : ''}`}
                                            onClick={() => {
                                                setSelectedVoice(voice.id);
                                                setIsDropdownOpen(false);
                                            }}
                                            role="option"
                                            aria-selected={selectedVoice === voice.id}
                                        >
                                            <span className="flex-grow">{voice.name}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handlePreview(voice.id);
                                                }}
                                                disabled={isLoading || isPreviewLoading !== null}
                                                className="p-1 rounded-full text-text-secondary hover:text-text-primary hover:bg-brand-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                aria-label={`Preview voice ${voice.name}`}
                                            >
                                                {isPreviewLoading === voice.id ? (
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                ) : (
                                                    <PlayIcon />
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="rate" className="text-sm font-medium text-text-secondary">
                                        Speaking Rate
                                    </label>
                                    <span className="text-sm font-mono bg-base-300 px-2 py-0.5 rounded">
                                        {rate.toFixed(2)}x
                                    </span>
                                </div>
                                <input
                                    id="rate"
                                    type="range"
                                    min="0.25"
                                    max="4.0"
                                    step="0.05"
                                    value={rate}
                                    onChange={(e) => setRate(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-base-300 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                                    aria-label="Speaking rate"
                                />
                            </div>
                            <div>
                                 <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="pitch" className="text-sm font-medium text-text-secondary">
                                        Pitch
                                    </label>
                                    <span className="text-sm font-mono bg-base-300 px-2 py-0.5 rounded">
                                        {pitch.toFixed(1)}
                                    </span>
                                </div>
                                <input
                                    id="pitch"
                                    type="range"
                                    min="-20.0"
                                    max="20.0"
                                    step="0.5"
                                    value={pitch}
                                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-base-300 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                                    aria-label="Pitch"
                                />
                            </div>
                        </div>
                         <div className="flex justify-end">
                            <button 
                                onClick={() => { setRate(1.0); setPitch(0.0); }}
                                className="text-sm text-brand-light hover:text-white transition-colors duration-200"
                                aria-label="Reset rate and pitch to defaults"
                            >
                                Reset to Defaults
                            </button>
                        </div>
                    </div>


                     {error && (
                        <div className="bg-red-500/20 text-red-300 p-3 rounded-lg text-center" role="alert">
                            {error}
                        </div>
                    )}
                    
                    <button
                        onClick={handleSpeak}
                        disabled={isLoading || isPreviewLoading !== null}
                        className="flex items-center justify-center gap-3 w-full h-14 px-8 text-lg font-semibold rounded-full text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-brand-light"
                    >
                        {isLoading ? (
                            <LoadingSpinner />
                        ) : isPlaying ? (
                            <>
                                <StopIcon /> Stop
                            </>
                        ) : (
                            <>
                                <SpeakerIcon /> Speak
                            </>
                        )}
                    </button>
                </main>
            </div>
        </div>
    );
};

export default App;
