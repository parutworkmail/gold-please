import rawGoldPrices from '../data/mockGoldPrices.json';

export type GoldApiRawPoint = {
  date: string;
  open: number;
  value: number;
  volume?: number;
};

export const fetchGoldPrices = async (): Promise<GoldApiRawPoint[]> => {
  return rawGoldPrices as GoldApiRawPoint[];
};
