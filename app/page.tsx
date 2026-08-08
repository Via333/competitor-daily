import { useMemo, useState, type CSSProperties } from "react";
import {
  brandAccents,
  brandLabels,
  brandOrder,
  formatArchiveDate,
  reports,
  type BrandId,
  type BrandSnapshot,
  type MarketingEventType,
  type Report,
  type SignalStatus,
  type SnapshotItem,
  type ViewId,
} from "./data";

const views: { id: ViewId; label: string; short: string }[] = [
  { id: "daily", label: "每日快照", short: "今日" },
  { id: "seven", label: "近 7 天回顾", short: "7 天" },
  { id: "thirty", label: "近 30 天趋势", short: "30 天" },
  { id: "archive", label: "历史归档", short: "归档" },
];

const statusOptions: { id: "all" | SignalStatus; label: string }[] = [
  { id: "all", label: "全部状态" },
  { id: "近30天变化", label: "变化" },
  { id: "持续", label: "持续" },
  { id: "弱信号", label: "弱信号" },
];

function brandStyle(id: Exclude<BrandId, "all">) {
  return { "--brand": brandAccents[id] } as CSSProperties;
}

function statusClass(status: SignalStatus) {
  if (status === "弱信号") return "status status--weak";
  if (status === "持续") return "status status--steady";
  if (status === "结束") return "status status--ended";
  return "status status--change";
}

function SectionHeading({
  eyebrow,
  title,
  aside,
  headingId,
}: {
  eyebrow: string;
  title: string;
  aside?: string;
  headingId?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={headingId}>{title}</h2>
      </div>
      {aside && <p className="section-aside">{aside}</p>}
    </div>
  );
}

function SignalCard({ signal, report }: { signal: Report["topSignals"][number]; report: Report }) {
  const brand = report.brands.find((item) => item.id === signal.brand)!;

  return (
    <article className="signal-card" style={brandStyle(signal.brand)}>
      <div className="signal-topline">
        <span className="signal-rank">0{signal.rank}</span>
        <span className={statusClass(signal.status)}>{signal.status}</span>
      </div>
      <div className="signal-brand">
        <span className="brand-dot" />
        {brand.name}
      </div>
      <h3>{signal.title}</h3>
      <p>{signal.judgment}</p>
    </article>
  );
}

function IntelligenceItem({ item }: { item: SnapshotItem }) {
  return (
    <article className="intel-item">
      <div className="intel-meta">
        <span className={statusClass(item.status)}>{item.status}</span>
        <span>{item.category}</span>
        <span className="observed">首次观察 {item.firstObserved}</span>
      </div>
      <h4>{item.title}</h4>
      <p className="intel-summary">{item.summary}</p>
      <details>
        <summary>查看研判与证据</summary>
        <div className="intel-detail">
          <p>{item.detail}</p>
          <div className="analyst-note">
            <span>ANALYST NOTE</span>
            <p>{item.analysis}</p>
          </div>
          {item.sources.length > 0 ? (
            <div className="sources" aria-label="信息来源">
              {item.sources.map((source) => (
                <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                  {source.label} <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="source-note">社区弱信号 · 等待更多一手证据</p>
          )}
        </div>
      </details>
    </article>
  );
}

function BrandCard({
  brand,
  status,
  timeframe,
}: {
  brand: BrandSnapshot;
  status: "all" | SignalStatus;
  timeframe: ViewId;
}) {
  const visibleItems = brand.snapshot.filter(
    (item) =>
      item.timeframes.includes(timeframe) && (status === "all" || item.status === status),
  );

  if (visibleItems.length === 0) return null;

  const matrix = [
    ["Hero product", brand.heroProduct],
    ["Hero message", brand.heroMessage],
    ["Main offer", brand.mainOffer],
    ["AI proposition", brand.aiProposition],
    ["Subscription", brand.subscriptionProposition],
    ["Main channel", brand.mainChannel],
  ];

  return (
    <section className="brand-card" style={brandStyle(brand.id)} id={brand.id}>
      <header className="brand-card__header">
        <div className="brand-identity">
          <span className="brand-monogram" aria-hidden="true">{brand.monogram}</span>
          <div>
            <p className="brand-kicker">CURRENT ROUTE</p>
            <h3>{brand.name}</h3>
          </div>
        </div>
        <p className="brand-route">{brand.route}</p>
      </header>

      <div className="strategy-matrix" aria-label={`${brand.name} 当前战略快照`}>
        {matrix.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <p>{value}</p>
          </div>
        ))}
      </div>

      <div className="intel-list">
        {visibleItems.map((item) => (
          <IntelligenceItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function MarketingRadar({ report, brand }: { report: Report; brand: BrandId }) {
  const [category, setCategory] = useState<"all" | MarketingEventType>("all");
  const [showAll, setShowAll] = useState(false);
  const radar = report.marketingRadar;

  if (!radar) return null;

  const categories: { id: "all" | MarketingEventType; label: string }[] = [
    { id: "all", label: "全部事件" },
    { id: "Campaign", label: "Campaign" },
    { id: "PR / 合作", label: "PR / 合作" },
    { id: "渠道事件", label: "渠道事件" },
    { id: "风险 / 舆情", label: "风险 / 舆情" },
  ];
  const brandEvents = radar.events.filter((event) => brand === "all" || event.brand === brand);
  const events = brandEvents
    .filter((event) => category === "all" || event.type === category)
    .sort((a, b) => b.date.localeCompare(a.date));
  const visibleEvents = showAll ? events : events.slice(0, 8);
  const confirmed = brandEvents.filter((event) => event.verification === "已确认").length;
  const watching = brandEvents.filter((event) => event.verification === "持续观察").length;
  const highImpact = brandEvents.filter((event) => event.impact === "high").length;

  return (
    <section className="content-section marketing-radar" aria-labelledby="marketing-heading">
      <SectionHeading
        eyebrow="02 / MARKETING & REPUTATION"
        title="营销与声誉雷达"
        aside="大型 Campaign、PR、渠道事件与负面舆情单独跟踪"
        headingId="marketing-heading"
      />

      <div className="marketing-summary">
        <div>
          <p className="eyebrow">WHAT MOVED THE MARKET</p>
          <h3>{radar.headline}</h3>
          <p>{radar.summary}</p>
        </div>
        <dl>
          <div><dt>高影响事件</dt><dd>{highImpact}</dd></div>
          <div><dt>已确认</dt><dd>{confirmed}</dd></div>
          <div><dt>持续观察</dt><dd>{watching}</dd></div>
        </dl>
      </div>

      <div className="event-tabs" aria-label="营销事件类型">
        {categories.map((item) => (
          <button
            type="button"
            key={item.id}
            className={category === item.id ? "event-tab event-tab--active" : "event-tab"}
            aria-pressed={category === item.id}
            onClick={() => setCategory(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {events.length > 0 ? (
        <div className="event-grid">
          {visibleEvents.map((event) => (
            <article
              key={event.id}
              className={event.type === "风险 / 舆情" ? "event-card event-card--risk" : "event-card"}
              style={brandStyle(event.brand)}
            >
              <div className="event-card__topline">
                <span>{event.date}</span>
                <span className={event.verification === "已确认" ? "verification verification--confirmed" : "verification verification--watch"}>
                  {event.verification}
                </span>
              </div>
              <div className="event-card__identity">
                <span className="brand-dot" />
                <strong>{brandLabels[event.brand]}</strong>
                <span>{event.type}</span>
              </div>
              <h3>{event.title}</h3>
              <p>{event.summary}</p>
              <div className="event-impact">
                <span>WHY IT MATTERS</span>
                <p>{event.whyItMatters}</p>
              </div>
              <div className="event-card__footer">
                <span>{event.evidence} · 置信度 {event.confidence}</span>
                <div className="sources">
                  {event.sources.map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                      {source.label} <span aria-hidden="true">↗</span>
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState label="当前筛选下没有可确认的营销或声誉事件。" />
      )}
      {events.length > 8 && (
        <button type="button" className="event-more" onClick={() => setShowAll((value) => !value)}>
          {showAll ? "收起事件" : `查看全部 ${events.length} 条事件`}
        </button>
      )}
    </section>
  );
}

function DailyView({
  report,
  brand,
  status,
}: {
  report: Report;
  brand: BrandId;
  status: "all" | SignalStatus;
}) {
  const signals = report.topSignals.filter((signal) => brand === "all" || signal.brand === brand);
  const brands = report.brands.filter((item) => brand === "all" || item.id === brand);

  return (
    <>
      <section className="content-section" aria-labelledby="signals-heading">
        <SectionHeading
          eyebrow="01 / SIGNALS"
          title="今天最值得关注的 5 个信号"
          aside="按战略重要性排序，不以新闻数量凑版面"
          headingId="signals-heading"
        />
        <div className="signal-grid">
          {signals.map((signal) => (
            <SignalCard key={`${signal.brand}-${signal.rank}`} signal={signal} report={report} />
          ))}
        </div>
      </section>

      <MarketingRadar report={report} brand={brand} />

      <section className="content-section" aria-labelledby="snapshot-heading">
        <SectionHeading
          eyebrow="03 / LIVE SNAPSHOT"
          title="当前重要动态快照"
          aside="持续中的核心动作也会保留，避免错过上一期后信息断层"
          headingId="snapshot-heading"
        />
        <div className="brand-stack">
          {brands.map((item) => (
            <BrandCard key={item.id} brand={item} status={status} timeframe="daily" />
          ))}
        </div>
      </section>
    </>
  );
}

function SevenDayView({ report, brand }: { report: Report; brand: BrandId }) {
  const events = report.sevenDay.events.filter((event) => brand === "all" || event.brand === brand);

  return (
    <section className="content-section range-view">
      <SectionHeading eyebrow="7-DAY LOOKBACK" title="近 7 天关键变化时间线" aside={report.sevenDay.range} />
      <div className="range-hero">
        <span className="range-index">07</span>
        <div>
          <h3>{report.sevenDay.headline}</h3>
          <p>{report.sevenDay.summary}</p>
        </div>
      </div>
      {events.length > 0 ? (
        <div className="timeline">
          {events.map((event) => (
            <article key={`${event.brand}-${event.title}`} className="timeline-event" style={brandStyle(event.brand)}>
              <div className="timeline-marker" />
              <div className="timeline-date">{event.date}</div>
              <div className="timeline-copy">
                <div>
                  <span className="timeline-brand">{brandLabels[event.brand]}</span>
                  {event.type && <span className="timeline-type">{event.type}</span>}
                  <span className={statusClass(event.status)}>{event.status}</span>
                </div>
                <h3>{event.title}</h3>
                <p>{event.note}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState label="这个品牌在近 7 天没有可确认的重要变化。" />
      )}
    </section>
  );
}

function ThirtyDayView({
  report,
  brand,
  status,
}: {
  report: Report;
  brand: BrandId;
  status: "all" | SignalStatus;
}) {
  const routes = report.thirtyDay.routes.filter((route) => brand === "all" || route.brand === brand);
  const brands = report.brands.filter((item) => brand === "all" || item.id === brand);

  return (
    <>
      <section className="content-section range-view">
        <SectionHeading eyebrow="30-DAY TREND" title="竞品战略迁移雷达" aside={report.thirtyDay.range} />
        <div className="range-hero range-hero--trend">
          <span className="range-index">30</span>
          <div>
            <h3>{report.thirtyDay.headline}</h3>
            <p>{report.thirtyDay.summary}</p>
          </div>
        </div>
        {report.thirtyDay.marketingHeadline && report.thirtyDay.marketingSummary && (
          <aside className="trend-callout" aria-label="近 30 天营销与声誉趋势">
            <span>MARKETING / REPUTATION</span>
            <div>
              <h3>{report.thirtyDay.marketingHeadline}</h3>
              <p>{report.thirtyDay.marketingSummary}</p>
            </div>
          </aside>
        )}
        <div className="route-map">
          {routes.map((route, index) => (
            <article key={route.brand} style={brandStyle(route.brand)}>
              <span className="route-number">0{index + 1}</span>
              <div className="route-line"><span /></div>
              <p>{brandLabels[route.brand]}</p>
              <h3>{route.label}</h3>
              <small>{route.detail}</small>
            </article>
          ))}
        </div>
      </section>
      <section className="content-section">
        <SectionHeading eyebrow="EVIDENCE" title="支撑趋势的当前动作" />
        <div className="brand-stack">
          {brands.map((item) => (
            <BrandCard key={item.id} brand={item} status={status} timeframe="thirty" />
          ))}
        </div>
      </section>
    </>
  );
}

function ArchiveView({
  selectedDate,
  onSelect,
}: {
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  return (
    <section className="content-section archive-view">
      <SectionHeading
        eyebrow="PERMANENT ARCHIVE"
        title="历史报告永久归档"
        aside="每个日期文件都是一份可独立回看的完整快照"
      />
      <div className="archive-layout">
        <div className="archive-intro">
          <p className="archive-count"><span>{String(reports.length).padStart(2, "0")}</span> 份报告</p>
          <h3>历史不会被日报覆盖。</h3>
          <p>未来新增的每日 JSON 数据会自动进入这里。你可以按日期回看当时的重点、品牌快照、7 天回顾与 30 天判断。</p>
        </div>
        <div className="archive-list">
          {reports.map((report) => (
            <button
              type="button"
              key={report.date}
              className={selectedDate === report.date ? "archive-row archive-row--active" : "archive-row"}
              onClick={() => onSelect(report.date)}
            >
              <span className="archive-date">{formatArchiveDate(report.date)}</span>
              <span className="archive-title">
                <strong>{report.edition}</strong>
                <small>{report.thesis.title}</small>
              </span>
              <span className="archive-arrow" aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <span>NO VERIFIED SIGNAL</span>
      <p>{label}</p>
    </div>
  );
}

function Methodology({ report }: { report: Report }) {
  return (
    <section className="methodology">
      <div>
        <p className="eyebrow">MONITORING RULES</p>
        <h2>让“没有变化”也成为可信结果。</h2>
      </div>
      <ol>
        {report.methodology.map((item, index) => (
          <li key={item}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{item}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function Home() {
  const [view, setView] = useState<ViewId>("daily");
  const [brand, setBrand] = useState<BrandId>("all");
  const [status, setStatus] = useState<"all" | SignalStatus>("all");
  const [selectedDate, setSelectedDate] = useState(reports[0]?.date ?? "");

  const report = useMemo(
    () => reports.find((item) => item.date === selectedDate) ?? reports[0],
    [selectedDate],
  );

  if (!report) return <EmptyState label="暂时还没有报告数据。" />;

  function selectArchive(date: string) {
    setSelectedDate(date);
    setView("daily");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="返回页面顶部">
          <span className="radar-mark"><i /><i /><i /></span>
          <span>SECURITY / RADAR</span>
        </a>
        <div className="topbar-meta">
          <span className="live-indicator"><i /> MONITORING</span>
          <span>US MARKET</span>
          <span>{report.date}</span>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-gridline" aria-hidden="true" />
          <div className="hero-copy">
            <p className="hero-eyebrow">UNITED STATES · HOME SECURITY INTELLIGENCE</p>
            <h1>美国安防<br /><em>竞品雷达</em></h1>
            <p className="hero-deck">eufy Security、Arlo、SimpliSafe、Ring 与 Google Nest 的产品、AI、订阅、渠道、Campaign 与声誉风险，放在同一张战略地图上。</p>
            <div className="hero-edition">
              <span>{report.edition}</span>
              <p>{report.displayDate} · {report.market}市场</p>
            </div>
          </div>

          <aside className="thesis-card">
            <div className="thesis-topline">
              <span>{report.thesis.eyebrow}</span>
              <span>↘</span>
            </div>
            <h2>{report.thesis.title}</h2>
            <p>{report.thesis.body}</p>
            <div className="metric-grid">
              {report.metrics.map((metric) => (
                <div key={metric.label}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="baseline-note">
          <span>BASELINE NOTE</span>
          <p>{report.summary}</p>
        </section>

        <nav className="view-nav" aria-label="报告时间范围">
          {views.map((item) => (
            <button
              type="button"
              key={item.id}
              className={view === item.id ? "view-tab view-tab--active" : "view-tab"}
              aria-pressed={view === item.id}
              onClick={() => setView(item.id)}
            >
              <span className="view-long">{item.label}</span>
              <span className="view-short">{item.short}</span>
            </button>
          ))}
          <label className="date-select">
            <span>报告日期</span>
            <select value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}>
              {reports.map((item) => (
                <option key={item.date} value={item.date}>{item.date} · {item.edition}</option>
              ))}
            </select>
          </label>
        </nav>

        <section className="filters" aria-label="报告筛选">
          <div className="filter-group">
            <span className="filter-label">BRAND</span>
            <div className="filter-scroll">
              {brandOrder.map((id) => (
                <button
                  type="button"
                  key={id}
                  className={brand === id ? "filter-chip filter-chip--active" : "filter-chip"}
                  aria-pressed={brand === id}
                  onClick={() => setBrand(id)}
                >
                  {id !== "all" && <i style={{ background: brandAccents[id] }} />}
                  {brandLabels[id]}
                </button>
              ))}
            </div>
          </div>
          {(view === "daily" || view === "thirty") && (
            <div className="filter-group filter-group--status">
              <span className="filter-label">STATUS</span>
              <div className="filter-scroll">
                {statusOptions.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={status === item.id ? "filter-chip filter-chip--active" : "filter-chip"}
                    aria-pressed={status === item.id}
                    onClick={() => setStatus(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {view === "daily" && <DailyView report={report} brand={brand} status={status} />}
        {view === "seven" && <SevenDayView report={report} brand={brand} />}
        {view === "thirty" && <ThirtyDayView report={report} brand={brand} status={status} />}
        {view === "archive" && <ArchiveView selectedDate={selectedDate} onSelect={selectArchive} />}

        <Methodology report={report} />
      </main>

      <footer>
        <div className="wordmark wordmark--footer">
          <span className="radar-mark"><i /><i /><i /></span>
          <span>SECURITY / RADAR</span>
        </div>
        <p>数据以公开来源为基础 · 分析判断均与事实证据分开标记</p>
        <a href="#top">BACK TO TOP ↑</a>
      </footer>
    </div>
  );
}
