'use client'

import { motion, useTransform, MotionValue } from 'framer-motion'

type FlipPageProps = {
  direction: 'forward' | 'backward' // Flip direction
  motionValue: MotionValue<number> // Controls rotation (rotateY)
  boxShadow: MotionValue<string>   // Controls dynamic shadow during flip
  onDrag: any                      // Callback when dragging
  onDragEnd: any                   // Callback when drag ends
  onDragStart: any                 // Callback when drag starts
  content: string                  // Page text content
  isActive: boolean                // Whether this page is currently flipping
  peelVisible: {                  // Page corner peel visibility controller
    value: boolean
    set: (v: boolean) => void
  }
  peelSize: MotionValue<string>   // Size of the peel corner (not used here)
}

export default function FlipPage({
  direction,
  motionValue,
  boxShadow,
  onDrag,
  onDragEnd,
  onDragStart,
  content,
  isActive,
  peelVisible,
  peelSize,
}: FlipPageProps) {
  const isForward = direction === 'forward' // For conditional layout and style

  // Slight page curve while flipping to simulate bending
  const scaleX = useTransform(motionValue, [-180, 0, 180], [0.92, 1, 0.92])
  const scaleY = useTransform(motionValue, [-180, 0, 180], [0.98, 1, 0.98])

  // Subtle blur effect to enhance depth as page flips
  const blurAmount = useTransform(motionValue, [-180, -60, 0, 60, 180], ['3px', '4px', '0px', '4px', '3px'])

  // Light reflection overlay while flipping
  const lightOverlayOpacity = useTransform(motionValue, [-180, 0, 180], [0.25, 0, 0.25])

  // Rounded corners change slightly while flipping
  const borderRadius = useTransform(
    motionValue,
    [-180, -90, 0, 90, 180],
    ['0px 20px 20px 0px', '0px 10px 10px 0px', '0px', '0px 10px 10px 0px', '0px 20px 20px 0px']
  )

  // Simulated "curl" on the edge of the page
  const edgeCurl = useTransform(motionValue, [-180, 0, 180], ['0%', '5%', '0%'])

  return (
    <motion.div
      drag="x"                    // Allow horizontal dragging
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      onHoverStart={() => isForward && peelVisible.set(true)}   // Show peel corner on hover
      onHoverEnd={() => isForward && peelVisible.set(false)}
      className={`absolute ${
        isForward ? 'left-1/2 origin-left' : 'left-0 origin-right'
      } w-1/2 h-full ${isActive ? 'z-[50]' : 'z-10'}`} // Layout: flip from center outward
      style={{
        rotateY: motionValue,
        scaleX: scaleX,
        scaleY: scaleY,
        filter: blurAmount,
        transformStyle: 'preserve-3d',
        transformOrigin: isForward ? 'left center' : 'right center',
        boxShadow,
        borderRadius,
      }}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0} // No springy drag
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Front Side of the Flipping Page */}
      <motion.div
        className={`absolute inset-0 p-8 text-gray-800 text-3xl font-bold overflow-hidden`}
        style={{
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden', // Hide when flipped
          borderRadius: isForward ? '0 4px 4px 0' : '4px 0 0 4px',
          background: `linear-gradient(to ${isForward ? 'right' : 'left'}, 
            #f9f0db 85%, 
            #e0d5b8 95%,
            transparent 100%)`,
          // Clip-path adds a curled visual effect
          clipPath: useTransform(edgeCurl, (curl) =>
            `polygon(${isForward ? '0%' : `${curl} 50%`}, 0%, 100% 0%, 100% 100%, ${isForward ? `${curl} 50%` : '0%'} 100%)`
          ),
        }}
      >
        {/* Page Text */}
        <p>{content}</p>

        {/* Light Shine Overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white to-transparent"
          style={{ opacity: lightOverlayOpacity }}
        />
      </motion.div>

      {/* Back Side of the Page (mirrored, no content shown but with texture) */}
      <motion.div
        className={`absolute inset-0 p-8 text-gray-800 text-3xl font-bold overflow-hidden`}
        style={{
          transform: 'rotateY(180deg)', // Flips the back side
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
          borderRadius: isForward ? '4px 0 0 4px' : '0 4px 4px 0',
          background: `linear-gradient(to ${isForward ? 'left' : 'right'}, 
            #f0e6cc 85%, 
            #d8ccb0 95%,
            transparent 100%)`,
          clipPath: useTransform(edgeCurl, (curl) =>
            `polygon(${isForward ? '0%' : `${curl} 50%`}, 0%, 100% 0%, 100% 100%, ${isForward ? `${curl} 50%` : '0%'} 100%)`
          ),
        }}
      >
        {/* No content here for now — you could add "Back of page" designs */}
      </motion.div>

      {/* Page Peel Effect (bottom corner) — appears only on forward pages */}
      {isForward && (
        <motion.div
          className="absolute bottom-0 right-0 w-[60px] h-[60px] bg-[#ebc984] rounded-tl-full pointer-events-none z-[101] hover:cursor-pointer"
          animate={{
            scale: peelVisible.value ? 1 : 0,
            opacity: peelVisible.value ? 1 : 0,
            y: peelVisible.value ? -4 : 0,
            boxShadow: peelVisible.value
              ? '0px 8px 15px rgba(0,0,0,0.25)'
              : '0px 2px 5px rgba(0,0,0,0.1)',
          }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 18,
          }}
        />
      )}
    </motion.div>
  )
}
