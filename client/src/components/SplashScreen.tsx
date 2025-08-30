import React, { useState, useEffect } from 'react'
import { LogoPresets } from './AnimatedLogo'

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadeIn, setFadeIn] = useState(false)
  const [scaleIn, setScaleIn] = useState(false)

  useEffect(() => {
    // Start animations
    setTimeout(() => setFadeIn(true), 100)
    setTimeout(() => setScaleIn(true), 200)
    
    // Auto complete after delay
    const timer = setTimeout(() => {
      onComplete()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-500 rounded-full opacity-10 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2000}ms`
            }}
          />
        ))}
      </div>

      <div className="text-center z-10">
        {/* Logo Container */}
        <div 
          className={`mb-8 transition-all duration-1000 ${
            fadeIn ? 'opacity-100' : 'opacity-0'
          } ${
            scaleIn ? 'scale-100' : 'scale-50'
          }`}
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl mb-6 mx-auto w-fit border border-gray-100">
            <LogoPresets.Splash />
          </div>
        </div>

        {/* Text Content */}
        <div className={`transition-opacity duration-1000 delay-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-xl text-gray-600 mb-8">منصة الطباعة الذكية</p>
          
          {/* Loading Animation */}
          <div className="flex items-center justify-center space-x-2 space-x-reverse mb-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                style={{
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
          <p className="text-gray-500">جاري التحميل...</p>
        </div>
      </div>
    </div>
  )
}