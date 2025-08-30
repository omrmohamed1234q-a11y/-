import React from 'react'
import { motion } from 'framer-motion'
import logoImage from "@assets/image_1756579836914.png"

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  variant?: 'default' | 'floating' | 'pulse' | 'rotate' | 'bounce' | 'splash'
  className?: string
  showText?: boolean
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
  xl: 'w-32 h-32',
  '2xl': 'w-40 h-40'
}

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
  '2xl': 'text-5xl'
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({
  size = 'md',
  variant = 'default',
  className = '',
  showText = false
}) => {
  const getAnimationProps = () => {
    switch (variant) {
      case 'floating':
        return {
          animate: {
            y: [0, -10, 0],
            rotate: [0, 2, -2, 0]
          },
          transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }
      
      case 'pulse':
        return {
          animate: {
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8]
          },
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }
      
      case 'rotate':
        return {
          animate: {
            rotateY: [0, 360]
          },
          transition: {
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }
        }
      
      case 'bounce':
        return {
          animate: {
            y: [0, -15, 0],
            scale: [1, 1.1, 1],
            rotate: [0, 2, -2, 0]
          },
          transition: {
            duration: 2.5,
            repeat: Infinity,
            ease: "easeOut"
          }
        }
      
      case 'splash':
        return {
          initial: { scale: 0, rotate: -180, opacity: 0 },
          animate: { 
            scale: [0, 1.2, 1], 
            rotate: [180, 0], 
            opacity: [0, 1] 
          },
          transition: {
            duration: 1.2,
            ease: [0.68, -0.55, 0.265, 1.55]
          }
        }
      
      default:
        return {
          animate: {
            scale: [1, 1.05, 1],
            rotateY: [0, 5, -5, 0]
          },
          transition: {
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse" as const,
            ease: "easeInOut"
          }
        }
    }
  }

  const animationProps = getAnimationProps()

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <motion.div
        className="relative"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        {...animationProps}
      >
        <motion.img
          src={logoImage}
          alt="اطبعلي"
          className={`${sizeClasses[size]} filter drop-shadow-lg mix-blend-multiply bg-transparent`}
          style={{ backgroundColor: 'transparent' }}
        />
      </motion.div>
      
      {showText && (
        <motion.h1
          className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mt-2`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          اطبعلي
        </motion.h1>
      )}
    </div>
  )
}

// Preset configurations for common use cases
export const LogoPresets = {
  Landing: () => <AnimatedLogo size="lg" variant="default" />,
  Splash: () => <AnimatedLogo size="xl" variant="splash" />,
  Login: () => <AnimatedLogo size="2xl" variant="bounce" />,
  Navigation: () => <AnimatedLogo size="sm" variant="floating" />,
  Loading: () => <AnimatedLogo size="md" variant="pulse" />,
  Hero: () => <AnimatedLogo size="lg" variant="bounce" />
}

export default AnimatedLogo