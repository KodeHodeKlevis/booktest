'use client'

import { motion, useMotionValue, useTransform, useAnimation, PanInfo, animate } from 'framer-motion'
import { useState, useCallback, useEffect, useRef } from 'react'
import FlipPage from './FlipPage'

// Book pages
const pages = [
  { left: '📖 Cover', right: '📝 Introduction' },
  { left: '📝 Introduction', right: '📚 Chapter 1' },
  { left: '📚 Chapter 1', right: '✍️ Page 1 Content' },
  { left: '📚 Chapter 1', right: '📚 Chapter 2' },
  { left: '📚 Chapter 2', right: '✍️ Page 2 Content' },
  { left: '✍️ Page 2 Content', right: '🏁 The End' },
]

// Helper to safely access page index
const safeIndex = (i: number) => Math.min(Math.max(i, 0), pages.length - 1)

// Background page stack
const PageStack = () => (
  [...Array(5)].map((_, i) => (
    <div
      key={i}
      className="absolute w-full h-full bg-white rounded-lg border border-gray-200"
      style={{
        left: `${i}px`, top: `${i}px`, zIndex: -i,
        opacity: 0.08 * (5 - i), transform: `translateY(${i * 0.5}px)`,
      }}
    />
  ))
)

// Opening animation
const OpeningAnimation = ({ controls }: { controls: any }) => (
  [...Array(9)].map((_, i) => (
    <motion.div
      key={i}
      custom={i}
      animate={controls}
      initial={{ rotateY: 0 }}
      className="absolute w-full h-full bg-[#f3e9cf] bg-[url('/paper-texture.png')] bg-cover bg-repeat rounded-xl shadow-inner"
      style={{ transformStyle: 'preserve-3d', zIndex: 40 - i }}
    />
  ))
)

export default function Book() {
  const [pageIndex, setPageIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [flipping, setFlipping] = useState<'forward' | 'backward' | null>(null)
  const [peelVisible, setPeelVisible] = useState(false)

  const forwardY = useMotionValue(0)
  const backwardY = useMotionValue(0)
  const shadow = useMotionValue(0)

  const peelSize = useTransform(forwardY, [-180, 0, 180], ['50px', '0px', '50px'])
  const boxShadow = useTransform(shadow, [0, 0.7], [
    'inset 5px 0px 10px rgba(0,0,0,0.1)',
    '15px 10px 40px rgba(0,0,0,0.3)',
  ])

  const current = pages[safeIndex(pageIndex)]
  const next = pages[safeIndex(pageIndex + 1)]
  const prev = pages[safeIndex(pageIndex - 1)]

  const coverControls = useAnimation()
  const pagesControls = useAnimation()

  // 🔊 Flip sound (long whoosh style)
  const flipSoundRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio('/page-flip.mp3')
    audio.loop = false
    audio.volume = 0.6
    flipSoundRef.current = audio
  }, [])

  // 🟢 Flip start: play sound from beginning
  const handleStart = useCallback((direction: 'forward' | 'backward') => {
    if (flipping) return
    setFlipping(direction)

    const sound = flipSoundRef.current
    if (sound) {
      sound.currentTime = 0
      sound.volume = 0.6
      sound.play().catch(() => {})
    }
  }, [flipping])

  // 🟡 During drag: update rotation + shadow
  const handleDrag = useCallback(
    (direction: 'forward' | 'backward') =>
      (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const progress = Math.min(Math.max(info.offset.x / (direction === 'forward' ? -120 : 120), 0), 1)
        const val = progress * 180
        const shadowVal = progress * 0.7

        direction === 'forward' ? forwardY.set(val) : backwardY.set(-val)
        shadow.set(shadowVal)
      },
    [forwardY, backwardY, shadow]
  )

  // 🔴 Flip end: fade out sound, update page index
  const handleEnd = useCallback(
    (direction: 'forward' | 'backward') =>
      (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const shouldFlip =
          direction === 'forward'
            ? (info.offset.x < -30 || info.velocity.x < -200) && pageIndex < pages.length - 1
            : (info.offset.x > 30 || info.velocity.x > 200) && pageIndex > 0

        if (shouldFlip) {
          setTimeout(() => {
            setPageIndex(prev => safeIndex(prev + (direction === 'forward' ? 1 : -1)))
            setFlipping(null)
          }, 300)
        } else {
          setFlipping(null)
        }

        // 🔊 Fade out sound
        const sound = flipSoundRef.current
        if (sound) {
          let fadeVolume = sound.volume
          const fadeOut = setInterval(() => {
            if (fadeVolume > 0.01) {
              fadeVolume -= 0.05
              sound.volume = Math.max(fadeVolume, 0)
            } else {
              clearInterval(fadeOut)
              sound.pause()
              sound.currentTime = 0
              sound.volume = 0.6 // Reset for next flip
            }
          }, 30)
        }

        forwardY.set(0)
        backwardY.set(0)
        shadow.set(0)
        setPeelVisible(false)
      },
    [pageIndex, forwardY, backwardY, shadow]
  )

  // 📖 Book open animation
  const handleOpen = () => {
    const sound = new Audio('/book-flip.mp3')
    sound.play().catch(() => {})
    coverControls.start({ rotateY: -180, transition: { duration: 1.5, ease: 'easeInOut' } })
    pagesControls.start(i => ({
      rotateY: [-10, -180],
      transition: {
        duration: 1,
        ease: 'easeInOut',
        delay: i * 0.15,
      },
    }))
    setTimeout(() => setIsOpen(true), 1000)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleOpen()
        }
        return
      }
  
      if (flipping) return
  
      if (e.key === 'ArrowLeft' && pageIndex < pages.length - 1) {
        handleStart('forward')
      
        // Animate the motionValue like a drag
        animate(forwardY, 180, {
          duration: 0.5,
          ease: 'easeInOut',
          onUpdate: (v) => {
            const progress = Math.abs(v) / 180
            shadow.set(progress * 0.7)
          },
          onComplete: () => {
            const fakePan: PanInfo = {
              offset: { x: -120, y: 0 },
              delta: { x: -120, y: 0 },
              velocity: { x: -300, y: 0 },
              point: { x: 0, y: 0 },
            }
            handleEnd('forward')(new MouseEvent('mouseup'), fakePan)
          }
        })
      }
      
      if (e.key === 'ArrowRight' && pageIndex > 0) {
        handleStart('backward')
      
        animate(backwardY, -180, {
          duration: 0.5,
          ease: 'easeInOut',
          onUpdate: (v: number) => {
            const progress = Math.abs(v) / 180
            shadow.set(progress * 0.7)
          },
          onComplete: () => {
            const fakePan: PanInfo = {
              offset: { x: 120, y: 0 },
              delta: { x: 120, y: 0 },
              velocity: { x: 300, y: 0 },
              point: { x: 0, y: 0 },
            }
            handleEnd('backward')(new MouseEvent('mouseup'), fakePan)
          }
        })        
      }
    }      
  
    // ✅ Attach the event listener
    window.addEventListener('keydown', handleKeyDown)
  
    // ✅ Cleanup when unmounted
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, flipping, pageIndex, handleStart, handleEnd, handleOpen])
  
  

  return (
    <div className="flex items-center justify-center h-screen bg-[#2c3e50]">
      <div className="relative w-[740px] h-[540px] perspective-[2000px]">
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-10">
        <motion.div
          className="relative flex items-center justify-center h-full w-full rounded-xl shadow-2xl px-2 py-2 bg-[#5c4033] bg-[url('/leather-texture.png')] bg-cover"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* 🔺 Top-left triangle */}
          <div className="absolute top-0 left-0 w-0 h-0 border-l-[30px] border-l-yellow-400 border-b-[30px] border-b-transparent" />

          {/* 🔺 Top-right triangle */}
          <div className="absolute top-0 right-0 w-0 h-0 border-r-[30px] border-r-yellow-400 border-b-[30px] border-b-transparent" />

          {/* 🔺 Bottom-left triangle */}
          <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[30px] border-l-yellow-400 border-t-[30px] border-t-transparent" />

          {/* 🔺 Bottom-right triangle */}
          <div className="absolute bottom-0 right-0 w-0 h-0 border-r-[30px] border-r-yellow-400 border-t-[30px] border-t-transparent" />

            <div className="relative w-[700px] h-[500px]">
              <div className="absolute left-1/2 top-0 h-full w-[2px] bg-gray-400 z-0" />
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative w-full h-full flex bg-white rounded-lg overflow-hidden border border-gray-300">
                  <PageStack />

                  {/* Left Page */}
                  <div className="w-1/2 p-8 border-r border-gray-300 bg-[#f1e7d0] bg-[url('/paper-texture.png')] bg-cover bg-repeat select-none z-10">
                    <p className="text-3xl font-bold text-gray-800">
                      {flipping === 'backward' && pageIndex > 0 ? prev.left : current.left}
                    </p>
                  </div>

                  {/* Right Page */}
                  <div className="w-1/2 p-8 bg-[#f5ecd7] bg-[url('/paper-texture.png')] bg-cover bg-repeat select-none z-10">
                    <p className="text-3xl font-bold text-gray-800">{next.right}</p>
                  </div>

                  {/* Forward Flip Page */}
                  {isOpen && pageIndex < pages.length - 1 && (
                    <FlipPage
                      direction="forward"
                      motionValue={forwardY}
                      boxShadow={boxShadow}
                      onDragStart={() => handleStart('forward')}
                      onDrag={handleDrag('forward')}
                      onDragEnd={handleEnd('forward')}
                      content={current.right}
                      isActive={flipping === 'forward'}
                      peelVisible={{ value: peelVisible, set: setPeelVisible }}
                      peelSize={peelSize}
                    />
                  )}

                  {/* Backward Flip Page */}
                  {isOpen && pageIndex > 0 && (
                    <FlipPage
                      direction="backward"
                      motionValue={backwardY}
                      boxShadow={boxShadow}
                      onDragStart={() => handleStart('backward')}
                      onDrag={handleDrag('backward')}
                      onDragEnd={handleEnd('backward')}
                      content={prev.right}
                      isActive={flipping === 'backward'}
                      peelVisible={{ value: false, set: () => {} }}
                      peelSize={peelSize}
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {!isOpen && <OpeningAnimation controls={pagesControls} />}

        {!isOpen && (
          <motion.div
            animate={coverControls}
            initial={{ rotateY: 0 }}
            onClick={handleOpen}
            className="absolute left-0 top-0 w-full h-full origin-left bg-[#5c4033] bg-[url('/leather-texture.png')] bg-cover bg-center rounded-xl shadow-xl cursor-pointer z-50 flex items-center justify-center"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <p className="text-white text-4xl font-bold">📖 Open Book</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
