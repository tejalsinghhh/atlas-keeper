import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-[var(--transition-smooth)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transform hover:scale-[1.02] active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-soft hover:shadow-primary rounded-button",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-button shadow-soft",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-button shadow-soft",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-button shadow-soft",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-card",
        link: "text-primary underline-offset-4 hover:underline",
        accent: "bg-accent text-accent-foreground hover:bg-accent-hover shadow-soft rounded-button",
        "primary-gradient": "bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-primary rounded-button",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 rounded-button shadow-soft",
        mode: "mode-badge rounded-full hover:scale-105",
      },
      size: {
        default: "h-11 px-6 py-3 text-sm",
        sm: "h-9 px-4 py-2 text-sm rounded-card",
        lg: "h-12 px-8 py-3 text-base rounded-button",
        xl: "h-14 px-10 py-4 text-lg rounded-button",
        icon: "h-10 w-10 rounded-card",
        badge: "h-6 px-2 py-1 text-xs rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
