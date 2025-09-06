import { motion } from "framer-motion";

interface PrintingAnimationProps {
  status: string;
  className?: string;
}

export default function PrintingAnimation({ status, className = "" }: PrintingAnimationProps) {
  if (status !== 'processing') {
    return null;
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Printer Machine */}
      <motion.div 
        className="relative w-20 h-16 bg-gray-800 rounded-lg shadow-lg mb-4"
        animate={{ 
          scale: [1, 1.02, 1],
          rotate: [0, 0.5, -0.5, 0]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          repeatType: "reverse"
        }}
      >
        {/* Printer screen */}
        <div className="absolute top-1 right-1 w-6 h-4 bg-blue-400 rounded-sm">
          <motion.div
            className="w-full h-full bg-blue-300 rounded-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
        
        {/* Paper tray */}
        <div className="absolute -top-2 left-2 w-8 h-2 bg-white border border-gray-300 rounded-sm shadow-sm" />
        
        {/* Print head moving animation */}
        <motion.div
          className="absolute top-6 left-1 w-1 h-6 bg-red-500 rounded-full"
          animate={{ x: [0, 16, 0] }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Printer body details */}
        <div className="absolute bottom-1 left-2 right-2 h-2 bg-gray-600 rounded-sm" />
        <div className="absolute bottom-3 left-1 w-2 h-3 bg-green-400 rounded-sm animate-pulse" />
      </motion.div>

      {/* Papers coming out */}
      <div className="relative w-16 overflow-hidden">
        <motion.div
          className="absolute -top-2 left-2 w-12 h-16 bg-white border border-gray-200 shadow-md rounded-sm"
          animate={{ 
            y: [-20, 0],
            opacity: [0, 1, 1, 0]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            times: [0, 0.3, 0.7, 1]
          }}
        >
          {/* Printed content simulation */}
          <div className="p-1 space-y-1">
            <div className="w-8 h-1 bg-gray-800 rounded-full" />
            <div className="w-6 h-1 bg-gray-600 rounded-full" />
            <div className="w-7 h-1 bg-gray-700 rounded-full" />
            <div className="w-5 h-1 bg-gray-600 rounded-full" />
          </div>
        </motion.div>

        <motion.div
          className="absolute -top-2 left-2 w-12 h-16 bg-white border border-gray-200 shadow-md rounded-sm"
          animate={{ 
            y: [-20, 0],
            opacity: [0, 1, 1, 0]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            delay: 1.5,
            times: [0, 0.3, 0.7, 1]
          }}
        >
          <div className="p-1 space-y-1">
            <div className="w-8 h-1 bg-gray-800 rounded-full" />
            <div className="w-6 h-1 bg-gray-600 rounded-full" />
            <div className="w-7 h-1 bg-gray-700 rounded-full" />
            <div className="w-5 h-1 bg-gray-600 rounded-full" />
          </div>
        </motion.div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1 mt-4">
        <motion.div
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
        />
      </div>

      {/* Status text */}
      <motion.p 
        className="text-sm font-medium text-blue-600 mt-2 text-center"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        جاري طباعة مستنداتك...
      </motion.p>
    </div>
  );
}