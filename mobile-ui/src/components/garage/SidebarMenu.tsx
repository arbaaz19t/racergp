import { motion } from 'framer-motion';
import type { GarageCategory } from '../../types';

const CATEGORIES: { id: GarageCategory; icon: string; label: string }[] = [
  { id: 'front_bumper', icon: '⬜', label: 'Front' },
  { id: 'rear_bumper', icon: '⬛', label: 'Rear' },
  { id: 'side_skirts', icon: '▬', label: 'Skirts' },
  { id: 'hood', icon: '🔲', label: 'Hood' },
  { id: 'spoiler', icon: '🔺', label: 'Spoiler' },
  { id: 'wheels', icon: '⭕', label: 'Wheels' },
  { id: 'suspension', icon: '↕', label: 'Susp.' },
  { id: 'engine', icon: '⚙', label: 'Engine' },
  { id: 'transmission', icon: '⚡', label: 'Trans.' },
  { id: 'turbo', icon: '💨', label: 'Turbo' },
  { id: 'brakes', icon: '🛑', label: 'Brakes' },
  { id: 'paint', icon: '🎨', label: 'Paint' },
  { id: 'vinyls', icon: '🏁', label: 'Vinyls' },
  { id: 'exhaust', icon: '🔥', label: 'Exhaust' },
];

interface Props {
  selected: GarageCategory;
  onSelect: (cat: GarageCategory) => void;
}

export function SidebarMenu({ selected, onSelect }: Props) {
  return (
    <motion.div
      className="glass-panel rounded-2xl py-2 px-1 flex flex-col gap-0.5 h-full overflow-y-auto scroll-hide"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      {CATEGORIES.map((cat, i) => {
        const active = selected === cat.id;
        return (
          <motion.button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={`relative flex flex-col items-center gap-0.5 py-2 px-1.5 rounded-xl transition-colors ${
              active ? 'text-neon-orange' : 'text-white/40 hover:text-white/70'
            }`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            whileTap={{ scale: 0.92 }}
          >
            {active && (
              <motion.div
                layoutId="sidebar-glow"
                className="absolute inset-0 rounded-xl glass-orange"
                style={{ boxShadow: '0 0 20px rgba(255,109,0,0.25)' }}
              />
            )}
            <span className="text-base relative z-10">{cat.icon}</span>
            <span className="text-[6px] tracking-wider relative z-10 uppercase">{cat.label}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
