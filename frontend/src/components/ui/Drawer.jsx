import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Drawer = ({ isOpen, onClose, title, children, side = 'left' }) => {
  React.useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const variants = {
    left: { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } },
    right: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } },
  };

  const v = variants[side];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={v.initial} animate={v.animate} exit={v.exit}
            transition={{ type: 'tween', duration: 0.25 }}
            className={`relative z-10 flex flex-col bg-white w-72 max-w-full shadow-2xl h-full ${side === 'right' ? 'ml-auto' : 'mr-auto'}`}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-cream-dark">
              {title && <h3 className="font-bold text-charcoal">{title}</h3>}
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-cream text-charcoal-lighter">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Drawer;
