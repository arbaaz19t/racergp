import { motion } from 'framer-motion';
import type { PartCard } from '../../types';

interface Props {
  parts: PartCard[];
  onBuy: (id: string) => void;
  onEquip: (id: string) => void;
}

export function PartsCarousel({ parts, onBuy, onEquip }: Props) {
  return (
    <div className="w-full overflow-x-auto scroll-hide">
      <div className="flex gap-3 px-1 pb-1">
        {parts.map((part, i) => (
          <motion.div
            key={part.id}
            className={`glass-panel glass-orange rounded-xl p-3 min-w-[140px] flex-shrink-0 ${
              part.equipped ? 'ring-1 ring-neon-orange' : ''
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -2 }}
          >
            <div className="text-2xl mb-1">{part.image}</div>
            <div className="text-[10px] font-bold text-white truncate">{part.name}</div>
            <div className="text-[9px] text-neon-orange font-bold mt-0.5">
              ${part.price.toLocaleString()}
            </div>
            <div className="flex gap-1 mt-1 text-[7px] text-white/40">
              {part.stats.speed > 0 && <span>SPD+{part.stats.speed}</span>}
              {part.stats.handling > 0 && <span>HND+{part.stats.handling}</span>}
              {part.stats.accel > 0 && <span>ACC+{part.stats.accel}</span>}
            </div>
            <div className="flex gap-1.5 mt-2">
              <motion.button
                type="button"
                onClick={() => onBuy(part.id)}
                className="flex-1 text-[7px] py-1 rounded-lg border border-white/15 text-white/60 hover:border-neon-orange hover:text-neon-orange"
                whileTap={{ scale: 0.95 }}
              >
                BUY
              </motion.button>
              <motion.button
                type="button"
                onClick={() => onEquip(part.id)}
                className={`flex-1 text-[7px] py-1 rounded-lg font-bold ${
                  part.equipped
                    ? 'bg-neon-orange/30 text-neon-orange border border-neon-orange'
                    : 'bg-neon-orange text-black'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {part.equipped ? 'EQUIPPED' : 'EQUIP'}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
