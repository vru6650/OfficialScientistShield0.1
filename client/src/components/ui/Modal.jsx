import React, { useEffect, useRef } from 'react';

const focusableSelectors = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]'
];

export default function Modal({
  isOpen,
  onClose,
  children,
  initialFocusRef,
  ariaLabel,
  titleId,
  className = '',
}) {
  const containerRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement;

    const container = containerRef.current;
    const focusables = container?.querySelectorAll(focusableSelectors.join(','));
    const toFocus = initialFocusRef?.current || focusables?.[0];
    if (toFocus && typeof toFocus.focus === 'function') {
      toFocus.focus();
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
      if (e.key === 'Tab') {
        // trap focus
        const focusablesList = Array.from(container.querySelectorAll(focusableSelectors.join(',')));
        if (focusablesList.length === 0) return;
        const first = focusablesList[0];
        const last = focusablesList[focusablesList.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      if (previouslyFocused.current && typeof previouslyFocused.current.focus === 'function') {
        previouslyFocused.current.focus();
      }
    };
  }, [isOpen, onClose, initialFocusRef]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={titleId}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="glass-modal__backdrop absolute inset-0" />
      <div
        ref={containerRef}
        className={`glass-modal__surface relative z-10 max-w-md w-full p-space-lg rounded-radius-lg shadow-lg focus:outline-none ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
