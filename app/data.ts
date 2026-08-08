export type BrandId =
  | "all"
  | "eufy"
  | "arlo"
  | "simplisafe"
  | "ring"
  | "google-nest";

export type ViewId = "daily" | "seven" | "thirty" | "archive";
export type SignalStatus = "新增" | "变化" | "结束" | "持续" | "近30天变化" | "弱信号";

export interface Source {
  label: string;
  url: string;
}

export interface SnapshotItem {
  id: string;
  status: SignalStatus;
  category: string;
  firstObserved: string;
  importance: number;
  title: string;
  summary: string;
  detail: string;
  analysis: string;
  timeframes: ViewId[];
  sources: Source[];
}

export interface BrandSnapshot {
  id: Exclude<BrandId, "all">;
  name: string;
  monogram: string;
  accent: string;
  route: string;
  heroProduct: string;
  heroMessage: string;
  mainOffer: string;
  aiProposition: string;
  subscriptionProposition: string;
  mainChannel: string;
  snapshot: SnapshotItem[];
}

export interface TopSignal {
  rank: number;
  brand: Exclude<BrandId, "all">;
  priority: "high" | "medium-high";
  status: SignalStatus;
  title: string;
  judgment: string;
}

export interface Report {
  schemaVersion: number;
  date: string;
  displayDate: string;
  dayNumber: number;
  market: string;
  edition: string;
  summary: string;
  thesis: { eyebrow: string; title: string; body: string };
  metrics: { value: string; label: string }[];
  topSignals: TopSignal[];
  brands: BrandSnapshot[];
  sevenDay: {
    range: string;
    headline: string;
    summary: string;
    events: {
      date: string;
      brand: Exclude<BrandId, "all">;
      status: SignalStatus;
      title: string;
      note: string;
    }[];
  };
  thirtyDay: {
    range: string;
    headline: string;
    summary: string;
    routes: {
      brand: Exclude<BrandId, "all">;
      label: string;
      detail: string;
    }[];
  };
  methodology: string[];
}

const modules = import.meta.glob<{ default: Report }>(
  "/data/reports/*.json",
  { eager: true },
);

export const reports = Object.values(modules)
  .map((module) => module.default)
  .sort((a, b) => b.date.localeCompare(a.date));

export const brandOrder: BrandId[] = [
  "all",
  "eufy",
  "arlo",
  "simplisafe",
  "ring",
  "google-nest",
];

export const brandLabels: Record<BrandId, string> = {
  all: "全部品牌",
  eufy: "eufy Security",
  arlo: "Arlo",
  simplisafe: "SimpliSafe",
  ring: "Ring",
  "google-nest": "Google Nest",
};

export const brandAccents: Record<Exclude<BrandId, "all">, string> = {
  eufy: "#55d9b3",
  arlo: "#e0cd63",
  simplisafe: "#ff6f57",
  ring: "#56b8ff",
  "google-nest": "#b69cff",
};

export function formatArchiveDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${date}T12:00:00`));
}
