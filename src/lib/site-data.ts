/**
 * Centralized site content for the Volatility Vince landing page.
 */

export const site = {
  brand: "Volatility Vince",
  brandShort: "VINCE",
  parentOrg: "Krupp Capital",
  parentSuite: "Krupp Capital Trading Suite",
  moduleNumber: "03",
  tagline: "Institutional Quant Intelligence. In Your Telegram.",
  subtitle:
    "A hedgefund-grade quant research desk — Greeks, GEX, vol surfaces, regime detection and 100+ research commands — delivered as a Telegram chatbot. Sold individually or as part of the Krupp Capital Trading Suite.",
  modulePath:
    "MODULE 03 - VOLATILITY VINCE",
  status: "Production-Ready",
  language: "Python",
  api: "Telegram Bot API",
  contactEmail: "maxkrupp@gmail.com",
  contactHandle: "@kruppcapital",
};

export const stats = [
  { value: "18", label: "Analysis submodules", sub: "~8,000 LOC" },
  { value: "100+", label: "Telegram commands", sub: "slash + NL" },
  { value: "50+", label: "Technical indicators", sub: "per symbol" },
  { value: "<2s", label: "Per-symbol analysis", sub: "end-to-end" },
  { value: "100K+", label: "Strikes per market", sub: "real-time GEX" },
  { value: "1M", label: "Monte Carlo paths", sub: "VKKM Aegis" },
];

export const tickerSymbols = [
  { sym: "SPX", px: "5,847.12", chg: "+0.42%", up: true, gex: "+1.84B" },
  { sym: "NDX", px: "20,394.55", chg: "+0.71%", up: true, gex: "+2.11B" },
  { sym: "RUT", px: "2,341.08", chg: "-0.18%", up: false, gex: "-312M" },
  { sym: "VIX", px: "14.27", chg: "-2.31%", up: false, gex: "—" },
  { sym: "AAPL", px: "229.87", chg: "+1.04%", up: true, gex: "+184M" },
  { sym: "NVDA", px: "138.41", chg: "+2.18%", up: true, gex: "+921M" },
  { sym: "TSLA", px: "412.05", chg: "-0.92%", up: false, gex: "-267M" },
  { sym: "META", px: "591.33", chg: "+0.66%", up: true, gex: "+98M" },
  { sym: "SPY", px: "584.51", chg: "+0.41%", up: true, gex: "+1.42B" },
  { sym: "QQQ", px: "503.18", chg: "+0.69%", up: true, gex: "+1.07B" },
  { sym: "GLD", px: "246.70", chg: "+0.22%", up: true, gex: "+12M" },
  { sym: "TLT", px: "94.18", chg: "-0.34%", up: false, gex: "-44M" },
];

export type Feature = {
  id: string;
  category: "Greeks" | "Exposure" | "Vol Surface" | "Strategies" | "Risk" | "Technical" | "Regime" | "Earnings" | "Flow" | "Futures" | "ML" | "Portfolio" | "Deep Learning" | "Valuation" | "Forecasting" | "Vision";
  title: string;
  description: string;
  bullets: string[];
  accent: "emerald" | "amber" | "rose" | "cyan" | "violet";
};

export const features: Feature[] = [
  {
    id: "greeks",
    category: "Greeks",
    title: "Greeks & Pricing Engine",
    description:
      "Black-Scholes pricing with a full 12-Greek suite and iterative IV solvers for any listed option.",
    bullets: [
      "Black-Scholes-Merton core pricer",
      "12 Greeks: Delta, Gamma, Vega, Theta, Rho, Vanna, Charm, Vomma, Speed, Color, Zomma, Ultima",
      "Brent & Newton-Raphson implied volatility solvers",
      "American / European exercise handling",
    ],
    accent: "emerald",
  },
  {
    id: "exposure",
    category: "Exposure",
    title: "GEX / DEX / VEX Exposure",
    description:
      "Institutional dealer-positioning analytics — the same framework Tier-1 desks use to find gamma flips and pin levels.",
    bullets: [
      "Gamma Exposure (GEX) per strike & aggregate",
      "Delta Exposure (DEX) and Vanna Exposure (VEX)",
      "Gamma Flip / Zero Gamma level",
      "Max Pain, Dealer Positioning profile",
    ],
    accent: "amber",
  },
  {
    id: "volsurface",
    category: "Vol Surface",
    title: "Volatility Surface Models",
    description:
      "Stochastic and parametric vol surface models, term structure, skew and 5 RV estimators.",
    bullets: [
      "SABR & SSVI / SVI calibration",
      "Heston & Dupire local volatility",
      "Term structure & skew analytics",
      "5 RV estimators: Parkinson, Garman-Klass, Rogers-Satchell, Yang-Zhang, close-to-close",
    ],
    accent: "cyan",
  },
  {
    id: "strategies",
    category: "Strategies",
    title: "15+ Options Strategies",
    description:
      "Strategy builder with full PnL profiles, breakevens and Greeks evolution across the price/time grid.",
    bullets: [
      "Spreads, Iron Condor, Butterfly, Jade Lizard, Wheel",
      "PnL at expiry & intraday payoff diagrams",
      "Breakeven, max profit / max loss",
      "Greek evolution across spot and time",
    ],
    accent: "emerald",
  },
  {
    id: "risk",
    category: "Risk",
    title: "Risk Management & VaR",
    description:
      "VKKM Aegis Risk Engine — Monte Carlo VaR with 1M paths, CVaR, stress testing and Kelly position sizing.",
    bullets: [
      "VaR: Historical, Parametric, Monte Carlo (1M paths)",
      "Conditional VaR (CVaR / Expected Shortfall)",
      "Altman Z-Score credit risk, liquidity risk",
      "Kelly & fractional-Kelly position sizing",
    ],
    accent: "rose",
  },
  {
    id: "technical",
    category: "Technical",
    title: "50+ Technical Indicators",
    description:
      "A full institutional indicator library covering trend, momentum, volatility, volume and pattern recognition.",
    bullets: [
      "Trend: EMA stacks, Supertrend, Ichimoku, Keltner",
      "Momentum: RSI, MACD, Stochastic, ROC",
      "Volatility: ATR, Bollinger, Donchian, historical vol",
      "Volume: OBV, VWAP, MFI, accumulation/distribution",
    ],
    accent: "cyan",
  },
  {
    id: "regime",
    category: "Regime",
    title: "Market Regime Detection",
    description:
      "Probabilistic regime classification using HMM and GMM models across vol, trend, correlation and macro dimensions.",
    bullets: [
      "Hidden Markov Models (HMM)",
      "Gaussian Mixture Models (GMM)",
      "Vol / Trend / Correlation / Macro regimes",
      "Transition probability matrices",
    ],
    accent: "violet",
  },
  {
    id: "earnings",
    category: "Earnings",
    title: "Earnings Analysis",
    description:
      "Pre- and post-earnings analytics including expected move, IV crush forecast and PEAD signals.",
    bullets: [
      "Expected Move (straddle-implied)",
      "IV Crush forecast & post-earnings drift (PEAD)",
      "Earnings Quality Score",
      "Historical earnings reactions",
    ],
    accent: "amber",
  },
  {
    id: "flow",
    category: "Flow",
    title: "Order Flow Analysis",
    description:
      "Detect sweeps, dark pool prints and smart-money positioning with gamma-weighted flow.",
    bullets: [
      "Sweep detection & multi-exchange tape",
      "Dark pool prints",
      "Smart-money / unusual-activity flags",
      "Gamma-weighted flow overlay",
    ],
    accent: "rose",
  },
  {
    id: "futures",
    category: "Futures",
    title: "Futures & VIX Analytics",
    description:
      "Term structure, Commitment of Traders, basis and VIX futures — everything for index and futures traders.",
    bullets: [
      "Futures term structure & roll yield",
      "COT (Commitment of Traders) analysis",
      "Basis & calendar spreads",
      "VIX futures curve & contango/backwardation",
    ],
    accent: "cyan",
  },
  {
    id: "ml",
    category: "ML",
    title: "Machine Learning Models",
    description:
      "Production ML pipelines for probability-of-default prediction and alpha factor research.",
    bullets: [
      "Logistic Regression PD (Probability of Default)",
      "Alpha Factor testing & IC analysis",
      "Feature importance & cross-validation",
      "Walk-forward model evaluation",
    ],
    accent: "violet",
  },
  {
    id: "portfolio",
    category: "Portfolio",
    title: "Portfolio Optimization",
    description:
      "QuantStats, PyPortfolioOpt, efficient frontier, Black-Litterman and Hierarchical Risk Parity.",
    bullets: [
      "Efficient Frontier (Markowitz)",
      "Black-Litterman blending",
      "Hierarchical Risk Parity (HRP)",
      "QuantStats tear sheets & PyPortfolioOpt",
    ],
    accent: "emerald",
  },
  {
    id: "deeplearning",
    category: "Deep Learning",
    title: "FINN Deep Learning Pricing",
    description:
      "Neural-network option pricing, SABR calibration and basket Monte Carlo for structured products.",
    bullets: [
      "FINN neural pricing engine",
      "SABR neural calibration",
      "Basket Monte Carlo for multi-asset",
      "GPU-accelerated inference",
    ],
    accent: "violet",
  },
  {
    id: "valuation",
    category: "Valuation",
    title: "Valuation & Relative Value",
    description:
      "DCF, WACC, relative-value and correlation analytics for fundamental cross-checks.",
    bullets: [
      "Discounted Cash Flow (DCF) models",
      "WACC & capital structure",
      "Relative value & peer comps",
      "Correlation & cointegration analysis",
    ],
    accent: "amber",
  },
  {
    id: "forecasting",
    category: "Forecasting",
    title: "TimesFM 2.5 Forecasting",
    description:
      "Google's TimesFM 2.5 zero-shot time series model with 16K context and continuous quantile outputs.",
    bullets: [
      "Zero-shot time series forecasting",
      "16K token context window",
      "Continuous quantile predictions",
      "Volatility & price path forecasts",
    ],
    accent: "violet",
  },
  {
    id: "vision",
    category: "Vision",
    title: "ColQwen2 Document Retrieval",
    description:
      "Vision-language model retrieval for PDF and image extraction — no OCR pipeline required.",
    bullets: [
      "ColQwen2 vision-language retrieval",
      "PDF & image extraction without OCR",
      "Question answering over filings",
      "Semantic page-level search",
    ],
    accent: "cyan",
  },
];

export type CommandGroup = {
  group: string;
  description: string;
  commands: { cmd: string; desc: string }[];
};

export const commandGroups: CommandGroup[] = [
  {
    group: "Core",
    description: "Navigation & onboarding",
    commands: [
      { cmd: "/start", desc: "Initialize Volatility Vince" },
      { cmd: "/help", desc: "Full command reference" },
      { cmd: "/menu", desc: "Interactive command menu" },
      { cmd: "/status", desc: "Engine & data source status" },
      { cmd: "/profile", desc: "Your subscription & usage" },
    ],
  },
  {
    group: "Market",
    description: "Quotes, charts & levels",
    commands: [
      { cmd: "/quote", desc: "Real-time quote with Greeks" },
      { cmd: "/chart", desc: "Plotly chart with indicators" },
      { cmd: "/levels", desc: "Key support / resistance" },
      { cmd: "/trend", desc: "Multi-timeframe trend" },
      { cmd: "/momentum", desc: "Momentum & RSI regime" },
    ],
  },
  {
    group: "Options",
    description: "Greeks, IV & exposure",
    commands: [
      { cmd: "/chain", desc: "Full option chain w/ Greeks" },
      { cmd: "/iv", desc: "Implied volatility & rank" },
      { cmd: "/iv_rank", desc: "52-week IV rank & percentile" },
      { cmd: "/surface", desc: "3D volatility surface" },
      { cmd: "/gex", desc: "GEX / DEX / VEX profile" },
      { cmd: "/oi", desc: "Open interest by strike" },
    ],
  },
  {
    group: "Futures",
    description: "Term structure & COT",
    commands: [
      { cmd: "/futures_dashboard", desc: "Full futures curve" },
      { cmd: "/futures_levels", desc: "Key futures levels" },
      { cmd: "/futures_orb", desc: "Opening range breakout" },
    ],
  },
  {
    group: "Setups",
    description: "Actionable trade ideas",
    commands: [
      { cmd: "/setup_best", desc: "Top ranked setups today" },
      { cmd: "/setup_options", desc: "Options setups by regime" },
      { cmd: "/setup_futures", desc: "Futures setups" },
    ],
  },
  {
    group: "Reports",
    description: "Board-ready PDF exports",
    commands: [
      { cmd: "/report_premarket_us", desc: "US pre-market brief" },
      { cmd: "/report_week_review", desc: "Weekly review" },
      { cmd: "/report_volatility_regime", desc: "Vol regime report" },
    ],
  },
  {
    group: "Scans",
    description: "Unusual activity & alerts",
    commands: [
      { cmd: "/scan_options", desc: "Unusual options flow" },
      { cmd: "/scan_0dte", desc: "0DTE candidates" },
      { cmd: "/alert_iv", desc: "IV threshold alert" },
      { cmd: "/alert_price", desc: "Price alert" },
    ],
  },
  {
    group: "Risk",
    description: "Position sizing & plans",
    commands: [
      { cmd: "/risk", desc: "Portfolio VaR & CVaR" },
      { cmd: "/rr", desc: "Risk/reward calculator" },
      { cmd: "/position_size", desc: "Kelly-aware sizing" },
      { cmd: "/trade_plan", desc: "Full trade plan builder" },
    ],
  },
];

export type PricingTier = {
  name: string;
  tagline: string;
  priceMonthly: number;
  priceAnnual: number;
  pricePerpetual: number | null;
  highlight: boolean;
  badge?: string;
  features: string[];
  cta: string;
};

export const pricingTiers: PricingTier[] = [
  {
    name: "Standalone · Vince Solo",
    tagline: "Just the chatbot. Bring your own stack.",
    priceMonthly: 49,
    priceAnnual: 470,
    pricePerpetual: null,
    highlight: false,
    badge: "Most flexible",
    features: [
      "Volatility Vince Telegram bot",
      "100+ research commands",
      "GEX / DEX / VEX exposure",
      "Black-Scholes & 12 Greeks",
      "50+ technical indicators",
      "PDF / Excel / JSON export",
      "Community support",
    ],
    cta: "Get Vince Solo",
  },
  {
    name: "Pro Trader",
    tagline: "For active retail quants & small desks.",
    priceMonthly: 149,
    priceAnnual: 1430,
    pricePerpetual: 1490,
    highlight: true,
    badge: "Most popular",
    features: [
      "Everything in Vince Solo",
      "SABR / SVI / Heston vol surfaces",
      "Monte Carlo VaR (1M paths)",
      "HMM / GMM regime detection",
      "15+ options strategy builder",
      "TimesFM 2.5 forecasting",
      "Priority Telegram support",
      "Custom alert rules",
    ],
    cta: "Start Pro Trader",
  },
  {
    name: "Desk / Prop Firm",
    tagline: "Multi-seat, white-label, on-prem.",
    priceMonthly: 499,
    priceAnnual: 4790,
    pricePerpetual: 4990,
    highlight: false,
    badge: "Institutional",
    features: [
      "Everything in Pro Trader",
      "Up to 10 trader seats",
      "VKKM Aegis risk engine",
      "FINN deep-learning pricing",
      "ColQwen2 document retrieval",
      "White-label branding",
      "On-premise deployment",
      "SLA & dedicated engineer",
    ],
    cta: "Talk to Sales",
  },
  {
    name: "Full Suite License",
    tagline: "All 5 Krupp Capital modules.",
    priceMonthly: 999,
    priceAnnual: 9590,
    pricePerpetual: null,
    highlight: false,
    badge: "Bundle",
    features: [
      "Volatility Vince (Module 03)",
      "Project Aura — IBKR platform",
      "IMVM Pro — TradingView suite",
      "Tax Commander — IBKR tax auto",
      "Risk Engine — portfolio risk",
      "Shared data & config layer",
      "Single invoice, unified support",
    ],
    cta: "Get the Full Suite",
  },
];

export type SuiteModule = {
  number: string;
  name: string;
  tagline: string;
  language: string;
  status: string;
  features: string[];
  accent: "emerald" | "amber" | "rose" | "cyan" | "violet";
};

export const suiteModules: SuiteModule[] = [
  {
    number: "01",
    name: "Project Aura",
    tagline: "IBKR Live Market Data Analysis & Quant Trading Platform",
    language: "Python",
    status: "Production-Ready",
    features: [
      "Live order book & execution analysis",
      "AI market regime detection",
      "Real-time Greeks, VaR, Drawdown",
      "Low-latency signal generation",
      "Multi-account portfolio aggregation",
    ],
    accent: "cyan",
  },
  {
    number: "02",
    name: "IMVM Pro",
    tagline: "Full Quantitative TradingView Indicator Tool Suite",
    language: "Pine Script",
    status: "Production-Ready",
    features: [
      "Volatility regime classification",
      "GEX/DEX institutional level tracking",
      "Multi-timeframe aggregation",
      "Real-time alerts & notifications",
      "Backtesting framework integration",
    ],
    accent: "amber",
  },
  {
    number: "03",
    name: "Volatility Vince",
    tagline: "Institutional Trading Intelligence Telegram Bot",
    language: "Python",
    status: "Production-Ready",
    features: [
      "18 analysis submodules (~8,000 LOC)",
      "100+ Telegram commands",
      "GEX / DEX / VEX / Greeks / Vol surface",
      "Monte Carlo VaR & regime detection",
      "PDF / Excel / JSON board-ready reports",
    ],
    accent: "emerald",
  },
  {
    number: "04",
    name: "Tax Commander",
    tagline: "IBKR Tax Automation for Private & GmbH Traders",
    language: "Python",
    status: "Production-Ready",
    features: [
      "IBKR statement parsing (CSV/PDF)",
      "German §20 & §23 EStG compliance",
      "Wash sale detection (30-day rule)",
      "Tax-loss harvesting optimizer",
      "FIFO cost basis + PDF Steuererklärung",
    ],
    accent: "rose",
  },
  {
    number: "05",
    name: "Risk Engine",
    tagline: "Advanced Portfolio Risk Management & Backtesting",
    language: "Python",
    status: "Coming Soon",
    features: [
      "Monte Carlo VaR & stress testing",
      "Scenario analysis & sensitivity",
      "Portfolio optimization & rebalancing",
      "Walk-forward backtesting",
      "Factor risk decomposition",
    ],
    accent: "violet",
  },
];

export const architectureLayers = [
  {
    layer: "Interface",
    name: "Telegram + In-App Chat",
    description:
      "Natural-language messages and 100+ slash commands. Also embedded inside Module 01 (Project Aura).",
    tech: ["Telegram Bot API", "MarkdownV2", "Inline keyboards", "Webhooks"],
  },
  {
    layer: "Analysis",
    name: "18 Quant Submodules",
    description:
      "~8,000 lines of institutional analytics — Greeks, exposure, vol surface, strategies, risk, regime, flow, futures, ML.",
    tech: ["NumPy / SciPy", "QuantLib", "scikit-learn", "PyTorch"],
  },
  {
    layer: "Data",
    name: "Multi-Source Data Layer",
    description:
      "Aggregated feeds from yfinance, Alpha Vantage, CBOE, the VKKM Aegis live engine and TradingView webhooks.",
    tech: ["yfinance", "Alpha Vantage", "CBOE", "Aegis Live", "TradingView"],
  },
  {
    layer: "Models",
    name: "ML & Deep Learning Core",
    description:
      "TimesFM 2.5 zero-shot forecasting, ColQwen2 vision-language retrieval, FINN neural pricing.",
    tech: ["TimesFM 2.5", "ColQwen2", "FINN", "Heston", "SABR"],
  },
  {
    layer: "Output",
    name: "Visualization & Reports",
    description:
      "Dark institutional Krupp Capital design via Plotly. Board-ready PDF, Excel and JSON exports.",
    tech: ["Plotly", "PDF gen", "Excel/JSON", "Branding watermark"],
  },
];

export const performanceMetrics = [
  { label: "Per-symbol analysis", value: "<2s", note: "50+ indicators" },
  { label: "GEX calculation", value: "Real-time", note: "100K+ strikes" },
  { label: "Tax report gen", value: "<5s", note: "10K+ transactions" },
  { label: "Risk dashboard refresh", value: "<1s", note: "1000+ positions" },
  { label: "Test coverage", value: ">80%", note: "Pytest" },
  { label: "Lines of code", value: "~50,000", note: "across suite" },
];

export const faqs = [
  {
    q: "Can I buy Volatility Vince separately without the full Krupp Capital Trading Suite?",
    a: "Yes. Every module of the Krupp Capital Trading Suite — including Volatility Vince — is sold individually so traders who already have their own software stack can deploy just the quant chatbot for asking questions, generating charts and calculating GEX levels.",
  },
  {
    q: "Where does Volatility Vince run?",
    a: "Volatility Vince is delivered as a Telegram chatbot and is also available as an in-app chat inside Module 01 (Project Aura). You interact with it through natural-language messages and slash commands.",
  },
  {
    q: "What data sources does Volatility Vince use?",
    a: "It integrates yfinance, Alpha Vantage, CBOE scraping, the VKKM Aegis live market feeds and TradingView webhooks. A shared data layer also supports IBKR, Yahoo Finance, CBOE and Alpha Vantage API clients.",
  },
  {
    q: "How fast are the calculations?",
    a: "End-to-end analysis for a single symbol including 50+ indicators completes in under 2 seconds. GEX is calculated in real time across 100K+ strikes per market, and the risk dashboard refreshes in under 1 second for 1000+ positions.",
  },
  {
    q: "Is it suitable for professional / prop-firm use?",
    a: "Yes. The Desk / Prop Firm tier supports multi-seat licensing, white-label branding, on-premise deployment, the VKKM Aegis risk engine, FINN deep-learning pricing and ColQwen2 document retrieval — with an SLA and a dedicated engineer.",
  },
  {
    q: "What about German tax compliance?",
    a: "Volatility Vince pairs natively with Module 04 (Tax Commander) for IBKR tax automation covering §20 & §23 EStG, Abgeltungssteuer, wash-sale detection and FIFO cost basis — for both Privatanleger and GmbH entities.",
  },
  {
    q: "Is the source code open?",
    a: "Volatility Vince is proprietary software. Internal source code, models and prompts remain confidential; plugins and MCP infrastructure are not disclosed. Commercial licensing is available on request.",
  },
  {
    q: "How do I get support?",
    a: "Priority Telegram support on Pro Trader; SLA-backed dedicated engineer on Desk / Prop Firm tiers. Email maxkrupp@gmail.com or contact @kruppcapital.",
  },
];

export const navLinks = [
  { href: "#overview", label: "Overview" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#demo", label: "Live Demo" },
  { href: "#gex", label: "GEX Engine" },
  { href: "#greeks", label: "Greeks" },
  { href: "#strategy", label: "Strategy" },
  { href: "#correlation", label: "Correlations" },
  { href: "#regime", label: "Regime" },
  { href: "#architecture", label: "Architecture" },
  { href: "#commands", label: "Commands" },
  { href: "#suite", label: "The Suite" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];
