import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

// Botões do novo design (docs/design/novo-design.md, seção 2): raio 10, 14/600,
// sem sombra parada; o primário ganha sombra índigo só no hover.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out active:scale-[.985] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // primário: índigo
        default: "bg-primary text-primary-foreground hover:bg-primary-hover hover:shadow-[0_6px_18px_rgba(64,64,214,.22)]",
        // perigo: alerta
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive-hover",
        // perigo suave: texto de aviso, fundo claro no hover
        "destructive-soft": "border border-[#F3C9C1] bg-card text-warning hover:bg-warning-soft",
        // secundário: branco com borda
        outline: "border border-input bg-card text-foreground hover:border-input-hover hover:bg-surface-subtle",
        secondary: "bg-secondary text-secondary-foreground hover:bg-surface-hover",
        // quieto
        ghost: "text-secondary-foreground hover:bg-surface-hover hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // sobre fundo Noite (blocos de marca)
        "on-brand": "bg-card text-brand hover:bg-brand-foreground",
        "on-brand-outline": "border border-[rgba(220,226,250,.3)] bg-transparent text-brand-foreground hover:bg-white/10",
      },
      size: {
        "default": "h-10 px-4",
        "xs": "h-8 rounded-md px-2.5 text-xs",
        "sm": "h-9 px-3 text-[13px]",
        "lg": "h-11 px-5",
        "xl": "h-12 rounded-xl px-6 text-[15px]",
        "icon": "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
