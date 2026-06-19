import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MenuScreen } from './screens/MenuScreen';
import { RaceScreen } from './screens/RaceScreen';
import { GarageScreen } from './screens/GarageScreen';
import type { Screen } from './types';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Landscape orientation hint for portrait */}
      <div className="portrait-hint fixed inset-0 z-[100] bg-[#050810] flex-col items-center justify-center gap-4 hidden">
        <motion.div animate={{ rotate: 90 }} className="text-4xl">📱</motion.div>
        <p className="text-sm tracking-widest text-neon-cyan">Rotate to landscape</p>
      </div>

      <AnimatePresence mode="wait">
        {screen === 'menu' && (
          <motion.div key="menu" className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -50 }}>
            <MenuScreen onRace={() => setScreen('race')} onGarage={() => setScreen('garage')} />
          </motion.div>
        )}
        {screen === 'race' && (
          <motion.div key="race" className="absolute inset-0"
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <RaceScreen onBack={() => setScreen('menu')} onGarage={() => setScreen('garage')} />
          </motion.div>
        )}
        {screen === 'garage' && (
          <motion.div key="garage" className="absolute inset-0"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <GarageScreen onBack={() => setScreen('menu')} onRace={() => setScreen('race')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
