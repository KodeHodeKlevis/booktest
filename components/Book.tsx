'use client'

import { motion, useMotionValue, useTransform, useAnimation, PanInfo, animate } from 'framer-motion'
import { useState, useCallback, useEffect, useRef } from 'react'
import FlipPage from './FlipPage'

// All the pages to render inside the book.
// Each has left page content, right page content, and a bookmark label.
const pages = [
  { left: '# Cover', right: '## Chapter 1', bookmark: 'Cover' },
  { left: '### Introduction', right: 'Content for Chapter 1 begins...', bookmark: 'Intro' },
  { left: 'Continued Chapter 1', right: 'More Chapter 1 content', bookmark: '1.2' },
  { left: '## Chapter 2', right: 'Chapter 2 content begins...', bookmark: 'Chapter 2' },
  { left: 'Final Content', right: '# The End', bookmark: 'The End' }
]

// Clamp page index within range.
const safeIndex = (i: number) => Math.min(Math.max(i, 0), pages.length - 1)

// Decorative stacked page backgrounds behind the book.
const PageStack = () => (
  [...Array(5)].map((_, i) => (
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
  ))
)

// Decorative animation for the cover opening.
const OpeningAnimation = ({ controls }: { controls: any }) => (
  [...Array(9)].map((_, i) => (
    <motion.div
      key={i}
      custom={i}
      animate={controls}
      initial={{ rotateY: 0 }}
      className="absolute w-full h-full bg-[#f3e9cf] bg-cover bg-repeat rounded-xl shadow-inner"
      style={{ transformStyle: 'preserve-3d', zIndex: 40 - i }}
    />
  ))
)

// Right-side vertical bookmarks that let you jump to a specific page.
const Bookmarks = ({
  onSelect,
  currentPage,
}: {
  onSelect: (index: number) => void
  currentPage: number
}) => (
  <div className="absolute right-5 top-1/2 -translate-y-1/2 z-30 flex flex-col space-y-2">
    {pages.map((page, i) => (
      <button
        key={i}
        onClick={() => onSelect(i)}
        className={`w-[100px] h-[40px] text-sm font-semibold text-gray-800 rounded-l-full shadow-md transition-all duration-200 origin-right
          ${currentPage === i ? 'bg-yellow-400' : 'bg-yellow-200 hover:bg-yellow-300 hover:scale-105 hover:shadow-lg cursor-pointer'}`}
        // flip the button and then flip text back to appear normal
        style={{
          transform: 'scaleX(-1)',
        }}
      >
        <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>
          {page.bookmark}
        </span>
      </button>
    ))}
  </div>
)

export default function Book() {
  // Current page index
  const [pageIndex, setPageIndex] = useState(0)
  // If the book is open or not
  const [isOpen, setIsOpen] = useState(false)
  // Whether a page is currently flipping
  const [flipping, setFlipping] = useState<'forward' | 'backward' | null>(null)
  // Whether the page peel animation is active
  const [peelVisible, setPeelVisible] = useState(false)
  // Content shown on each page (left and right)
  const [displayedPages, setDisplayedPages] = useState({
    left: pages[0].left,
    right: pages[0].right
  })

  // Framer motion values for rotation and shadows
  const forwardY = useMotionValue(0)
  const backwardY = useMotionValue(0)
  const shadow = useMotionValue(0)

  // Peel and box shadow animations
  const peelSize = useTransform(forwardY, [-180, 0, 180], ['50px', '0px', '50px'])
  const boxShadow = useTransform(shadow, [0, 0.7], [
    'inset 5px 0px 10px rgba(0,0,0,0.1)',
    '15px 10px 40px rgba(0,0,0,0.3)',
  ])

  // Framer controls for opening animations
  const coverControls = useAnimation()
  const pagesControls = useAnimation()

  // Sound effect for page flips
  const flipSoundRef = useRef<HTMLAudioElement | null>(null)

  // Load flip sound once on mount
  useEffect(() => {
    const audio = new Audio('/page-flip.mp3')
    audio.loop = false
    audio.volume = 0.6
    flipSoundRef.current = audio
  }, [])

  // Set the visible content for the left and right page
  const updateDisplayedPages = useCallback((newIndex: number) => {
    setDisplayedPages({
      left: pages[safeIndex(newIndex)].left,
      right: pages[safeIndex(newIndex)].right
    })
  }, [])

  // Play sound and mark page as flipping
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

  // Dragging the page to flip forward or backward
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

  // Called when a drag ends
  const handleEnd = useCallback(
    (direction: 'forward' | 'backward') =>
      (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const shouldFlip =
          direction === 'forward'
            ? (info.offset.x < -30 || info.velocity.x < -200) && pageIndex < pages.length - 1
            : (info.offset.x > 30 || info.velocity.x > 200) && pageIndex > 0

        if (shouldFlip) {
          const newIndex = pageIndex + (direction === 'forward' ? 1 : -1)
          updateDisplayedPages(newIndex)
          setTimeout(() => {
            setPageIndex(newIndex)
            setFlipping(null)
          }, 300)
        } else {
          setFlipping(null)
        }

        // Fade out sound if still playing
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
              sound.volume = 0.6
            }
          }, 30)
        }

        // Reset states
        forwardY.set(0)
        backwardY.set(0)
        shadow.set(0)
        setPeelVisible(false)
      },
    [pageIndex, forwardY, backwardY, shadow, updateDisplayedPages]
  )

  // Animate the book opening
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

  // Handle jumping to a page by clicking a bookmark
  const jumpToPage = (targetIndex: number) => {
    if (targetIndex === pageIndex || flipping) return
    const direction = targetIndex > pageIndex ? 'forward' : 'backward'
    handleStart(direction)
    updateDisplayedPages(targetIndex)

    const motionValue = direction === 'forward' ? forwardY : backwardY
    animate(motionValue, direction === 'forward' ? 180 : -180, {
      duration: 0.5,
      ease: 'easeInOut',
      onUpdate: (v: number) => {
        const progress = Math.abs(v) / 180
        shadow.set(progress * 0.7)
      },
      onComplete: () => {
        setPageIndex(targetIndex)
        setFlipping(null)

        const fakePan: PanInfo = {
          offset: { x: direction === 'forward' ? -120 : 120, y: 0 },
          delta: { x: direction === 'forward' ? -120 : 120, y: 0 },
          velocity: { x: direction === 'forward' ? -300 : 300, y: 0 },
          point: { x: 0, y: 0 },
        }
        handleEnd(direction)(new MouseEvent('mouseup'), fakePan)
      }
    })
  }

  // Keyboard navigation
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
        jumpToPage(pageIndex + 1)
      }

      if (e.key === 'ArrowRight' && pageIndex > 0) {
        jumpToPage(pageIndex - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, flipping, pageIndex, handleOpen])

  return (
    <div className="flex items-center justify-center h-screen bg-[#2c3e50]">
      <div className="relative w-[740px] h-[540px] perspective-[2000px]">
        {/* Bookmarks appear after book is open */}
        {isOpen && <Bookmarks onSelect={jumpToPage} currentPage={pageIndex} />}

        {/* Book container */}
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-10 cursor-pointer">
          <motion.div
            className="relative flex items-center justify-center h-full w-full rounded-xl shadow-2xl px-2 py-2 bg-[#5c4033] bg-[url('/leather-texture.png')] bg-cover"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Main book pages */}
            <div className="relative w-[700px] h-[500px]">
              {/* Vertical spine divider */}
              <div className="absolute left-1/2 top-0 h-full w-[2px] bg-gray-400 z-0" />
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Page container */}
                <div className="relative w-full h-full flex bg-white rounded-lg overflow-hidden border border-gray-300">
                  <PageStack />

                  {/* Static left page */}
                  <div className="w-1/2 p-8 border-r border-gray-300 bg-[#f1e7d0] select-none z-10">
                    <div className="text-3xl font-bold text-gray-800">{displayedPages.left}</div>
                  </div>

                  {/* Static right page */}
                  <div className="w-1/2 p-8 bg-[#f5ecd7] select-none z-10">
                    <div className="text-3xl font-bold text-gray-800">{displayedPages.right}</div>
                  </div>

                  {/* Animated Flip Forward */}
                  {isOpen && pageIndex < pages.length - 1 && (
                    <FlipPage
                      direction="forward"
                      motionValue={forwardY}
                      boxShadow={boxShadow}
                      onDragStart={() => handleStart('forward')}
                      onDrag={handleDrag('forward')}
                      onDragEnd={handleEnd('forward')}
                      content={pages[pageIndex].right}
                      isActive={flipping === 'forward'}
                      peelVisible={{ value: peelVisible, set: setPeelVisible }}
                      peelSize={peelSize}
                    />
                  )}

                  {/* Animated Flip Backward */}
                  {isOpen && pageIndex > 0 && (
                    <FlipPage
                      direction="backward"
                      motionValue={backwardY}
                      boxShadow={boxShadow}
                      onDragStart={() => handleStart('backward')}
                      onDrag={handleDrag('backward')}
                      onDragEnd={handleEnd('backward')}
                      content={pages[pageIndex - 1].left}
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

        {/* Opening cover animation */}
        {!isOpen && <OpeningAnimation controls={pagesControls} />}

        {/* Closed book cover click to open */}
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
