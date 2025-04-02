'use client'

import dynamic from 'next/dynamic'

const Book = dynamic(() => import('../components/Book'), { ssr: false })

export default function Home() {
  return <Book />
}
