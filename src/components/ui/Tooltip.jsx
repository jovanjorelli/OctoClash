import React, { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { QuestionIcon } from '@primer/octicons-react';
import { cn } from '../../utils/helpers';

export function Tooltip({ text, content, children, className }) {
  const displayContent = text || content;
  const tooltipId = useId();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, isAbove: true });
  const triggerRef = useRef(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const triggerCenterX = rect.left + rect.width / 2;
    const padding = 16;
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const clampedLeft = Math.max(padding, Math.min(triggerCenterX, screenWidth - padding));
    const isAbove = rect.top >= 48;

    setPosition({
      top: isAbove ? rect.top - 6 : rect.bottom + 6,
      left: clampedLeft,
      isAbove,
    });
  };

  const show = () => {
    updatePosition();
    setVisible(true);
  };

  const hide = () => {
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) return;
    const handleWindowChange = () => setVisible(false);
    window.addEventListener('scroll', handleWindowChange, { passive: true, capture: true });
    window.addEventListener('resize', handleWindowChange, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleWindowChange, { capture: true });
      window.removeEventListener('resize', handleWindowChange);
    };
  }, [visible]);

  const clonedChildren = children ? React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        'aria-describedby': typeof displayContent === 'string' ? tooltipId : undefined
      });
    }
    return child;
  }) : null;

  return (
    <>
      <div 
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className={cn("inline-flex items-center", className)}
        tabIndex={children ? undefined : 0}
        aria-label={typeof displayContent === 'string' && !children ? displayContent : undefined}
        aria-describedby={!children && typeof displayContent === 'string' ? tooltipId : undefined}
      >
        {clonedChildren ? clonedChildren : <QuestionIcon size={16} className="text-fg-muted cursor-help outline-none focus:ring-2 focus:ring-fg-accent rounded-sm" />}
      </div>

      {visible && typeof document !== 'undefined' && createPortal(
        <div 
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: position.isAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
          }}
          className="w-max max-w-xs z-[9999] pointer-events-none animate-in fade-in duration-150"
        >
          <div className="bg-fg-default text-canvas-default text-xs rounded-md py-1.5 px-3 shadow-lg break-words text-center relative">
            {displayContent}
            {position.isAbove ? (
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-fg-default" />
            ) : (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-fg-default" />
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
