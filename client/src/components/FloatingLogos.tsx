import React from 'react'
import { motion } from 'framer-motion'
import logoImage from "@assets/92b00e7f-0f7b-40d2-8c20-79751e073ab1_1756565286414.png"

interface FloatingLogosProps {
  count?: number
  className?: string
}

export const FloatingLogos: React.FC<FloatingLogosProps> = ({ 
  count = 8,
  className = ''
}) => {
  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className="absolute opacity-5"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: 0.3 + Math.random() * 0.4,
            rotate: Math.random() * 360
          }}
          animate={{
            x: [
              Math.random() * window.innerWidth,
              Math.random() * window.innerWidth,
              Math.random() * window.innerWidth
            ],
            y: [
              Math.random() * window.innerHeight,
              Math.random() * window.innerHeight,
              Math.random() * window.innerHeight
            ],
            rotate: [0, 360, 720],
            scale: [
              0.3 + Math.random() * 0.4,
              0.5 + Math.random() * 0.3,
              0.3 + Math.random() * 0.4
            ]
          }}
          transition={{
            duration: 20 + Math.random() * 10,
            repeat: Infinity,
            ease: "linear",
            delay: index * 2
          }}
        >
          <img
            src={logoImage}
            alt=""
            className="w-16 h-16 opacity-30"
          />
        </motion.div>
      ))}
    </div>
  )
}

// Corner logo component for subtle branding
export const CornerLogo: React.FC<{
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  size?: 'sm' | 'md' | 'lg'
}> = ({ position = 'bottom-right', size = 'sm' }) => {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <motion.div
      className={`fixed ${positionClasses[position]} z-10 pointer-events-none`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 0.1, scale: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      whileHover={{ opacity: 0.3, scale: 1.1 }}
    >
      <motion.img
        src={logoImage}
        alt=""
        className={`${sizeClasses[size]} filter grayscale`}
        animate={{
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  )
}

// Loading overlay with animated logo
export const LoadingOverlay: React.FC<{
  isVisible: boolean
  message?: string
}> = ({ isVisible, message = "جاري التحميل..." }) => {
  if (!isVisible) return null

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
        <motion.img
          src={logoImage}
          alt="اطبعلي"
          className="w-16 h-16 mx-auto mb-4"
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
          }}
        />
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </motion.div>
  )
}

export default FloatingLogos