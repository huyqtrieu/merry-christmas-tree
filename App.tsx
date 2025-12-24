
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import Scene, { SceneHandle } from './components/Scene';
import UIOverlay from './components/UIOverlay';
import { TreeState, AsciiConfig } from './types';
import { convertImageToAscii } from './utils/asciiConverter';

const App: React.FC = () => {
  const [treeState] = useState<TreeState>({
    lightsOn: true,
    autoRotate: true,
    celebrationMode: false,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  });

  const sceneRef = useRef<SceneHandle>(null);
  const [asciiTextures, setAsciiTextures] = useState<THREE.CanvasTexture[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState('');

  const processFile = (file: File, config: AsciiConfig): Promise<THREE.CanvasTexture> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = await convertImageToAscii(e.target?.result as string, config);
          const texture = new THREE.CanvasTexture(result.canvas);
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          resolve(texture);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsDataURL(file);
    });
  };

  const handleAsciiConvert = async (files: FileList, config: AsciiConfig) => {
    setIsConverting(true);
    try {
      const promises = Array.from(files).map(file => processFile(file, config));
      const textures = await Promise.all(promises);
      setAsciiTextures(prev => [...prev, ...textures]);
      
      // Success message as requested
      setCelebrationMsg("Ditmecongsan");
      if (sceneRef.current) {
        for (let i = 0; i < 6; i++) {
          setTimeout(() => sceneRef.current?.launchFirework(), i * 400);
        }
      }
    } catch (err) {
      console.error('Conversion failed', err);
    } finally {
      setIsConverting(false);
    }
  };

  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const seeds = [
          'https://images.unsplash.com/photo-1543589077-47d81606c1ad?auto=format&fit=crop&q=80&w=600',
          'https://images.unsplash.com/photo-1512470876302-972fad2aa9dd?auto=format&fit=crop&q=80&w=600',
          'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?auto=format&fit=crop&q=80&w=600',
          'https://images.unsplash.com/photo-1544273677-c433136021d4?auto=format&fit=crop&q=80&w=600'
        ];
        
        const promises = seeds.map(async (url, idx) => {
          const response = await fetch(url);
          const blob = await response.blob();
          return new File([blob], `default_${idx}.jpg`, { type: 'image/jpeg' });
        });
        const files = await Promise.all(promises);
        const config: AsciiConfig = { density: 'medium', cellSize: 8, useColor: true };
        const textures = await Promise.all(files.map(f => processFile(f, config)));
        setAsciiTextures(textures);
      } catch (err) {
        console.warn('Initial population failed');
      }
    };
    loadDefaults();
  }, []);

  return (
    <div className="relative w-full h-full bg-[#1a1a4a] overflow-hidden select-none">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 pointer-events-none" 
           style={{ background: 'linear-gradient(to top, #4db6ac 0%, #7e57c2 40%, #1a1a4a 100%)' }} />
      
      {/* 3D Scene - Moved to absolute with z-10 */}
      <div className="absolute inset-0 z-10">
        <Scene 
          ref={sceneRef}
          treeState={treeState} 
          asciiTextures={asciiTextures} 
        />
      </div>

      {/* Aesthetic UI Overlay */}
      <UIOverlay 
        onAsciiConvert={handleAsciiConvert}
        isConverting={isConverting}
        celebrationMessage={celebrationMsg}
      />
    </div>
  );
};

export default App;
