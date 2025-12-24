import React, { useEffect, useState, useRef } from 'react';
import { Camera, Volume2, VolumeX, Music } from 'lucide-react';
import { AsciiConfig } from '../types';

interface UIOverlayProps {
  onAsciiConvert: (files: FileList, config: AsciiConfig) => Promise<void>;
  isConverting: boolean;
  celebrationMessage?: string;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  onAsciiConvert,
  isConverting,
  celebrationMessage
}) => {
  const [showMsg, setShowMsg] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (celebrationMessage) {
      setShowMsg(true);
      const timer = setTimeout(() => setShowMsg(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [celebrationMessage]);

  useEffect(() => {
    // Festive high-energy track
    const audio = new Audio('https://www.chosic.com/wp-content/uploads/2021/11/We-Wish-You-a-Merry-Christmas.mp3');
    audio.loop = true;
    audioRef.current = audio;
    return () => {
      audio.pause();
    };
  }, []);

  const toggleSound = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.play().catch(e => console.log("Sound play blocked by browser. Interaction required."));
    } else {
      audioRef.current.pause();
    }
    setIsMuted(!isMuted);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const config: AsciiConfig = {
        density: 'medium',
        cellSize: 1,
        useColor: true
      };
      await onAsciiConvert(e.target.files, config);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none p-6 md:p-10 z-20 flex flex-col justify-between overflow-hidden">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="flex gap-4 items-center">
          <div className="pointer-events-auto">
            <label 
              htmlFor="tree-upload"
              className={`btn-pill kawaii-gradient flex items-center gap-4 px-6 py-3 text-white cursor-pointer select-none group shadow-2xl ${isConverting ? 'opacity-70 pointer-events-none' : ''}`}
            >
              {isConverting ? (
                <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera size={32} className="group-hover:rotate-12 transition-transform" />
              )}
              <span className="font-black text-xl uppercase tracking-[0.2em] font-cute">
                {isConverting ? 'Hanging...' : 'Add Ornament'}
              </span>
            </label>
            <input 
              type="file" 
              onChange={handleFileChange} 
              accept="image/*"
              multiple
              className="hidden" 
              id="tree-upload" 
            />
          </div>
        </div>
      </div>

      {/* Message Overlay */}
      {showMsg && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="glass px-16 py-10 rounded-[60px] text-white text-center shadow-[0_0_100px_rgba(255,255,255,0.3)] animate-[bounce_1s_infinite]">
            <h2 className="text-7xl font-black font-cute mb-4 text-yellow-300 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">Ho Ho Ho!</h2>
            <p className="text-3xl font-bold italic tracking-wide">{celebrationMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UIOverlay;