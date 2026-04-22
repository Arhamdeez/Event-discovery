/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo } from 'react';
import './GlassSurface.css';

const GlassSurface = ({
  children,
  width = '100%',
  height = '100%',
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.975,
  blur = 9,
  displace = 0,
  backgroundOpacity = 0.12,
  saturation = 1.15,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = 'R',
  yChannel = 'G',
  mixBlendMode = 'normal',
  className = '',
  style = {},
}) => {
  // NOTE: This component intentionally avoids SVG displacement/backdrop-filter urls
  // because they are expensive and can cause scroll jank on many devices.
  // Keep props for API compatibility, but use a simpler, cheaper “glass” effect.
  const containerStyle = useMemo(() => ({
    ...style,
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    '--glass-frost': backgroundOpacity,
    '--glass-saturation': saturation,
  }), [style, width, height, borderRadius, backgroundOpacity, saturation]);

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
