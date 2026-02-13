// Badge compact pour afficher les records dans le Dashboard

import { Link } from 'react-router-dom';
import { useNewRecords } from '../../hooks/usePersonalRecords';
import { motion, AnimatePresence } from 'framer-motion';

export function RecordBadge() {
  const { newRecords, loading } = useNewRecords();

  if (loading || newRecords.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <Link
          to="/records"
          className="relative inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <motion.span
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            🏆
          </motion.span>
          <span className="font-semibold">
            {newRecords.length} nouveau{newRecords.length > 1 ? 'x' : ''} record{newRecords.length > 1 ? 's' : ''} !
          </span>
          <motion.span
            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}

// Made with Bob