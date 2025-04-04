'use client'

import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion'
import { useState, useCallback } from 'react'

// Define the pages of the book.
// Each page object contains the left and right content of a 2-page spread.
const pages = [
  { left: '📖 Cover', right: '📝 Introduction' },
  { left: '📚 Chapter 1', right: '✍️ Page 1 Content' },
  { left: '📚 Chapter 2', right: '✍️ Page 2 Content' },
  { left: '🏁 The End', right: '🔙 Back Cover' },
]

// Render a background stack of "fake" pages to simulate depth behind the active pages.
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

// Optional opening animation: flips 6 pages at start when book is opened.
const OpeningAnimation = ({ controls }: { controls: any }) => (
  [...Array(6)].map((_, i) => (
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

// The main interactive flipping page (for both forward and backward).
const FlipPage = ({
  direction,            // 'forward' or 'backward'
  motionValue,          // rotateY motion value controlled by drag
  boxShadow,            // dynamic shadow while dragging
  onDrag, onDragEnd, onDragStart,
  content,              // The text content shown on the flipping page
  isActive,             // Is this the currently flipping page?
  peelVisible,          // Controls whether the peel effect should show
  peelSize,             // Peel effect animated size
}: any) => {
  const isForward = direction === 'forward'

  return (
    <motion.div
      drag="x"
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      onHoverStart={() => isForward && peelVisible.set(true)}
      onHoverEnd={() => isForward && peelVisible.set(false)}
      className={`absolute ${isForward ? 'left-1/2 origin-left' : 'left-0 origin-right'} w-1/2 h-full ${isActive ? 'z-[50]' : 'z-10'}`}
      style={{
        rotateY: motionValue,
        transformStyle: 'preserve-3d',
        transformOrigin: isForward ? 'left center' : 'right center',
        boxShadow,
      }}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0} // disables elastic pull
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Page visual appearance while flipping */}
      <div className="absolute inset-0 bg-[url('/paper-texture.png')] bg-cover bg-repeat p-8 bg-[#f9f0db]">
        <p className="text-3xl font-bold text-gray-800">{content}</p>

        {/* Peel corner animation (only shown when flipping forward) */}
        {isForward && (
          <motion.div
            className="absolute bottom-0 right-0 bg-[#d6c7aa] rounded-tl-full"
            animate={{
              width: peelVisible.value ? '60px' : '0px',
              height: peelVisible.value ? '60px' : '0px',
            }}
            transition={{ duration: 0.3 }}
            style={{ width: peelSize, height: peelSize }}
          />
        )}
      </div>
    </motion.div>
  )
}

export default function Book() {
  // Tracks the currently visible page index
  const [pageIndex, setPageIndex] = useState(0)

  // Controls whether the book has been opened (can be used for intro animations)
  const [isOpen, setIsOpen] = useState(false)

  // Tracks if a page is currently being flipped and in which direction
  const [flipping, setFlipping] = useState<'forward' | 'backward' | null>(null)

  // Controls the corner peel animation
  const [peelVisible, setPeelVisible] = useState(false)

  // Motion values that rotate the page being flipped
  const forwardY = useMotionValue(0)
  const backwardY = useMotionValue(0)

  // Motion value for dynamic shadow during page flip
  const shadow = useMotionValue(0)

  // Converts rotation angle into peel size (makes peel scale with flip)
  const peelSize = useTransform(forwardY, [-180, 0, 180], ['50px', '0px', '50px'])

  // Shadow effect based on drag progress
  const boxShadow = useTransform(shadow, [0, 0.7], [
    'inset 5px 0px 10px rgba(0,0,0,0.1)',
    '15px 10px 40px rgba(0,0,0,0.3)',
  ])

  // Get current, previous and next page content
  const current = pages[pageIndex]
  const next = pages[Math.min(pageIndex + 1, pages.length - 1)]
  const prev = pages[Math.max(pageIndex - 1, 0)]

  // Controls for animations (used during book opening)
  const coverControls = useAnimation()
  const pagesControls = useAnimation()

  // Play page-flip sound effect
  const playFlip = () => {
    const sound = new Audio('/page-flip.mp3')
    sound.play()
    setTimeout(() => sound.pause(), 300)
  }

  // Called when user starts dragging a page
  const handleStart = useCallback((direction: 'forward' | 'backward') => {
    playFlip()
    setFlipping(direction)
  }, [])

  // Called during drag — rotate the page based on drag distance
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

  // Called when drag ends — either flip page or snap back
  const handleEnd = useCallback(
    (direction: 'forward' | 'backward') =>
      (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const shouldFlip =
          direction === 'forward'
            ? (info.offset.x < -30 || info.velocity.x < -200) && pageIndex < pages.length - 1
            : (info.offset.x > 30 || info.velocity.x > 200) && pageIndex > 0

        if (shouldFlip) {
          setTimeout(() => {
            setPageIndex((prev) => prev + (direction === 'forward' ? 1 : -1))
          }, 300) // wait for animation to complete
        }

        // Reset rotation and states
        forwardY.set(0)
        backwardY.set(0)
        shadow.set(0)
        setFlipping(null)
      },
    [pageIndex, forwardY, backwardY, shadow]
  )

  // Opens the book with a multi-page animated intro
  const handleOpen = () => {
    const sound = new Audio('/book-flip.mp3')
    sound.play()
    coverControls.start({ rotateY: -180, transition: { duration: 1.5, ease: 'easeInOut' } })
    pagesControls.start(i => ({
      rotateY: [-10, -180],
      transition: { duration: 1, ease: 'easeInOut', delay: i * 0.1 },
    }))
    setTimeout(() => setIsOpen(true), 1000)
  }

  return (
    <div className="flex items-center justify-center h-screen bg-[#2c3e50]">
      <div className="relative w-[740px] h-[540px] perspective-[2000px]">

        {/* Book wrapper */}
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-10">
          <motion.div
            className="flex items-center justify-center h-full w-full rounded-xl shadow-2xl px-2 py-2 bg-[#5c4033] bg-[url('/leather-texture.png')] bg-cover"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative w-[700px] h-[500px]">

              {/* Book spine line */}
              <div className="absolute left-1/2 top-0 h-full w-[2px] bg-gray-400 z-0" />

              <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative w-full h-full flex bg-white rounded-lg overflow-hidden border border-gray-300">

                  {/* Background layered pages */}
                  <PageStack />

                  {/* Static left page */}
                  <div className="w-1/2 p-8 border-r border-gray-300 bg-[#f1e7d0] bg-[url('/paper-texture.png')] bg-cover bg-repeat select-none z-10">
                    <p className="text-3xl font-bold text-gray-800">
                      {flipping === 'backward' && pageIndex > 0
                        ? prev.left
                        : current.left}
                    </p>
                  </div>

                  {/* Static right page */}
                  <div className="w-1/2 p-8 bg-[#f5ecd7] bg-[url('/paper-texture.png')] bg-cover bg-repeat select-none z-10">
                    <p className="text-3xl font-bold text-gray-800">{next.right}</p>
                  </div>

                  {/* Page being flipped forward */}
                  {pageIndex < pages.length - 1 && (
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

                  {/* Page being flipped backward */}
                  {pageIndex > 0 && (
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

        {/* Optional animated opening pages */}
        {!isOpen && <OpeningAnimation controls={pagesControls} />}

        {/* Front cover animation (only shown before open) */}
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
