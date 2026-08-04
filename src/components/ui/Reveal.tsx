import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useReveal } from '../../hooks/useReveal';

interface RevealProps {
  as?: ElementType;
  className?: string;
  delay?: number;
  threshold?: number;
  children: ReactNode;
}

// Thin wrapper around useReveal: renders `as` (default <div>) with the
// `.reveal` / `.reveal--visible` classes and an optional stagger delay
// (in seconds) exposed as `--reveal-delay`, so callers just wrap content
// instead of wiring up an observer per section. See `.reveal` in
// global.css for the actual opacity/blur/translate transition.
export function Reveal({ as: Tag = 'div', className = '', delay = 0, threshold, children }: RevealProps) {
  const { ref, visible } = useReveal<HTMLElement>(threshold);
  const style = delay ? ({ '--reveal-delay': `${delay}s` } as CSSProperties) : undefined;

  return (
    <Tag
      // `as` is a dynamic ElementType, so its ref type can't be narrowed
      // statically — safe in practice since useReveal only ever attaches
      // opacity/transform/observer behavior common to all HTML elements.
      ref={ref as never}
      className={`reveal${visible ? ' reveal--visible' : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      {children}
    </Tag>
  );
}
