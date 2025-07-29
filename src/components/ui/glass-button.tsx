import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { forwardRef } from "react"

const glassButtonVariants = cva(
  "relative inline-flex items-center justify-center rounded-full font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 overflow-hidden",
  {
    variants: {
      variant: {
        ethereal: [
          "bg-white/20 backdrop-blur-md border border-white/30",
          "text-white font-semibold",
          "hover:bg-white/50 hover:scale-105 transition-all duration-300",
          "active:scale-95 shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]"
        ],
        glass: [
          "bg-white/10 backdrop-blur-md border border-white/20",
          "text-white font-medium",
          "hover:bg-white/40 hover:scale-105 transition-all duration-300",
          "active:scale-95"
        ],
        primary: [
          "bg-green-500 backdrop-blur-md border-0",
          "text-white font-semibold",
          "hover:bg-green-400 hover:scale-105 transition-all duration-300",
          "active:scale-95 shadow-[0_8px_32px_0_rgba(34,197,94,0.3)]"
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
        {children}
      </button>
    )
  }
)
GlassButton.displayName = "GlassButton"

export { GlassButton, glassButtonVariants }