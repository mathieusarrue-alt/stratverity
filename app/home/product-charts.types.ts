import type {
  CandlestickData,
  LineData,
  DeepPartial,
  ChartOptions,
  IChartApi,
  Time,
} from "lightweight-charts";

export type ProductChartPrefs = {
  height: number;
  theme: "auto" | "light" | "dark";
  updatedAt: string;
};

export type CandlesMiniProps = {
  data?: CandlestickData[];
  height?: number;
  className?: string;
  storageKey?: string;
  persistData?: boolean;
};

export type EquityMiniProps = {
  data?: LineData[];
  height?: number;
  className?: string;
  storageKey?: string;
  persistData?: boolean;
};

export type ChartSetupFn = (chart: IChartApi, el: HTMLDivElement) => void;

export type MountProductChartsOptions = {
  root: ParentNode;
  height?: number;
  persistData?: boolean;
};

export type MountProductChartsHandle = {
  unmount: () => void;
};

export type SeriesCache<T> = {
  version: 1;
  updatedAt: string;
  data: T[];
};

export type PartialChartOptions = DeepPartial<ChartOptions>;
export type { CandlestickData, LineData, IChartApi, Time, ChartOptions };