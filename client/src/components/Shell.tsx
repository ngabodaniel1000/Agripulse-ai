"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Brain,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  CloudRain,
  FileText,
  Gauge,
  Globe2,
  Layers,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  PackageOpen,
  Search,
  Settings,
  ShieldCheck,
  Sprout,
  Store,
  TrendingUp,
  User,
  Wheat,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toaster } from "sonner";
import { useDashboard } from "@/lib/dashboard-store";

type IconType = React.ComponentType<{ size?: number; className?: string }>;

export interface NavItem {
  to: string;
  name: string;
  icon: IconType;
  count?: number;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "AGRICULTURAL INTELLIGENCE",
    items: [
      { to: "/", name: "Market dominance", icon: BarChart3 },
      { to: "/planner", name: "Planner dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "FARM DECISIONS",
    items: [
      { to: "/crop-analysis", name: "Crop & input analysis", icon: Sprout },
      { to: "/input-combinations", name: "Input combinations", icon: Layers },
      { to: "/yield-prediction", name: "Yield prediction", icon: Gauge },
      { to: "/weather", name: "Weather intelligence", icon: CloudRain },
    ],
  },
  {
    label: "FARM OPERATIONS",
    items: [
      { to: "/farm-performance", name: "Farm performance", icon: TrendingUp },
      { to: "/post-harvest", name: "Post-harvest analyzer", icon: PackageOpen },
      { to: "/sell-or-store", name: "Sell vs store", icon: Store },
      { to: "/farmer-profile", name: "Farmer profile", icon: User },
    ],
  },
  {
    label: "MARKET & GEOGRAPHY",
    items: [
      { to: "/market-prices", name: "Market prices", icon: Wheat },
      { to: "/map", name: "Rwanda map", icon: MapIcon },
      { to: "/alerts", name: "Agricultural alerts", icon: Bell, count: 4 },
    ],
  },
  {
    label: "EVIDENCE & LEARNING",
    items: [
      { to: "/explainable-ai", name: "Explainable AI", icon: Brain },
      { to: "/analysis-reports", name: "Analytical reports", icon: ClipboardList },
      { to: "/opportunities", name: "Under-supplied crops", icon: Sprout, count: 3 },
      { to: "/advisory", name: "Soil–climate advisory", icon: Layers },
      { to: "/reports", name: "Source reports", icon: FileText },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export function Choice({
  value,
  onChange,
  options,
  label,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((x) => (
          <SelectItem key={x} value={x}>
            {x}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { search, setSearch, role } = useDashboard();
  const [mobile, setMobile] = useState(false);
  const [alerts, setAlerts] = useState(false);
  const [help, setHelp] = useState(false);
  const title = NAV_ITEMS.find((x) => x.to === path)?.name ?? "Settings";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <Link href="/" className="brand" onClick={() => setMobile(false)}>
          <div className="brand-mark">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div>
            <div className="brand-name">NISR</div>
            <div className="brand-sub">
              National Institute of
              <br />
              Statistics of Rwanda
            </div>
          </div>
        </Link>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="nav-label">{group.label}</div>
            <nav>
              {group.items.map((n) => (
                <Link
                  key={n.to}
                  href={n.to}
                  className={`nav-link ${path === n.to ? "active" : ""}`}
                  onClick={() => setMobile(false)}
                >
                  <n.icon />
                  {n.name}
                  {n.count ? <span className="nav-count">{n.count}</span> : null}
                </Link>
              ))}
            </nav>
          </div>
        ))}
        <div className="nav-label">WORKSPACE</div>
        <Link
          href="/settings"
          className={`nav-link ${path === "/settings" ? "active" : ""}`}
          onClick={() => setMobile(false)}
        >
          <Settings />
          Settings
        </Link>
        <Button
          variant="ghost"
          className="nav-link w-full justify-start"
          onClick={() => setHelp(true)}
        >
          <CircleHelp />
          Help & data guide
        </Button>
        <div className="sidebar-bottom">
          <div className="data-status">
            <span className="status-dot" />
            <strong className="text-xs font-medium">Official report sources</strong>
            <p>9 documents · 2022–2025 editions</p>
            <Link href="/reports" className="text-primary text-[10px] mt-2 flex items-center gap-1">
              View data sources <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="data-status sim-status">
            <span className="sim-dot" />
            <strong className="text-xs font-medium">Simulated demonstration</strong>
            <p>
              Farm, weather, price and yield figures in the new modules are simulated, not verified
              statistics.
            </p>
          </div>
          <div className="profile">
            <div className="avatar">NA</div>
            <div>
              <strong>{role}</strong>
              <small>National workspace</small>
            </div>
            <ChevronDown size={13} className="ml-auto text-muted-foreground" />
          </div>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <Button
            variant="ghost"
            size="icon"
            className="mobile-menu"
            aria-label={mobile ? "Close navigation" : "Open navigation"}
            onClick={() => setMobile(!mobile)}
          >
            {mobile ? <X /> : <Menu />}
          </Button>
          <div className="breadcrumb">
            Agricultural intelligence <ChevronRight size={12} />
            <strong>{title}</strong>
          </div>
          <div className="top-actions">
            <label className="global-search">
              <Search size={15} />
              <input
                aria-label="Search crops and reports"
                placeholder="Search crops, reports…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <span className="language">
              <Globe2 size={14} /> English
            </span>
            <span className="h-5 border-l border-border" />
            <Button
              variant="ghost"
              size="icon"
              className="notification"
              aria-label="View agricultural alerts"
              title="Agricultural alerts"
              onClick={() => setAlerts(true)}
            >
              <Bell size={17} />
            </Button>
            <div className="avatar">NA</div>
          </div>
        </header>
        <main className="page">
          {children}
          <footer className="footer">
            <div className="footer-sources">
              <span>DATA SOURCES</span>
              {["AHS 2024", "FBS 2025 edition", "IBES 2024", "RPHC 2022", "Trade 2025"].map((x) => (
                <Link key={x} href="/reports">
                  {x}
                </Link>
              ))}
            </div>
            <span>
              <ShieldCheck size={10} className="inline mr-1" />
              Report statistics + simulated module data · National coverage
            </span>
          </footer>
        </main>
      </div>
      <Toaster position="bottom-right" />
      <Dialog open={alerts} onOpenChange={setAlerts}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agricultural watchlist</DialogTitle>
            <DialogDescription>
              Indicators from uploaded reports and the demonstration alerts.
            </DialogDescription>
          </DialogHeader>
          <div className="alert-list">
            <div className="alert-item">
              <strong>High import dependency</strong>
              <p>
                Vegetable oils: 210%; sugar: 102.2%; fish: 81%. Evaluate import substitution
                opportunities. FBS 2025 edition.
              </p>
            </div>
            <div className="alert-item">
              <strong>Dietary diversification priority</strong>
              <p>
                Carbohydrates account for 77.8% of available dietary energy, while fat accounts for
                12.0%.
              </p>
            </div>
            <div className="alert-item">
              <strong>Irrigation coverage</strong>
              <p>14.1% of agricultural households use irrigation. AHS 2024.</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/alerts" onClick={() => setAlerts(false)}>
              Open agricultural alerts <ArrowRight />
            </Link>
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Data & methodology</DialogTitle>
            <DialogDescription>What these indicators represent.</DialogDescription>
          </DialogHeader>
          <div className="document-preview">
            {`Crop adoption is the percentage of agricultural households growing a crop, not a market share. Households can grow multiple crops, so percentages do not sum to 100%.

The dashboard combines different reference periods. The FBS edition reports 2025 indicators and historical comparisons.

Import dependency ratios can exceed 100% because of exports, stock changes and the denominator used in the report.

The Farm Decisions, Farm Operations and Market & Geography modules use simulated demonstration data. Yields, prices, weather and storage losses are generated by transparent algorithms for illustration. They are not verified NISR statistics, live market prices or real weather observations.

The yield engine is a transparent response function, not a trained machine-learning model. Soil laboratory results are user-reported and should be validated by an extension officer before any planting decision.`}
          </div>
          <Button asChild variant="outline">
            <Link href="/explainable-ai" onClick={() => setHelp(false)}>
              How predictions are explained <ArrowRight />
            </Link>
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PageTitle({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="title-row">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p className="subtitle">{description}</p>
      </div>
      {children && <div className="title-actions">{children}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
