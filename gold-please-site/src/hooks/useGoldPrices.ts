import { useState, useEffect, useRef } from 'react';
import { fetchGoldPrices, type GoldApiRawPoint } from '../services/goldApi';

export type Timeframe = '1m' | '15m';

export interface GoldPricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const parseTimestamp = (dateString: string) => new Date(dateString.replace(' ', 'T'));

const getBucketKey = (date: Date, timeframe: Timeframe) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = date.getMinutes();

  if (timeframe === '1m') {
    return `${year}-${month}-${day} ${hours}:${pad(minutes)}`;
  }

  const bucketStart = Math.floor(minutes / 15) * 15;
  return `${year}-${month}-${day} ${hours}:${pad(bucketStart)}`;
};

const buildCandle = (point: GoldApiRawPoint): GoldPricePoint => ({
  date: point.date,
  open: point.open,
  high: point.value,
  low: point.value,
  close: point.value,
  volume: point.volume ?? 0,
});

export const useGoldPrices = (timeframe: Timeframe = '1m') => {
  const [prices, setPrices] = useState<GoldPricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const rawTicksRef = useRef<GoldApiRawPoint[]>([]);
  const currentPricesRef = useRef<GoldPricePoint[]>([]);
  const currentBucketRef = useRef<string>('');
  const tickIndexRef = useRef(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const clearTickInterval = () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const pushNextTick = () => {
      const rawTicks = rawTicksRef.current;
      const tickIndex = tickIndexRef.current;
      if (tickIndex >= rawTicks.length) {
        clearTickInterval();
        return;
      }

      const raw = rawTicks[tickIndex];
      const tickDate = parseTimestamp(raw.date);
      const bucketKey = getBucketKey(tickDate, timeframe);
      const previousPrices = currentPricesRef.current;
      const lastCandle = previousPrices[previousPrices.length - 1];

      let nextPrices: GoldPricePoint[];

      if (!lastCandle || currentBucketRef.current !== bucketKey) {
        currentBucketRef.current = bucketKey;
        const candle = buildCandle(raw);
        nextPrices = [...previousPrices.slice(-49), candle];
      } else {
        const updatedCandle: GoldPricePoint = {
          ...lastCandle,
          high: Math.max(lastCandle.high, raw.value),
          low: Math.min(lastCandle.low, raw.value),
          close: raw.value,
          volume: lastCandle.volume + (raw.volume ?? 0),
        };
        nextPrices = [...previousPrices.slice(0, -1), updatedCandle];
      }

      currentPricesRef.current = nextPrices;
      setPrices(nextPrices);
      tickIndexRef.current += 1;
    };

    const loadPrices = async () => {
      setLoading(true);
      clearTickInterval();
      rawTicksRef.current = [];
      currentPricesRef.current = [];
      currentBucketRef.current = '';
      tickIndexRef.current = 0;

      try {
        const apiTicks = await fetchGoldPrices();
        if (!isMounted) return;

        rawTicksRef.current = apiTicks;
        if (apiTicks.length > 0) {
          const initial = buildCandle(apiTicks[0]);
          currentPricesRef.current = [initial];
          currentBucketRef.current = getBucketKey(parseTimestamp(apiTicks[0].date), timeframe);
          setPrices([initial]);
          tickIndexRef.current = 1;
        }

        intervalRef.current = window.setInterval(pushNextTick, 1000);
      } catch (error) {
        console.error('Failed to fetch gold prices:', error);
        if (isMounted) {
          setPrices([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPrices();

    return () => {
      isMounted = false;
      clearTickInterval();
    };
  }, [timeframe]);

  return { prices, loading };
};
