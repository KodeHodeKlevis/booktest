'use client'

import { motion, useTransform, MotionValue } from 'framer-motion'

type FlipPageProps = {
  direction: 'forward' | 'backward'
  motionValue: MotionValue<number>
  boxShadow: MotionValue<string>
  onDrag: any
  onDragEnd: any
  onDragStart: any
  content: string
  isActive: boolean
  peelVisible: { value: boolean; set: (v: boolean) => void }
  peelSize: MotionValue<string>
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
  const isForward = direction === 'forward'

  // Simulate a slight bend effect as page rotates
  const skewY = useTransform(motionValue, [-180, 0, 180], ['4deg', '0deg', '-4deg'])
  const scaleY = useTransform(motionValue, [-180, 0, 180], [1, 1, 1])

  // ✨ Motion blur based on flipping speed
  const blurAmount = useTransform(motionValue, [-180, -60, 0, 60, 180], ['3px', '1.5px', '0px', '1.5px', '3px'])

  // ✨ Simulate dynamic light across the page as it rotates
  const lightOverlayOpacity = useTransform(motionValue, [-180, 0, 180], [0.25, 0, 0.25])

  return (
    <motion.div
      drag="x"
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      onHoverStart={() => isForward && peelVisible.set(true)}
      onHoverEnd={() => isForward && peelVisible.set(false)}
      className={`absolute ${
        isForward ? 'left-1/2 origin-left' : 'left-0 origin-right'
      } w-1/2 h-full ${isActive ? 'z-[50]' : 'z-10'}`}
      style={{
        rotateY: motionValue,
        skewY,
        scaleY,
        filter: blurAmount, // 💨 Motion blur
        transformStyle: 'preserve-3d',
        transformOrigin: isForward ? 'left center' : 'right center',
        boxShadow,
      }}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="absolute inset-0 bg-[#f9f0db] p-8 bg-[url('/paper-texture.png')] bg-cover bg-repeat text-gray-800 text-3xl font-bold overflow-hidden">

        {/* Actual page content */}
        <p>{content}</p>

        {/* 💡 Simulated lighting highlight */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-white to-transparent pointer-events-none"
          style={{ opacity: lightOverlayOpacity }}
        />

        {/* 📄 Peel animation */}
        {isForward && (
            <motion.div
                className="absolute bottom-0 right-0 w-[60px] h-[60px] bg-[#ebc984] rounded-tl-full pointer-events-none z-[101]"
                animate={{
                scale: peelVisible.value ? 1 : 0,
                opacity: peelVisible.value ? 1 : 0,
                y: peelVisible.value ? -4 : 0, // subtle lift
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
      </div>
    </motion.div>
  )
}
