import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const headingVariants = cva(
  "scroll-m-20 tracking-tight",
  {
    variants: {
      level: {
        1: "text-4xl font-extrabold lg:text-5xl",
        2: "border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        3: "text-2xl font-semibold tracking-tight",
        4: "text-xl font-semibold tracking-tight",
        5: "text-lg font-semibold tracking-tight",
        6: "text-base font-semibold tracking-tight",
      },
      variant: {
        default: "",
        muted: "text-muted-foreground",
        destructive: "text-destructive",
      },
    },
    defaultVariants: {
      level: 1,
      variant: "default",
    },
  }
)

const textVariants = cva(
  "",
  {
    variants: {
      variant: {
        default: "",
        muted: "text-muted-foreground",
        destructive: "text-destructive",
        lead: "text-xl text-muted-foreground",
        large: "text-lg font-semibold",
        small: "text-sm font-medium leading-none",
        subtle: "text-sm text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div"
}

// Heading component that can render any h1-h6
const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level = 1, variant, ...props }, ref) => {
    const Comp = `h${level}` as keyof JSX.IntrinsicElements
    return (
      <Comp
        ref={ref}
        className={cn(headingVariants({ level, variant, className }))}
        {...props}
      />
    )
  }
)
Heading.displayName = "Heading"

// Individual heading components
const H1 = React.forwardRef<HTMLHeadingElement, Omit<HeadingProps, "level">>(
  ({ className, variant, ...props }, ref) => (
    <h1
      ref={ref}
      className={cn(headingVariants({ level: 1, variant, className }))}
      {...props}
    />
  )
)
H1.displayName = "H1"

const H2 = React.forwardRef<HTMLHeadingElement, Omit<HeadingProps, "level">>(
  ({ className, variant, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(headingVariants({ level: 2, variant, className }))}
      {...props}
    />
  )
)
H2.displayName = "H2"

const H3 = React.forwardRef<HTMLHeadingElement, Omit<HeadingProps, "level">>(
  ({ className, variant, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(headingVariants({ level: 3, variant, className }))}
      {...props}
    />
  )
)
H3.displayName = "H3"

const H4 = React.forwardRef<HTMLHeadingElement, Omit<HeadingProps, "level">>(
  ({ className, variant, ...props }, ref) => (
    <h4
      ref={ref}
      className={cn(headingVariants({ level: 4, variant, className }))}
      {...props}
    />
  )
)
H4.displayName = "H4"

const H5 = React.forwardRef<HTMLHeadingElement, Omit<HeadingProps, "level">>(
  ({ className, variant, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn(headingVariants({ level: 5, variant, className }))}
      {...props}
    />
  )
)
H5.displayName = "H5"

const H6 = React.forwardRef<HTMLHeadingElement, Omit<HeadingProps, "level">>(
  ({ className, variant, ...props }, ref) => (
    <h6
      ref={ref}
      className={cn(headingVariants({ level: 6, variant, className }))}
      {...props}
    />
  )
)
H6.displayName = "H6"

// Text components
const P = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant, as: Comp = "p", ...props }, ref) => (
    <Comp
      ref={ref}
      className={cn(textVariants({ variant }), "leading-7 [&:not(:first-child)]:mt-6", className)}
      {...props}
    />
  )
)
P.displayName = "P"

const Lead = React.forwardRef<HTMLParagraphElement, Omit<TextProps, "variant">>(
  ({ className, as: Comp = "p", ...props }, ref) => (
    <Comp
      ref={ref}
      className={cn(textVariants({ variant: "lead" }), className)}
      {...props}
    />
  )
)
Lead.displayName = "Lead"

const Large = React.forwardRef<HTMLParagraphElement, Omit<TextProps, "variant">>(
  ({ className, as: Comp = "div", ...props }, ref) => (
    <Comp
      ref={ref}
      className={cn(textVariants({ variant: "large" }), className)}
      {...props}
    />
  )
)
Large.displayName = "Large"

const Small = React.forwardRef<HTMLParagraphElement, Omit<TextProps, "variant">>(
  ({ className, as: Comp = "small", ...props }, ref) => (
    <Comp
      ref={ref}
      className={cn(textVariants({ variant: "small" }), className)}
      {...props}
    />
  )
)
Small.displayName = "Small"

const Subtle = React.forwardRef<HTMLParagraphElement, Omit<TextProps, "variant">>(
  ({ className, as: Comp = "p", ...props }, ref) => (
    <Comp
      ref={ref}
      className={cn(textVariants({ variant: "subtle" }), className)}
      {...props}
    />
  )
)
Subtle.displayName = "Subtle"

const Blockquote = React.forwardRef<
  HTMLQuoteElement,
  React.BlockquoteHTMLAttributes<HTMLQuoteElement>
>(({ className, ...props }, ref) => (
  <blockquote
    ref={ref}
    className={cn("mt-6 border-l-2 pl-6 italic", className)}
    {...props}
  />
))
Blockquote.displayName = "Blockquote"

const InlineCode = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <code
    ref={ref}
    className={cn(
      "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
      className
    )}
    {...props}
  />
))
InlineCode.displayName = "InlineCode"

export {
  Heading,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  P,
  Lead,
  Large,
  Small,
  Subtle,
  Blockquote,
  InlineCode,
  headingVariants,
  textVariants,
}
