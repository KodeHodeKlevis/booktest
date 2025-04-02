'use client'

import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useState } from 'react'

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
  const [bookmarks, setBookmarks] = useState<number[]>([])

  const rotateY = useMotionValue(0)
  const rotateX = useMotionValue(0)
  const shadowOpacity = useMotionValue(0)
  const peelSize = useTransform(rotateY, [-180, 0, 180], ['0px', '0px', '50px'])
  const zIndex = useMotionValue(40)
  const borderRadius = useTransform(rotateY, [0, 180], [0, 30])

  const currentPage = pages[pageIndex]
  const nextPage = pages[Math.min(pageIndex + 1, pages.length - 1)]
  const prevPage = pages[Math.max(pageIndex - 1, 0)]

  const flippingToPrev = rotateY.get() > 90
  const isFlippingBack = pageIndex > 0 && rotateY.get() > 90

  const handleDrag = (_: any, info: any) => {
    const offset = info.offset.x
    const progress = Math.min(Math.max(offset / 300, -1), 1)
    const eased = progress < 0 ? -Math.pow(-progress, 0.85) : Math.pow(progress, 0.85)
    rotateY.set(eased * 180)
    rotateX.set(0)
    shadowOpacity.set(Math.min(Math.abs(eased) * 0.7, 0.7))
  }

  const handleDragEnd = (_: any, info: any) => {
    const rawProgress = info.offset.x / 250
    if ((rawProgress < -0.6 || info.velocity.x < -800) && pageIndex < pages.length - 1) {
      setPageIndex(prev => prev + 1)
    } else if ((rawProgress > 0.6 || info.velocity.x > 800) && pageIndex > 0) {
      setPageIndex(prev => prev - 1)
    }
    rotateY.set(0)
    rotateX.set(0)
    shadowOpacity.set(0)
  }

  const goToPage = async (targetIndex: number) => {
    const diff = targetIndex - pageIndex
    if (diff === 0) return
    const step = diff > 0 ? 1 : -1
    let current = pageIndex
    while (current !== targetIndex) {
      current += step
      await new Promise(resolve => setTimeout(resolve, 300))
      setPageIndex(current)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-200">
      <div className="relative w-[700px] h-[500px] perspective-[2000px]">

        <div className="absolute left-1/2 top-0 h-full w-[2px] bg-gray-300 z-0" />

        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative w-full h-full flex bg-white shadow-xl rounded-lg overflow-hidden border border-gray-300">
            <div className="w-1/2 p-8 border-r border-gray-200 bg-[#f5f1ea] select-none z-0">
              <p className="text-3xl font-bold text-gray-800">{currentPage.left}</p>
            </div>

            <div className="w-1/2 p-8 bg-[#f9f6f1] select-none z-0">
              <p className="text-3xl font-bold text-gray-800">{nextPage.right}</p>
            </div>

            <motion.div
              className={`absolute h-full w-1/2 pointer-events-auto z-50 ${isFlippingBack ? 'right-1/2 origin-right' : 'left-1/2 origin-left'}`}
              style={{
                rotateY,
                rotateX,
                zIndex,
                transformStyle: 'preserve-3d',
                transformOrigin: isFlippingBack ? 'right center' : 'left center',
                transformBox: 'fill-box',
                perspectiveOrigin: isFlippingBack ? 'right' : 'left',
                boxShadow: useTransform(
                  shadowOpacity,
                  [0, 0.7],
                  ['inset 5px 0px 10px rgba(0,0,0,0.1)', '15px 10px 40px rgba(0,0,0,0.3)']
                )
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.07}
              onDrag={handleDrag}
              onDragStart={() => zIndex.set(50)}
              onDragEnd={handleDragEnd}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-[#fbf8f3] p-8 backface-hidden rounded-l-[2px]">
                <div className="h-full flex flex-col justify-between">
                  <p className="text-3xl font-bold text-gray-800">
                    {flippingToPrev ? prevPage.right : currentPage.right}
                  </p>
                  <motion.div
                    className="absolute bottom-0 right-0 w-[50px] h-[50px] bg-[#f0eae0] rounded-tl-full shadow-inner"
                    style={{ width: peelSize, height: peelSize }}
                  />
                </div>
              </div>

              <div className="absolute inset-0 bg-[#f5f1ea] p-8 rotate-y-180 backface-hidden rounded-r-[2px]">
                <div className="h-full flex flex-col justify-start">
                  <p className="text-3xl font-bold text-gray-700">
                    {flippingToPrev ? currentPage.left : nextPage.left}
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="absolute left-1/2 top-0 w-[10px] h-full bg-gradient-to-r from-gray-300/30 to-transparent z-10 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  )
}
