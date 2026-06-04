'use client'

import { useEffect, useState } from 'react'

interface TypewriterProps {
  texts: string[]
  speed?: number
  delay?: number
  className?: string
  signatureStartIndex?: number
}

export default function Typewriter({
  texts,
  speed = 50,
  delay = 100,
  className = '',
  signatureStartIndex,
}: TypewriterProps) {
  const [displayedTexts, setDisplayedTexts] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (texts.length === 0) return

    const currentText = texts[currentTextIndex]
    if (!currentText) {
      setIsComplete(true)
      return
    }

    if (currentIndex < currentText.length) {
      const timer = setTimeout(() => {
        setDisplayedTexts((prev) => {
          const newTexts = [...prev]
          if (!newTexts[currentTextIndex]) {
            newTexts[currentTextIndex] = ''
          }
          newTexts[currentTextIndex] = currentText.slice(0, currentIndex + 1)
          return newTexts
        })
        setCurrentIndex((prev) => prev + 1)
      }, speed)

      return () => clearTimeout(timer)
    } else if (currentTextIndex < texts.length - 1) {
      const timer = setTimeout(() => {
        setCurrentTextIndex((prev) => prev + 1)
        setCurrentIndex(0)
      }, delay)

      return () => clearTimeout(timer)
    } else {
      setIsComplete(true)
    }
  }, [currentIndex, currentTextIndex, texts, speed, delay])

  const regularTexts = signatureStartIndex !== undefined ? displayedTexts.slice(0, signatureStartIndex) : displayedTexts
  const signatureTexts = signatureStartIndex !== undefined ? displayedTexts.slice(signatureStartIndex) : []
  const hasSignature = signatureStartIndex !== undefined && displayedTexts.length > signatureStartIndex

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {regularTexts.map((text, index) => (
        <p key={index}>{text}</p>
      ))}
      {hasSignature && (
        <div className="mt-10">
          {signatureTexts.map((text, index) => (
            <p key={index} className="pl-[75%] md:pl-[80%]">
              {text}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
