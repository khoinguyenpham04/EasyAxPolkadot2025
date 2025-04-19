import React, { useEffect, useState } from 'react'

interface TextEffectProps {
  children: React.ReactNode
  as?: React.ElementType
  className?: string
  preset?: 'fade-in-blur' | 'slide-up'
  speedSegment?: number
  delay?: number
  per?: 'character' | 'word' | 'line'
}

export const TextEffect: React.FC<TextEffectProps> = ({
  children,
  as: Component = 'div',
  className = '',
  preset = 'fade-in-blur',
  speedSegment = 0.1,
  delay = 0,
  per = 'character',
}) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true)
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [delay])

  const content = React.Children.toArray(children)[0]
  const text = content?.toString() || ''

  const splitByCharacter = (text: string) => {
    return text.split('').map((char, index) => (
      <span
        key={index}
        className="inline-block"
        style={{
          opacity: visible ? 1 : 0,
          filter: preset === 'fade-in-blur' ? `blur(${visible ? 0 : 8}px)` : 'none',
          transform: preset === 'slide-up' ? `translateY(${visible ? 0 : '20px'})` : 'none',
          transition: `all ${0.5}s ease-out ${delay + index * speedSegment}s`,
        }}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ))
  }

  const splitByWord = (text: string) => {
    return text.split(' ').map((word, index) => (
      <span key={index} className="inline-block" style={{ marginRight: '0.25em' }}>
        <span
          style={{
            opacity: visible ? 1 : 0,
            filter: preset === 'fade-in-blur' ? `blur(${visible ? 0 : 8}px)` : 'none',
            transform: preset === 'slide-up' ? `translateY(${visible ? 0 : '20px'})` : 'none',
            transition: `all ${0.5}s ease-out ${delay + index * speedSegment}s`,
            display: 'inline-block',
          }}
        >
          {word}
        </span>
      </span>
    ))
  }

  const splitByLine = (text: string) => {
    return text.split('\n').map((line, index) => (
      <div key={index} className="block">
        <span
          style={{
            opacity: visible ? 1 : 0,
            filter: preset === 'fade-in-blur' ? `blur(${visible ? 0 : 8}px)` : 'none',
            transform: preset === 'slide-up' ? `translateY(${visible ? 0 : '20px'})` : 'none',
            transition: `all ${0.5}s ease-out ${delay + index * speedSegment}s`,
            display: 'inline-block',
          }}
        >
          {line}
        </span>
      </div>
    ))
  }

  let renderedContent
  if (per === 'character') {
    renderedContent = splitByCharacter(text)
  } else if (per === 'word') {
    renderedContent = splitByWord(text)
  } else if (per === 'line') {
    renderedContent = splitByLine(text)
  }

  return <Component className={className}>{renderedContent}</Component>
}