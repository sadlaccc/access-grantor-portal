import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-tight ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary to-[hsl(var(--primary)/0.92)] text-primary-foreground shadow-[0_1px_0_0_hsl(var(--primary-glow)/0.6)_inset,0_6px_18px_-6px_hsl(var(--primary)/0.5)] hover:shadow-[0_1px_0_0_hsl(var(--primary-glow)/0.6)_inset,0_10px_28px_-8px_hsl(var(--primary)/0.6)] hover:-translate-y-0.5",
        destructive:
          "bg-gradient-to-b from-destructive to-[hsl(var(--destructive)/0.9)] text-destructive-foreground shadow-[0_6px_18px_-6px_hsl(var(--destructive)/0.5)] hover:shadow-[0_10px_28px_-8px_hsl(var(--destructive)/0.6)] hover:-translate-y-0.5",
        outline:
          "border border-border/70 bg-background/60 backdrop-blur-sm text-foreground hover:bg-accent/5 hover:border-primary/40 hover:text-foreground shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70 shadow-sm",
        ghost:
          "text-foreground/80 hover:bg-accent/5 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
        gradient:
          "bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary-glow))_55%,hsl(var(--accent))_100%)] text-primary-foreground shadow-[0_10px_30px_-10px_hsl(var(--primary)/0.65)] hover:shadow-[0_16px_40px_-12px_hsl(var(--primary)/0.75)] hover:-translate-y-0.5",
        success:
          "bg-gradient-to-b from-success to-[hsl(var(--success)/0.9)] text-success-foreground shadow-[0_6px_18px_-6px_hsl(var(--success)/0.5)] hover:-translate-y-0.5",
        sidebar:
          "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground rounded-lg",
        soft:
          "bg-primary/10 text-primary hover:bg-primary/15 border border-primary/15 shadow-sm",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3.5",
        lg: "h-11 rounded-xl px-8",
        xl: "h-12 rounded-xl px-10 text-base",
        icon: "h-10 w-10 rounded-lg",
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
