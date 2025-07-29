import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { forwardRef } from "react"

const glassButtonVariants = cva(
  "relative inline-flex items-center justify-center rounded-full font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 overflow-hidden",
  {
    variants: {
      variant: {
        ethereal: [
          "bg-gradient-primary backdrop-blur-md border border-white/20",
          "text-foreground shadow-zen",
          "hover:shadow-breath hover:scale-105",
          "active:scale-95"
        ],
        glass: [
          "bg-white/10 backdrop-blur-md border border-white/20",
          "text-foreground shadow-lg",
          "hover:bg-white/20 hover:shadow-breath",
          "active:scale-95"
        ],
        zen: [
          "bg-gradient-ethereal backdrop-blur-sm border border-primary/30",
          "text-foreground shadow-zen",
          "hover:shadow-glow-pulse hover:border-primary/50",
          "active:scale-95"
        ]
      },
      size: {
        sm: "h-10 px-6 text-sm",
        md: "h-12 px-8 text-base",
        lg: "h-16 px-12 text-lg",
        xl: "h-20 px-16 text-xl"
      }
    },
    defaultVariants: {
      variant: "ethereal",
      size: "md"
    }
  }
)

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {}

const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        className={cn(glassButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        <div className="absolute inset-0 bg-gradient-breath opacity-0 hover:opacity-100 transition-opacity duration-500" />
        <span className="relative z-10">{children}</span>
      </button>
    )
  }
)
GlassButton.displayName = "GlassButton"

export { GlassButton, glassButtonVariants }