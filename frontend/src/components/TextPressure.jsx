import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// Component ported from https://codepen.io/JuanFuentes/full/rgXKGQ
// Font used - https://compressa.preusstype.com/
// Note: Make sure the font you're using supports all the variable properties.

const TextPressure = ({
  text = 'Hello!',
  flex = true,
  alpha = false,
  stroke = false,
  width = true,
  weight = true,
  italic = true,
  textColor = '#1f2937',
  strokeColor = '#3b82f6',
  minFontSize = 24,
  className = '',
}) => {
  const containerRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [charPositions, setCharPositions] = useState([])

  // Update character positions when component mounts or text changes
  useEffect(() => {
    const updatePositions = () => {
      if (!containerRef.current) return

      const chars = containerRef.current.querySelectorAll('.text-pressure-char')
      const positions = Array.from(chars).map((char) => {
        const rect = char.getBoundingClientRect()
        const containerRect = containerRef.current.getBoundingClientRect()
        return {
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top + rect.height / 2 - containerRect.top,
        }
      })
      setCharPositions(positions)
    }

    // Initial position update
    setTimeout(updatePositions, 100)

    // Update on resize
    window.addEventListener('resize', updatePositions)
    return () => window.removeEventListener('resize', updatePositions)
  }, [text])

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    const handleMouseEnter = () => setIsHovered(true)
    const handleMouseLeave = () => {
      setIsHovered(false)
      setMousePos({ x: -1000, y: -1000 }) // Move far away to reset
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseenter', handleMouseEnter)
      container.addEventListener('mouseleave', handleMouseLeave)

      return () => {
        container.removeEventListener('mousemove', handleMouseMove)
        container.removeEventListener('mouseenter', handleMouseEnter)
        container.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [])

  const characters = text.split('')
  const maxDistance = 120

  return (
    <div
      ref={containerRef}
      className={`relative inline-block`}
      style={{
        cursor: 'crosshair',
        userSelect: 'none',
      }}
    >
      <div
        className={className}
        style={{
          display: flex ? 'flex' : 'inline-block',
          flexWrap: 'wrap',
          alignItems: 'center',
          fontFamily: "'Poppins', sans-serif",
          lineHeight: '1.3',
          color: textColor,
        }}
      >
        {characters.map((char, index) => {
          const charPos = charPositions[index] || { x: 0, y: 0 }
          
          // Calculate distance from mouse to character
          const dx = mousePos.x - charPos.x
          const dy = mousePos.y - charPos.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          // Calculate pressure (closer = higher pressure)
          const pressure = Math.max(0, Math.min(1, 1 - distance / maxDistance))

          // Calculate animated properties
          const currentScale = 1 + pressure * 0.15
          const currentWeight = weight ? Math.round(700 + pressure * 200) : 700
          const currentOpacity = alpha ? 0.6 + pressure * 0.4 : 1
          const currentItalic = italic && pressure > 0.3 ? pressure : 0

          return (
            <motion.span
              key={`${char}-${index}-${text}`}
              className="text-pressure-char"
              style={{
                display: 'inline-block',
                fontWeight: currentWeight,
                fontVariationSettings: weight || width
                  ? `'wght' ${currentWeight}${width ? `, 'wdth' ${Math.round(100 - pressure * 10)}` : ''}`
                  : 'normal',
                fontStyle: italic && pressure > 0.5 ? 'italic' : 'normal',
                color: textColor,
                opacity: currentOpacity,
                textShadow: stroke
                  ? `-1px -1px 0 ${strokeColor}, 1px -1px 0 ${strokeColor}, -1px 1px 0 ${strokeColor}, 1px 1px 0 ${strokeColor}`
                  : 'none',
                scale: currentScale,
                transformOrigin: 'center',
                filter: isHovered && pressure > 0.3
                  ? `drop-shadow(0 0 ${pressure * 6}px rgba(59, 130, 246, ${pressure * 0.5}))`
                  : 'none',
              }}
              transition={{
                duration: 0.12,
                ease: 'easeOut',
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          )
        })}
      </div>
    </div>
  )
}

export default TextPressure
