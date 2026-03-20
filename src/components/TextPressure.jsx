/**
 * TextPressure — variable-font mouse interaction (React Bits / CodePen JuanFuentes)
 * Font: Compressa VF
 */
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';

const dist = (a, b) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const getAttr = (distance, maxDist, minVal, maxVal) => {
  const val = maxVal - Math.abs((maxVal * distance) / maxDist);
  return Math.max(minVal, val + minVal);
};

const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const TextPressure = ({
  text = 'Compressa',
  fontFamily = 'Compressa VF',
  fontUrl = 'https://res.cloudinary.com/dr6lvwubh/raw/upload/v1529908256/CompressaPRO-GX.woff2',

  width = true,
  /** Cap `wdth` axis (default 200 is too wide for narrow layouts). */
  maxWidthAxis = 200,
  weight = true,
  italic = true,
  alpha = false,

  flex = true,
  stroke = false,
  scale = false,

  textColor = '#FFFFFF',
  strokeColor = '#FF0000',
  className = '',

  minFontSize = 24,
}) => {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const spansRef = useRef([]);

  const mouseRef = useRef({ x: 0, y: 0 });
  const cursorRef = useRef({ x: 0, y: 0 });

  const [fontSize, setFontSize] = useState(minFontSize);
  const [scaleY, setScaleY] = useState(1);
  const [lineHeight, setLineHeight] = useState(1);

  const chars = useMemo(() => text.split(''), [text]);
  const wdthMax = Math.min(Math.max(maxWidthAxis, 5), 200);

  useEffect(() => {
    const handleMouseMove = (e) => {
      cursorRef.current.x = e.clientX;
      cursorRef.current.y = e.clientY;
    };
    const handleTouchMove = (e) => {
      const t = e.touches[0];
      if (t) {
        cursorRef.current.x = t.clientX;
        cursorRef.current.y = t.clientY;
      }
    };
    const handleTouchStart = (e) => {
      const t = e.touches[0];
      if (t) {
        cursorRef.current.x = t.clientX;
        cursorRef.current.y = t.clientY;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    if (containerRef.current) {
      const { left, top, width: w, height: h } = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = left + w / 2;
      mouseRef.current.y = top + h / 2;
      cursorRef.current.x = mouseRef.current.x;
      cursorRef.current.y = mouseRef.current.y;
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  const setSize = useCallback(() => {
    if (!containerRef.current || !titleRef.current) return;

    const { width: containerW, height: containerH } = containerRef.current.getBoundingClientRect();
    if (containerW <= 0) return;

    const charFactor = Math.max(chars.length * 0.58, 8);
    let newFontSize = (containerW * 0.96) / charFactor;
    newFontSize = Math.max(newFontSize, minFontSize);

    setFontSize(newFontSize);
    setScaleY(1);
    setLineHeight(1);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = titleRef.current;
        const box = containerRef.current;
        if (!el || !box) return;

        const cw = box.clientWidth;
        let fs = newFontSize;
        el.style.fontSize = `${fs}px`;

        while (el.scrollWidth > cw && fs > minFontSize) {
          fs -= 1;
          el.style.fontSize = `${fs}px`;
        }

        const textRect = el.getBoundingClientRect();
        if (scale && textRect.height > 0) {
          const yRatio = containerH / textRect.height;
          setScaleY(yRatio);
          setLineHeight(yRatio);
        }

        el.style.fontSize = '';
        if (Math.abs(fs - newFontSize) > 0.5) {
          setFontSize(fs);
        }
      });
    });
  }, [chars.length, minFontSize, scale]);

  useEffect(() => {
    const debouncedSetSize = debounce(setSize, 100);
    debouncedSetSize();
    window.addEventListener('resize', debouncedSetSize);
    return () => window.removeEventListener('resize', debouncedSetSize);
  }, [setSize]);

  useEffect(() => {
    let rafId;
    const animate = () => {
      mouseRef.current.x += (cursorRef.current.x - mouseRef.current.x) / 15;
      mouseRef.current.y += (cursorRef.current.y - mouseRef.current.y) / 15;

      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect();
        const maxDist = Math.max(titleRect.width / 2, 1);

        spansRef.current.forEach((span) => {
          if (!span) return;

          const rect = span.getBoundingClientRect();
          const charCenter = {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
          };

          const d = dist(mouseRef.current, charCenter);

          const wdth = width ? Math.floor(getAttr(d, maxDist, 5, wdthMax)) : 100;
          const wght = weight ? Math.floor(getAttr(d, maxDist, 100, 900)) : 400;
          const italVal = italic ? getAttr(d, maxDist, 0, 1).toFixed(2) : 0;
          const alphaVal = alpha ? getAttr(d, maxDist, 0, 1).toFixed(2) : 1;

          const newFontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`;

          if (span.style.fontVariationSettings !== newFontVariationSettings) {
            span.style.fontVariationSettings = newFontVariationSettings;
          }
          if (alpha && span.style.opacity !== alphaVal) {
            span.style.opacity = alphaVal;
          }
        });
      }

      rafId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(rafId);
  }, [width, weight, italic, alpha, wdthMax]);

  const styleElement = useMemo(
    () => (
      <style>
        {`
        @font-face {
          font-family: '${fontFamily}';
          src: url('${fontUrl}') format('woff2');
          font-style: normal;
          font-display: swap;
        }

        .text-pressure-root.text-pressure-flex {
          display: flex;
          flex-wrap: nowrap;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          box-sizing: border-box;
        }

        .text-pressure-root.text-pressure-flex .text-pressure-char {
          flex-shrink: 0;
          flex-grow: 0;
        }

        .text-pressure-stroke .text-pressure-char {
          position: relative;
          color: ${textColor};
        }
        .text-pressure-stroke .text-pressure-char::after {
          content: attr(data-char);
          position: absolute;
          left: 0;
          top: 0;
          color: transparent;
          z-index: -1;
          -webkit-text-stroke-width: 3px;
          -webkit-text-stroke-color: ${strokeColor};
        }

        .text-pressure-title {
          color: ${textColor};
        }
      `}
      </style>
    ),
    [fontFamily, fontUrl, textColor, strokeColor]
  );

  const titleClassName = [
    'text-pressure-title',
    'text-pressure-root',
    className,
    flex ? 'text-pressure-flex' : '',
    stroke ? 'text-pressure-stroke' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerRef}
      className="text-pressure"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: 'transparent',
      }}
    >
      {styleElement}
      <div
        ref={titleRef}
        className={titleClassName}
        style={{
          fontFamily,
          textTransform: 'uppercase',
          fontSize,
          lineHeight,
          transform: `scale(1, ${scaleY})`,
          transformOrigin: 'center top',
          margin: 0,
          textAlign: 'center',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          overflow: 'visible',
          letterSpacing: '0.012em',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.45)',
          fontWeight: 560,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
        }}
      >
        {chars.map((char, i) => (
          <span
            key={`${char}-${i}`}
            ref={(el) => {
              spansRef.current[i] = el;
            }}
            className="text-pressure-char"
            data-char={char}
            style={{
              display: 'inline-block',
              color: stroke ? undefined : textColor,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TextPressure;
