'use client'

import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion'
import { useState, useCallback } from 'react'

const pages = [
  { left: '📖 Cover', right: '📝 Introduction' },
  { left: '📚 Chapter 1', right: '✍️ Page 1 Content' },
  { left: '📚 Chapter 2', right: '✍️ Page 2 Content' },
  { left: '🏁 The End', right: '🔙 Back Cover' },
]

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

const OpeningAnimation = ({ controls }: { controls: any }) => (
  [...Array(6)].map((_, i) => (
    <motion.div
      key={i} custom={i} animate={controls} initial={{ rotateY: 0 }}
      className="absolute w-full h-full bg-[#f3e9cf] bg-[url('/paper-texture.png')] bg-cover bg-repeat rounded-xl shadow-inner"
      style={{ transformStyle: 'preserve-3d', zIndex: 40 - i }}
    />
  ))
)

const FlipPage = ({
  direction, motionValue, boxShadow, onDrag, onDragEnd, onDragStart,
  content, isActive, peelVisible, peelSize,
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
      dragElastic={0}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="absolute inset-0 bg-[url('/paper-texture.png')] bg-cover bg-repeat p-8 bg-[#f9f0db]">
        <p className="text-3xl font-bold text-gray-800">{content}</p>
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

  const current = pages[pageIndex]
  const next = pages[Math.min(pageIndex + 1, pages.length - 1)]
  const prev = pages[Math.max(pageIndex - 1, 0)]

  const coverControls = useAnimation()
  const pagesControls = useAnimation()

  const playFlip = () => {
    const sound = new Audio('/page-flip.mp3')
    sound.play()
    setTimeout(() => sound.pause(), 300)
  }

  const handleStart = useCallback((direction: 'forward' | 'backward') => {
    playFlip()
    setFlipping(direction)
  }, [])

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
          }, 300)
        }

        forwardY.set(0)
        backwardY.set(0)
        shadow.set(0)
        setFlipping(null)
      },
    [pageIndex, forwardY, backwardY, shadow]
  )

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
                  <PageStack />

                  <div className="w-1/2 p-8 border-r border-gray-300 bg-[#f1e7d0] bg-[url('/paper-texture.png')] bg-cover bg-repeat select-none z-10">
                    <p className="text-3xl font-bold text-gray-800">{current.left}</p>
                  </div>

                  <div className="w-1/2 p-8 bg-[#f5ecd7] bg-[url('/paper-texture.png')] bg-cover bg-repeat select-none z-10">
                    <p className="text-3xl font-bold text-gray-800">{next.right}</p>
                  </div>

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
