export type BrandId =
  | "all"
  | "eufy"
  | "arlo"
  | "simplisafe"
  | "ring"
  | "google-nest";

export type ViewId = "daily" | "seven" | "thirty" | "archive";
export type SignalStatus = "新增" | "变化" | "结束" | "持续" | "近30天变化" | "弱信号";
export type MarketingEventType = "Campaign" | "PR / 合作" | "渠道事件" | "风险 / 舆情";

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

export interface MarketingEvent {
  id: string;
  brand: Exclude<BrandId, "all">;
  date: string;
  type: MarketingEventType;
  verification: "已确认" | "持续观察";
  evidence: "官方 / 品牌方" | "权威媒体" | "第三方监测" | "社区信号";
  confidence: "高" | "中" | "低";
  impact: "high" | "medium" | "low";
  title: string;
  summary: string;
  whyItMatters: string;
  sources: Source[];
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
  marketingRadar?: {
    headline: string;
    summary: string;
    events: MarketingEvent[];
  };
  brands: BrandSnapshot[];
  sevenDay: {
    range: string;
    headline: string;
    summary: string;
    events: {
      date: string;
      brand: Exclude<BrandId, "all">;
      status: SignalStatus;
      type?: MarketingEventType;
      title: string;
      note: string;
    }[];
  };
  thirtyDay: {
    range: string;
    headline: string;
    summary: string;
    marketingHeadline?: string;
    marketingSummary?: string;
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
  eufy: "#087d67",
  arlo: "#856b00",
  simplisafe: "#bd3f2b",
  ring: "#176eaa",
  "google-nest": "#6852a8",
};

export function formatArchiveDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${date}T12:00:00`));
}
