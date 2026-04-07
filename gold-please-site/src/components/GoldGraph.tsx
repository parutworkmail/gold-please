import React, { useState, useRef } from 'react';
import { useGoldPrices, type Timeframe } from '../hooks/useGoldPrices';

const GoldGraph: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [visibleCount, setVisibleCount] = useState(20);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [priceMin, setPriceMin] = useState(4695);
  const [priceMax, setPriceMax] = useState(4715);
  const chartRef = useRef<HTMLDivElement>(null);
  const { prices, loading } = useGoldPrices(timeframe);
  const width = 980;
  const height = 520;
  const padding = 60;
  const volumeHeight = 100;
  const chartHeight = height - padding * 2 - volumeHeight - 24;
  const upColor = '#22c55e';
  const downColor = '#ef4444';
  const gridColor = '#e5e7eb';
  const axisColor = '#6b7280';

  if (loading) {
    return <div>Loading gold price chart...</div>;
  }

  if (prices.length === 0) {
    return <div>No price data available yet.</div>;
  }

  const visibleCountClamped = Math.min(Math.max(visibleCount, 5), prices.length);
  const maxScrollOffset = Math.max(0, prices.length - visibleCountClamped);
  const scrollOffsetClamped = Math.min(Math.max(scrollOffset, 0), maxScrollOffset);
  const startIndex = Math.max(0, prices.length - visibleCountClamped - scrollOffsetClamped);
  const visiblePrices = prices.slice(startIndex, startIndex + visibleCountClamped);
  
  const maxPrice = priceMax;
  const minPrice = priceMin;
  const maxVolume = Math.max(...visiblePrices.map((item) => item.volume));
  const priceRange = maxPrice - minPrice;
  const xStep = (width - padding * 2) / Math.max(visiblePrices.length - 1, 1);
  const candleWidth = Math.max(8, Math.min(40, xStep * 0.6));

  const priceY = (price: number) => padding + ((maxPrice - price) / priceRange) * chartHeight;
  const volumeY = (volume: number) => padding + chartHeight + 24 + ((maxVolume - volume) / maxVolume) * volumeHeight;

  const handleMouseWheel = (e: WheelEvent) => {
    if (!chartRef.current?.contains(e.target as Node)) return;
    
    e.preventDefault();
    
    if (e.shiftKey || e.ctrlKey) {
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      const midPrice = (priceMin + priceMax) / 2;
      const halfRange = (priceMax - priceMin) / 2;
      const newHalfRange = halfRange * zoomFactor;
      
      const newMin = Math.max(0, midPrice - newHalfRange);
      const newMax = Math.min(10000, midPrice + newHalfRange);
      
      setPriceMin(newMin);
      setPriceMax(newMax);
    } else {
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      const newCount = Math.round(visibleCount * zoomFactor);
      setVisibleCount(Math.max(3, Math.min(prices.length, newCount)));
      setScrollOffset(0);
    }
  };

  React.useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    
    chart.addEventListener('wheel', handleMouseWheel, { passive: false });
    return () => chart.removeEventListener('wheel', handleMouseWheel);
  }, [visibleCount, priceMin, priceMax, prices.length]);

  return (
    <div style={{ padding: '1rem', border: '1px solid #d1d5db', borderRadius: 12, margin: '1rem', background: '#ffffff' }} ref={chartRef}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Gold Price Candlestick Chart</h2>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {(['1m', '15m'] as Timeframe[]).map((option) => (
            <button
              key={option}
              onClick={() => setTimeframe(option)}
              style={{
                border: '1px solid #d1d5db',
                borderRadius: 8,
                padding: '8px 14px',
                background: timeframe === option ? '#111827' : '#ffffff',
                color: timeframe === option ? '#ffffff' : '#374151',
                cursor: 'pointer',
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 16, padding: '0 1rem' }}>
        <label style={{ fontWeight: 600, color: '#374151', minWidth: 60 }}>Zoom:</label>
        <input
          type="range"
          min="5"
          max={prices.length}
          value={visibleCount}
          onChange={(e) => {
            setVisibleCount(Number(e.target.value));
            setScrollOffset(0);
          }}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            background: '#e5e7eb',
            outline: 'none',
            WebkitAppearance: 'none',
          }}
        />
        <span style={{ color: '#6b7280', fontSize: 12, minWidth: 40 }}>{visibleCount} candles</span>
      </div>
      
      {visibleCount < prices.length && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 16, padding: '0 1rem' }}>
          <label style={{ fontWeight: 600, color: '#374151', minWidth: 60 }}>Scroll:</label>
          <input
            type="range"
            min="0"
            max={Math.max(0, prices.length - visibleCountClamped)}
            value={scrollOffsetClamped}
            onChange={(e) => setScrollOffset(Number(e.target.value))}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              background: '#e5e7eb',
              outline: 'none',
              WebkitAppearance: 'none',
            }}
          />
        </div>
      )}
      
      <div style={{ color: '#6b7280', fontSize: 12, padding: '0 1rem', marginBottom: 12 }}>
        <strong>Scroll:</strong> Mouse wheel to zoom • Shift+Scroll: Price zoom
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18, color: '#374151', fontSize: 14, padding: '0 1rem' }}>
        <div>
          <strong style={{ color: '#111827' }}>Last close:</strong> ${prices[prices.length - 1].close.toFixed(2)}
        </div>
        <div>
          <strong style={{ color: '#111827' }}>Timeframe:</strong> {timeframe}
        </div>
        <div>
          <strong style={{ color: '#111827' }}>Range:</strong> {visiblePrices[0].date} to {visiblePrices[visiblePrices.length - 1].date}
        </div>
      </div>

      <svg width={width} height={height} style={{ background: '#f8fafc', borderRadius: 12, display: 'block' }}>
        <rect x="0" y="0" width={width} height={height} fill="#f8fafc" rx="12" />

        {Array.from({ length: 5 }).map((_, index) => {
          const y = padding + (chartHeight / 4) * index;
          const priceLabel = (maxPrice - (priceRange / 4) * index).toFixed(2);
          return (
            <g key={index}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke={gridColor} strokeWidth="1" />
              <text x={padding - 12} y={y + 4} textAnchor="end" fontSize="11" fill={axisColor}>
                {priceLabel}
              </text>
            </g>
          );
        })}

        {visiblePrices.map((item, index) => {
          const x = padding + xStep * index;
          const openY = priceY(item.open);
          const closeY = priceY(item.close);
          const highY = priceY(item.high);
          const lowY = priceY(item.low);
          const bodyTop = Math.min(openY, closeY);
          const bodyHeight = Math.max(1, Math.abs(openY - closeY));
          const isUp = item.close >= item.open;
          const color = isUp ? upColor : downColor;

          return (
            <g key={`${item.date}-${index}`}>
              <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
              <rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={color}
                opacity="0.95"
              />
            </g>
          );
        })}

        <rect x={padding} y={padding + chartHeight + 16} width={width - padding * 2} height="2" fill="#d1d5db" opacity="0.9" />

        {visiblePrices.map((item, index) => {
          const x = padding + xStep * index;
          const y = volumeY(item.volume);
          const barHeight = padding + chartHeight + 20 + volumeHeight - y;
          const isUp = item.close >= item.open;
          const color = isUp ? upColor : downColor;
          return (
            <rect
              key={`${item.date}-vol-${index}`}
              x={x - candleWidth / 2}
              y={y}
              width={candleWidth}
              height={barHeight}
              fill={color}
              opacity="0.35"
            />
          );
        })}

        <text x={padding} y={padding + chartHeight + 12} fill={axisColor} fontSize="11">
          Volume
        </text>

        {visiblePrices.map((item, index) => {
          if (index % 4 !== 0) return null;
          const x = padding + xStep * index;
          return (
            <text
              key={`${item.date}-label-${index}`}
              x={x}
              y={height - 12}
              textAnchor="middle"
              fontSize="10"
              fill={axisColor}
            >
              {item.date}
            </text>
          );
        })}

        <text x={width - padding + 8} y={padding + 4} fill={axisColor} fontSize="11" textAnchor="start">
          {maxPrice.toFixed(2)}
        </text>
        <text x={width - padding + 8} y={padding + chartHeight} fill={axisColor} fontSize="11" textAnchor="start">
          {minPrice.toFixed(2)}
        </text>
      </svg>
    </div>
  );
};

export default GoldGraph;
