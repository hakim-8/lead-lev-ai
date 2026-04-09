import React from 'react';
import { motion } from 'framer-motion';

export default function Loader({ size = 48, className = '' }) {
  return (
    <div className={`flex items-center justify-center h-full w-full ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="rounded-full border-t-2 border-l-2 border-indigo-600"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
