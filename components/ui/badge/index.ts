import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Badge } from "./Badge.vue"

// Pílulas do novo design: 26px, raio total, 12/500, sem borda (seção 2 do mapa).
// As variantes antigas continuam aceitas e caem no tom equivalente.
export const badgeVariants = cva(
  "inline-flex h-[26px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-positive-soft text-positive",
        positive: "bg-positive-soft text-positive",
        secondary: "bg-secondary text-secondary-foreground",
        neutral: "bg-secondary text-secondary-foreground",
        warning: "bg-warning-soft text-warning",
        destructive: "bg-destructive-soft text-destructive",
        danger: "bg-destructive-soft text-destructive",
        strong: "bg-brand text-brand-foreground",
        outline: "border border-border bg-card text-secondary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export type BadgeVariants = VariantProps<typeof badgeVariants>
