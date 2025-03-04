import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  // Add CSS variable for custom indicator color through style prop
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, style, ...props }, ref) => {
  // Extract --progress-foreground from style if it exists
  const indicatorStyle: React.CSSProperties = {
    transform: `translateX(-${100 - (value || 0)}%)`,
  }
  
  // If style has custom CSS variable, use it for indicator background
  const customStyle = style as React.CSSProperties & { '--progress-foreground'?: string }
  const hasCustomForeground = customStyle && '--progress-foreground' in customStyle
  
  if (hasCustomForeground) {
    indicatorStyle.backgroundColor = customStyle['--progress-foreground'] as string
  }
  
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-primary transition-all"
        style={indicatorStyle}
      />
    </ProgressPrimitive.Root>
  )
})

Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
