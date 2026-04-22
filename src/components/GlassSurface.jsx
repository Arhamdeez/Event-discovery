import { useMemo } from 'react';
import './GlassSurface.css';

const GlassSurface = ({
  children,
  width = '100%',
  height = '100%',
  borderRadius = 20,
  blur = 9,
  backgroundOpacity = 0.12,
  saturation = 1.15,
  className = '',
  style = {},
  ...legacyProps
}) => {
  // NOTE: This component intentionally avoids SVG displacement/backdrop-filter urls
  // because they are expensive and can cause scroll jank on many devices.
  // Keep props for API compatibility, but use a simpler, cheaper “glass” effect.
  void legacyProps;
  const containerStyle = useMemo(() => ({
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    '--glass-frost': backgroundOpacity,
    '--glass-saturation': saturation,
    '--glass-blur': `${Math.min(12, Math.max(6, Number(blur) || 8))}px`,
  }), [style, width, height, borderRadius, backgroundOpacity, saturation, blur]);

  return (
    <div
      className={`glass-surface glass-surface--simple ${className}`}
      style={containerStyle}
    >
      <div className="glass-surface__content">{children}</div>
    </div>
  );
};

export default GlassSurface;
