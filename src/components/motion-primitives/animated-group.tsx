import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface AnimatedGroupProps {
  children: React.ReactNode
  variants: any
  className?: string
  delay?: number
}

export const AnimatedGroup: React.FC<AnimatedGroupProps> = ({
  children,
  variants,
  className = '',
  delay = 0,
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [delay])

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={variants.container}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child

        return (
          <motion.div key={child.key || index} variants={variants.item}>
            {child}
          </motion.div>
        )
      })}
    </motion.div>
  )
}