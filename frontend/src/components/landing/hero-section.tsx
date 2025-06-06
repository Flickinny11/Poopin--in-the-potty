'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Play, Languages, Mic, Video } from 'lucide-react'
import Link from 'next/link'

export function HeroSection() {
  const floatingElements = [
    { icon: Languages, x: 100, y: 100, delay: 0 },
    { icon: Mic, x: 200, y: 50, delay: 0.5 },
    { icon: Video, x: 300, y: 120, delay: 1 },
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-20">
      {/* Floating language symbols */}
      {floatingElements.map((Element, index) => (
        <motion.div
          key={index}
          className="absolute text-primary-300 animate-float"
          style={{ left: Element.x, top: Element.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ delay: Element.delay, duration: 1 }}
        >
          <Element.icon size={32} />
        </motion.div>
      ))}

      <div className="container mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">Speak Any Language,</span>
            <br />
            <span className="text-gray-900">Sound Like You</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Break language barriers with real-time video translation, AI voice cloning, 
            and perfect lip synchronization. Have natural conversations in any language 
            while preserving your unique voice.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" className="btn-primary text-lg px-8 py-4" asChild>
              <Link href="/auth/signup">Start Free Trial</Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-4 flex items-center gap-2"
            >
              <Play size={20} />
              Watch Demo
            </Button>
          </div>

          {/* Live demo video player placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl bg-gray-900"
          >
            <div className="aspect-video bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <div className="text-white text-center">
                <Play size={64} className="mx-auto mb-4 opacity-80" />
                <p className="text-lg font-medium">Live Demo Video</p>
                <p className="text-sm opacity-80">See VidLiSync in action</p>
              </div>
            </div>
            
            {/* Video controls overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                  <Play size={16} />
                </Button>
                <span className="text-white text-sm">0:00 / 2:30</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white text-xs bg-red-500 px-2 py-1 rounded">LIVE</span>
                <span className="text-white text-xs">Real-time Translation</span>
              </div>
            </div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-12 text-center"
          >
            <p className="text-sm text-gray-500 mb-6">Trusted by teams at</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple'].map((company) => (
                <div key={company} className="text-lg font-semibold text-gray-400">
                  {company}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
    </section>
  )
}