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

  const rotateYForward = useMotionValue(0)
  const rotateYBack = useMotionValue(180)
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

  const handleForwardDrag = (_: any, info: any) => {
    const progress = Math.min(Math.max(info.offset.x / -120, 0), 1)
    rotateYForward.set(progress * 180)
    shadowOpacity.set(progress * 0.7)
  }

  const handleForwardEnd = (_: any, info: any) => {
    if ((info.offset.x < -30 || info.velocity.x < -200) && pageIndex < pages.length - 1) {
      setPageIndex(p => p + 1)
    }
    rotateYForward.set(0)
    rotateYBack.set(180) // reset backward flip
    shadowOpacity.set(0)
  }

  const handleBackDrag = (_: any, info: any) => {
    const progress = Math.min(Math.max(info.offset.x / 120, 0), 1)
    rotateYBack.set(180 - progress * 180)
    shadowOpacity.set(progress * 0.7)
  }

  const handleBackEnd = (_: any, info: any) => {
    if ((info.offset.x > 30 || info.velocity.x > 200) && pageIndex > 0) {
      setPageIndex(p => p - 1)
    }
    rotateYBack.set(180)
    rotateYForward.set(0) // reset forward flip
    shadowOpacity.set(0)
  }

  const rotateYReturn = useMotionValue(0)

const handleReturnDrag = (_: any, info: any) => {
  const progress = Math.min(Math.max(info.offset.x / 120, 0), 1)
  rotateYReturn.set(-progress * 180)
  shadowOpacity.set(progress * 0.7)
}

const handleReturnEnd = (_: any, info: any) => {
  if ((info.offset.x > 30 || info.velocity.x > 200) && pageIndex > 0) {
    setPageIndex(p => p - 1)
  }
  rotateYReturn.set(0)
  rotateYBack.set(180)
  rotateYForward.set(0)
  shadowOpacity.set(0)
}


  return (
    <div className="flex items-center justify-center h-screen bg-gray-200">
      <div className="relative w-[700px] h-[500px] perspective-[2000px]">
        <div className="absolute left-1/2 top-0 h-full w-[2px] bg-gray-300 z-0" />

        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative w-full h-full flex bg-white shadow-xl rounded-lg overflow-hidden border border-gray-300">
            {/* Left Static Page */}
            <div className="w-1/2 p-8 border-r border-gray-200 bg-[#f5f1ea] select-none z-0">
              <p className="text-3xl font-bold text-gray-800">{currentPage.left}</p>
            </div>

            {/* Right Static Page */}
            <div className="w-1/2 p-8 bg-[#f9f6f1] select-none z-0">
              <p className="text-3xl font-bold text-gray-800">{nextPage.right}</p>
            </div>

            {/* Forward Page Flip (right → left) */}
            {pageIndex < pages.length - 1 && (
              <motion.div
                className="absolute left-1/2 w-1/2 h-full origin-left z-40"
                style={{
                  rotateY: rotateYForward,
                  transformStyle: 'preserve-3d',
                  transformOrigin: 'left center',
                  boxShadow: flippingBoxShadow,
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.08}
                onDrag={handleForwardDrag}
                onDragEnd={handleForwardEnd}
              >
                <div className="absolute inset-0 bg-[#fbf8f3] p-8 backface-hidden">
                  <p className="text-3xl font-bold text-gray-800">{currentPage.right}</p>
                  <motion.div
                    className="absolute bottom-0 right-0 bg-[#eee8de] rounded-tl-full"
                    style={{ width: peelSize, height: peelSize }}
                  />
                </div>
                <div className="absolute inset-0 bg-[#f5f1ea] p-8 rotate-y-180 backface-hidden">
                  <p className="text-3xl font-bold text-gray-700">{nextPage.left}</p>
                </div>
              </motion.div>
            )}

            {/* Return Page Flip (left → right, interactive left page) */}
            {pageIndex > 0 && (
              <motion.div
                className="absolute left-0 w-1/2 h-full origin-right z-50"
                style={{
                  rotateY: rotateYReturn,
                  transformStyle: 'preserve-3d',
                  transformOrigin: 'right center',
                  boxShadow: flippingBoxShadow,
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.08}
                onDrag={handleReturnDrag}
                onDragEnd={handleReturnEnd}
              >
                {/* Front face: current left page */}
                <div className="absolute inset-0 bg-[#f5f1ea] p-8 backface-hidden">
                  <p className="text-3xl font-bold text-gray-800">{currentPage.left}</p>
                </div>

                {/* Back face: previous right page (rotated) */}
                <div className="absolute inset-0 bg-[#fbf8f3] p-8 rotate-y-180 backface-hidden">
                  <p className="text-3xl font-bold text-gray-700">{prevPage.right}</p>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}