import React from 'react';
import { cn } from '../../utils/helpers';

export const Button = React.forwardRef(({ className, variant = 'default', size = 'md', ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg-accent disabled:opacity-50 disabled:pointer-events-none rounded-md border";
  
  const variants = {
    default: "bg-btn-bg text-fg-default border-btn-border hover:bg-btn-hoverBg",
    primary: "bg-btn-primaryBg text-white border-transparent hover:bg-btn-primaryHoverBg shadow-sm",
    danger: "text-fg-danger border-btn-border hover:bg-btn-hoverBg",
    ghost: "border-transparent bg-transparent hover:bg-btn-hoverBg text-fg-muted hover:text-fg-default"
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 py-2 text-sm",
    lg: "h-10 px-8 text-base",
    icon: "h-9 w-9"
  };

  return (
    <button
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});
Button.displayName = "Button";
