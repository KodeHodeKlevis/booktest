'use client'

import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion'
import { useEffect, useState } from 'react'

interface PageContent {
  left: string
  right: string
}

const pages: PageContent[] = [
  { left: '📖 Cover', right: '📝 Introduction' },
  { left: '📚 Chapter 1', right: '✍️ Page 1 Content' },
  { left: '📚 Chapter 2', right: '✍️ Page 2 Content' },
  { left: '🏁 The End', right: '🔙 Back Cover' },
]

export default function Book() {
  const [pageIndex, setPageIndex] = useState(0)
  const [flippingDirection, setFlippingDirection] = useState<'forward' | 'backward' | null>(null)
  const [peelVisible, setPeelVisible] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const rotateYForward = useMotionValue(0)
  const rotateYReturn = useMotionValue(0)
  const shadowOpacity = useMotionValue(0)

  const peelSize = useTransform(rotateYForward, [-180, 0, 180], ['50px', '0px', '50px'])
  const flippingBoxShadow = useTransform(
    shadowOpacity,
    [0, 0.7],
    ['inset 5px 0px 10px rgba(0,0,0,0.1)', '15px 10px 40px rgba(0,0,0,0.3)']
  )

  const currentPage = pages[pageIndex]
  const nextPage = pages[Math.min(pageIndex + 1, pages.length - 1)]
  const prevPage = pages[Math.max(pageIndex - 1, 0)]

  const coverControls = useAnimation()
  const pagesControls = useAnimation()

  const flipSound = typeof Audio !== 'undefined' ? new Audio('/page-flip.mp3') : null

  const playFlipSound = () => {
    if (!flipSound) return
    flipSound.currentTime = 0
    flipSound.play()

    // Stop after ~300ms to simulate a short flip (optional)
    setTimeout(() => {
      flipSound.pause()
      flipSound.currentTime = 0
    }, 300)
  }


  const handleForwardDrag = (_: any, info: any) => {
    playFlipSound()
    const progress = Math.min(Math.max(info.offset.x / -120, 0), 1)
    rotateYForward.set(progress * 180)
    shadowOpacity.set(progress * 0.7)
  }

  const handleForwardEnd = (_: any, info: any) => {
    playFlipSound()
    if ((info.offset.x < -30 || info.velocity.x < -200) && pageIndex < pages.length - 1) {
      setTimeout(() => setPageIndex(p => p + 1), 300)
    }
    rotateYForward.set(0)
    shadowOpacity.set(0)
    setFlippingDirection(null)
  }

  const handleReturnDrag = (_: any, info: any) => {
    playFlipSound()
    const progress = Math.min(Math.max(info.offset.x / 120, 0), 1)
    rotateYReturn.set(-progress * 180)
    shadowOpacity.set(progress * 0.7)
  }

  const handleReturnEnd = (_: any, info: any) => {
    playFlipSound()
    if ((info.offset.x > 30 || info.velocity.x > 200) && pageIndex > 0) {
      setTimeout(() => setPageIndex(p => p - 1), 300)
    }
    rotateYReturn.set(0)
    shadowOpacity.set(0)
    setFlippingDirection(null)
  }

  const handleOpen = () => {
    // Trigger both cover and page animations simultaneously
    const aniSound = new Audio('/book-flip.mp3')
    aniSound.play()

    coverControls.start({
      rotateY: -180,
      transition: { duration: 1.5, ease: 'easeInOut' },
    })
  
    pagesControls.start(i => ({
      rotateY: [-10, -180],
      transition: {
        duration: 1,
        ease: 'easeInOut',
        delay: i * 0.1,
      },
    }))
  
    // Slight delay to reveal content
    setTimeout(() => setIsOpen(true), 1000)
  }

  return (
    <div className="flex items-center justify-center h-screen bg-[#2c3e50]">
      <div className="relative w-[740px] h-[540px] perspective-[2000px]">

        {/* Book content that becomes visible after opening */}
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-10">
          <motion.div
            className="flex items-center justify-center h-full w-full rounded-xl shadow-2xl px-2 py-2 bg-[#5c4033] bg-[url('/leather-texture.png')] bg-cover"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative w-[700px] h-[500px]">
              <div className="absolute left-1/2 top-0 h-full w-[2px] bg-gray-400 z-0" />
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative w-full h-full flex bg-white rounded-lg overflow-hidden border border-gray-300">

                  {/* Page Stack (static background pages) */}
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-full h-full bg-white rounded-lg border border-gray-200"
                      style={{
                        left: `${i}px`,
                        top: `${i}px`,
                        zIndex: -i,
                        opacity: 0.08 * (5 - i),
                        transform: `translateY(${i * 0.5}px)`,
                      }}
                    />
                  ))}

                  {/* Left Page */}
                  <div className="w-1/2 p-8 border-r border-gray-300 bg-[#f1e7d0] bg-[url('/paper-texture.png')] bg-cover bg-repeat select-none z-10">
                    <p className="text-3xl font-bold text-gray-800">{currentPage.left}</p>
                  </div>

                  {/* Right Page */}
                  <div className="w-1/2 p-8 bg-[#f5ecd7] bg-[url('/paper-texture.png')] bg-cover bg-repeat select-none z-10">
                    <p className="text-3xl font-bold text-gray-800">{nextPage.right}</p>
                  </div>

                  {/* Forward Flip */}
                  {pageIndex < pages.length - 1 && (
                    <motion.div
                      onDragStart={() => setFlippingDirection('forward')}
                      onHoverStart={() => setPeelVisible(true)}
                      onHoverEnd={() => setPeelVisible(false)}
                      className={`absolute left-1/2 w-1/2 h-full origin-left ${
                        flippingDirection === 'forward' ? 'z-[50]' : 'z-10'
                      }`}
                      style={{
                        rotateY: rotateYForward,
                        transformStyle: 'preserve-3d',
                        transformOrigin: 'left center',
                        boxShadow: flippingBoxShadow,
                      }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.1}
                      onDrag={handleForwardDrag}
                      onDragEnd={handleForwardEnd}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      <div className="absolute inset-0 bg-[#f9f0db] bg-[url('/paper-texture.png')] bg-cover bg-repeat p-8">
                        <p className="text-3xl font-bold text-gray-800">{currentPage.right}</p>
                        <motion.div
                          className="absolute bottom-0 right-0 bg-[#d6c7aa] rounded-tl-full"
                          animate={{
                            width: peelVisible ? '60px' : '0px',
                            height: peelVisible ? '60px' : '0px',
                          }}
                          transition={{ duration: 0.3 }}
                          style={{ width: peelSize, height: peelSize }}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Return Flip */}
                  {pageIndex > 0 && (
                    <motion.div
                      onDragStart={() => setFlippingDirection('backward')}
                      className={`absolute left-0 w-1/2 h-full origin-right ${
                        flippingDirection === 'backward' ? 'z-[50]' : 'z-10'
                      }`}
                      style={{
                        rotateY: rotateYReturn,
                        transformStyle: 'preserve-3d',
                        transformOrigin: 'right center',
                        boxShadow: flippingBoxShadow,
                      }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.1}
                      onDrag={handleReturnDrag}
                      onDragEnd={handleReturnEnd}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    >
                      <div className="absolute inset-0 bg-[#f2e6c9] bg-[url('/paper-texture.png')] bg-cover bg-repeat p-8">
                        <p className="text-3xl font-bold text-gray-800">{prevPage.right}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Flipping Pages Animation (while opening) */}
        {!isOpen &&
          [...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              custom={i}
              animate={pagesControls}
              className="absolute w-full h-full bg-[#f3e9cf] bg-[url('/paper-texture.png')] bg-cover bg-repeat rounded-xl shadow-inner"
              style={{
                transformStyle: 'preserve-3d',
                zIndex: 40 - i,
              }}
              initial={{ rotateY: 0 }}
            />
          ))}

        {/* Front Cover (on top initially) */}
        {!isOpen && (
          <motion.div
            animate={coverControls}
            className="absolute left-0 top-0 w-full h-full origin-left bg-[#5c4033] bg-[url('/leather-texture.png')]  bg-cover bg-center rounded-xl shadow-xl cursor-pointer z-50 flex items-center justify-center"
            initial={{ rotateY: 0 }}
            onClick={handleOpen}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <p className="text-white text-4xl font-bold">📖 Open Book</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
