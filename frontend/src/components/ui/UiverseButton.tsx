"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface UiverseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  target?: string;
  rel?: string;
  variant?: string;
  size?: "xs" | "sm" | "md" | "lg";
  active?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  containerClassName?: string;
  innerClassName?: string;
}

export const UiverseButton = React.forwardRef<HTMLButtonElement, UiverseButtonProps>(
  (
    {
      children,
      className,
      containerClassName,
      innerClassName,
      size = "md",
      active = false,
      disabled = false,
      href,
      target,
      rel,
      icon,
      badge,
      type = "button",
      onClick,
      variant,
      ...props
    },
    ref
  ) => {
    
    // Theme matching clean, translucent button styles
    const buttonClasses = cn(
      "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent select-none whitespace-nowrap",
      // Size variants
      size === "xs" && "text-[11px] px-3 py-1.5 rounded-lg",
      size === "sm" && "text-xs px-3.5 py-2",
      size === "md" && "text-sm px-4 py-2.5",
      size === "lg" && "text-base px-6 py-3",
      
      // Default variant
      (!variant || variant === "default") && [
        "border transition-colors",
        active 
          ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]" 
          : "border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.06] hover:text-white hover:border-white/10"
      ],
      
      // Rose variant (for streams/live)
      variant === "rose" && [
        "border transition-colors",
        active 
          ? "bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
          : "border-rose-500/10 bg-rose-500/[0.03] text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-300 hover:border-rose-500/20"
      ],

      // Danger/Error variant
      variant === "danger" && [
        "border transition-colors",
        active 
          ? "bg-red-500/15 text-red-400 border-red-500/30"
          : "border-red-500/10 bg-red-500/[0.03] text-red-300/80 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/20"
      ],
      
      disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      className,
      containerClassName
    );

    const content = (
      <>
        {icon && <span className="inline-flex shrink-0 items-center justify-center">{icon}</span>}
        <span className={cn("flex items-center gap-1.5 tracking-wide", innerClassName)}>
          {children}
        </span>
        {badge && <span className="inline-flex shrink-0 items-center">{badge}</span>}
      </>
    );

    if (href) {
      return (
        <Link
          href={href}
          target={target}
          rel={rel}
          onClick={onClick as any}
          className={buttonClasses}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        onClick={onClick}
        className={buttonClasses}
        {...props}
      >
        {content}
      </button>
    );
  }
);

UiverseButton.displayName = "UiverseButton";

export default UiverseButton;



