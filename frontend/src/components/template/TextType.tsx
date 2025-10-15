'use client'

import { useEffect, useState } from 'react'

interface TextTypeProps {
  text: string[]
  typingSpeed?: number
  initialDelay?: number
  showCursor?: boolean
  cursorCharacter?: string
  className?: string
  cursorClassName?: string
  startOnVisible?: boolean
  loop?: boolean
}

const TextType = ({
  text,
  typingSpeed = 50,
  initialDelay = 0,
  showCursor = true,
  cursorCharacter = '|',
  className = '',
  cursorClassName = '',
  startOnVisible = false,
  loop = false,
}: TextTypeProps) => {
  const [displayedText, setDisplayedText] = useState('')
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(!startOnVisible)
  const [isTyping, setIsTyping] = useState(false)

  const textToType = text[0] || ''

  useEffect(() => {
    if (!isVisible) return

    if (currentCharIndex === 0 && !isTyping) {
      const timer = setTimeout(() => {
        setIsTyping(true)
      }, initialDelay)
      return () => clearTimeout(timer)
    }

    if (isTyping && currentCharIndex < textToType.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + textToType[currentCharIndex])
        setCurrentCharIndex(prev => prev + 1)
      }, typingSpeed)
      return () => clearTimeout(timer)
    }
  }, [currentCharIndex, isVisible, isTyping, textToType, typingSpeed, initialDelay])

  useEffect(() => {
    if (startOnVisible) {
      setIsVisible(true)
    }
  }, [startOnVisible])

  return (
    <span className={`inline-block ${className}`}>
      <span className="inline-block">
        {displayedText}
      </span>
      {showCursor && (
        <span 
          className={`inline-block ml-1 animate-pulse ${cursorClassName}`}
          style={{ animationDuration: '1s' }}
        >
          {cursorCharacter}
        </span>
      )}
    </span>
  )
}

export default TextType