import { useState, useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import { SidebarMenu } from '../components/garage/SidebarMenu';
import { CarViewer3D } from '../components/garage/CarViewer3D';
import { PartsCarousel } from '../components/garage/PartsCarousel';
import { PerformanceRadar } from '../components/garage/PerformanceRadar';
import { GARAGE_PARTS, BASE_STATS, UPGRADED_STATS } from '../data/mockData';
import type { GarageCategory } from '../types';

interface Props {
  onBack: () => void;
  onRace: () => void;
}

export function GarageScreen({ onBack, onRace }: Props) {
  const [category, setCategory] = useState<GarageCategory>('spoiler');
  const [parts, setParts] = useState(GARAGE_PARTS);
  const [paintColor, setPaintColor] = useState('#00e5ff');

  const filteredParts = useMemo(
    () => parts.filter(p => p.category === category),
    [parts, category]
  );

  const handleEquip = (id: string) => {
    const target = parts.find(p => p.id === id);
    if (!target) return;
    setParts(prev => prev.map(p => ({
      ...p,
      equipped: p.category === target.category ? p.id === id : p.equipped,
    })));
    if (target.category === 'paint') setPaintColor('#00e5ff');
  };

  return (
    <motion.div
      className="w-full h-full flex flex-col p-3 gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        background: 'linear-gradient(135deg, #060a14 0%, #0a0818 50%, #080c18 100%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <motion.button
          type="button"
          onClick={onBack}
          className="glass-panel rounded-xl px-3 py-1.5 text-[10px] tracking-widest text-white/50"
          whileTap={{ scale: 0.95 }}
        >
          ← BACK
        </motion.button>
        <h1 className="text-sm font-black tracking-[0.3em] text-neon-orange neon-text-orange">GARAGE</h1>
        <motion.button
          type="button"
          onClick={onRace}
          className="rounded-xl px-3 py-1.5 text-[10px] tracking-widest font-bold bg-neon-orange text-black"
          whileTap={{ scale: 0.95 }}
          style={{ boxShadow: '0 0 16px rgba(255,109,0,0.4)' }}
        >
          RACE →
        </motion.button>
      </div>

      {/* Main layout */}
      <div className="flex-1 grid grid-cols-[52px_1fr_160px] gap-2 min-h-0">
        <SidebarMenu selected={category} onSelect={setCategory} />

        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex-1 min-h-0">
            <Suspense fallback={
              <div className="w-full h-full glass-panel rounded-2xl flex items-center justify-center text-white/30 text-xs tracking-widest">
                LOADING 3D...
              </div>
            }>
              <CarViewer3D paintColor={paintColor} />
            </Suspense>
          </div>
          <PartsCarousel
            parts={filteredParts.length ? filteredParts : parts.slice(0, 4)}
            onBuy={() => {}}
            onEquip={handleEquip}
          />
        </div>

        <PerformanceRadar current={BASE_STATS} upgraded={UPGRADED_STATS} />
      </div>
    </motion.div>
  );
}
