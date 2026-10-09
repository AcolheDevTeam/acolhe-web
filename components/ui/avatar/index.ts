import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Avatar } from "./Avatar.vue"
export { default as AvatarFallback } from "./AvatarFallback.vue"
export { default as AvatarImage } from "./AvatarImage.vue"

export const avatarVariant = cva(
  // Iniciais sem foto: índigo claro com texto índigo (protótipo).
  "inline-flex items-center justify-center font-semibold select-none shrink-0 overflow-hidden",
  {
    variants: {
      size: {
        sm: "h-10 w-10 text-xs",
        base: "h-16 w-16 text-2xl",
        lg: "h-32 w-32 text-5xl",
      },
      // soft: pessoas na lista; brand: paciente/workspace; pending: convite.
      tone: {
        soft: "bg-positive-soft text-positive",
        brand: "bg-brand text-brand-foreground",
        pending: "border border-dashed border-input-hover bg-card text-muted-foreground",
      },
      shape: {
        circle: "rounded-full",
        square: "rounded-lg",
      },
    },
    defaultVariants: {
      tone: "soft",
    },
  },
)

export type AvatarVariants = VariantProps<typeof avatarVariant>
