import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-[15px] font-semibold transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground active:bg-primary/85",
        destructive:
          "bg-destructive text-destructive-foreground active:bg-destructive/85",
        outline:
          "bg-card text-foreground active:bg-secondary",
        secondary:
          "bg-secondary text-secondary-foreground active:bg-secondary/70",
        ghost:
          "text-primary active:bg-accent",
        link:
          "text-primary underline-offset-4 hover:underline",
        tinted:
          "bg-accent text-accent-foreground active:bg-accent/70",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-lg px-3.5 text-[13px]",
        lg: "h-12 rounded-xl px-8 text-[17px]",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
