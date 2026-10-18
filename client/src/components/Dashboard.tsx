"use client";

import { lazy, Suspense, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Leaf,
  Sprout,
  FileText,
  Settings,
  Bell,
  Search,
  ChevronRight,
  ChevronDown,
  Globe2,
  Download,
  ArrowUpRight,
  ArrowRight,
  SlidersHorizontal,
  MapPin,
  Users,
  Wheat,
  ShieldCheck,
  Info,
  Bean,
  Apple,
  Fish,
  Droplets,
  Layers,
  Menu,
  X,
  Check,
  Copy,
  CircleHelp,
  RefreshCw,
  Upload,
  Mail,
  CalendarDays,
  Building2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Toaster, toast } from "sonner";
import { CropHistogram } from "@/components/CropHistogram";
import { crops, inputs, sources, opportunities, provinceNames } from "@/data/agriculture";
import { useDashboard } from "@/lib/dashboard-store";
import { exportPDF, exportCSV } from "@/lib/exports";
import { Choice, Panel, PageTitle, Shell } from "@/components/Shell";
import fields from "@/assets/rwanda-fields.jpg";

export { Choice, Panel, PageTitle, Shell } from "@/components/Shell";

const ProvinceMap = lazy(() => import("@/components/ProvinceMap"));

export function Metrics() {
  return (
    <div className="kpi-grid">
      {[
        {
          name: "Agricultural households",
          value: "2.2M",
          icon: Users,
          foot: "AHS 2024 · National",
          badge: "Households",
        },
        {
          name: "Leading crop adoption",
          value: "89.8%",
          icon: Bean,
          foot: "Beans · Season A",
          badge: "Most adopted",
        },
        {
          name: "Food self-sufficiency",
          value: "79.7%",
          icon: ShieldCheck,
          foot: "FBS 2025 edition",
          badge: "Supply indicator",
        },
        {
          name: "Import dependency",
          value: "56.1%",
          icon: TrendingUp,
          foot: "FBS 2025 edition",
          badge: "Monitor",
          warning: true,
        },
      ].map((x) => (
        <div className="kpi" key={x.name}>
          <div className="kpi-head">
            <span>{x.name}</span>
            <div className="kpi-icon">
              <x.icon />
            </div>
          </div>
          <div className="kpi-value">{x.value}</div>
          <div className="kpi-foot">
            <span className={`pill ${x.warning ? "warning" : ""}`}>{x.badge}</span>
            <span>{x.foot}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CropIcon({ name }: { name: string }) {
  return name === "Beans" ? (
    <Bean />
  ) : name === "Maize" ? (
    <Wheat />
  ) : name === "Cassava" || name === "Sweet potato" ? (
    <Sprout />
  ) : (
    <Apple />
  );
}

export function ExportDialog({
  open,
  onClose,
  title,
  text,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  text: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Source-backed draft for review before distribution.</DialogDescription>
        </DialogHeader>
        <div className="document-preview">{text}</div>
        <div className="dialog-actions">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                toast.success("Summary copied");
              } catch {
                toast.error("Clipboard unavailable. Select and copy the summary.");
              }
            }}
          >
            {copied ? <Check /> : <Copy />}
            Copy summary
          </Button>
          <Button
            onClick={() => {
              exportPDF(title, text);
              toast.success("PDF downloaded");
            }}
          >
            <Download />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Market() {
  const { region, setRegion, season, setSeason, category, setCategory, search } = useDashboard();
  const [advisory, setAdvisory] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const filtered = crops.filter(
    (c) =>
      (category === "All crops" || c.category === category) &&
      (season === "All seasons" || c.season === season.replace("Season ", "")) &&
      c.name.toLowerCase().includes(search.toLowerCase()),
  );
  const shown = expanded ? filtered : filtered.slice(0, 5);

  const text = `NATIONAL PLANTING POLICY NOTE\nSelected advisory geography: ${region}\nCrop filter: ${category} | ${season}\n\nAHS 2024 reports 2.2 million agricultural households. Beans have the highest reported adoption (89.8%, Season A), followed by maize (80.8%, Season A).\n\nSelected crop adoption:\n${filtered.map((c) => `${c.name}: ${c.adoption}% (${c.season})`).join("\n")}\n\nDecision priorities:\n1. Preserve access to improved seed and extension support for established staples.\n2. Evaluate diversification into oilseeds and nutrient-rich crops; vegetable oils show high import dependency (210%).\n3. Assess irrigation access, reported at 14.1% nationally, before promoting irrigation-dependent crops.\n\nLimitations: adoption is not market share. This note uses national data; it does not estimate province production, yield, prices or fertilizer rates. Field recommendations require local soil tests, climate observations and validated RAB guidance.\n\nSources: AHS 2024; FBS 2025 edition. Draft for analyst review.`;

  return (
    <Shell>
      <PageTitle
        eyebrow="NATIONAL AGRICULTURAL OUTLOOK"
        title="Market dominance"
        description="Understand crop adoption. Identify opportunities. Inform planting decisions."
      >
        <Button
          variant="outline"
          onClick={() => {
            exportCSV(
              filtered.map((c) => ({
                Crop: c.name,
                Adoption_percent: c.adoption,
                Season: c.season,
                Category: c.category,
                Source: "AHS 2024",
              })),
            );
            toast.success("Crop data exported");
          }}
        >
          <Download />
          Export data
        </Button>
        <Button onClick={() => setAdvisory(true)}>
          <Sprout />
          Generate advisory
        </Button>
      </PageTitle>
      <div className="banner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={typeof fields === "string" ? fields : (fields as { src: string }).src}
          alt="Illustrative terraced agricultural landscape in Rwanda"
          width={1536}
          height={512}
        />
        <div className="banner-copy">
          <div className="banner-tag">FROM STATISTICS TO BETTER HARVESTS</div>
          <h2>Growing a data-informed Rwanda.</h2>
          <p>
            A national view of what we grow, what we need,
            <br className="hidden sm:block" />
            and where the next opportunity lies.
          </p>
        </div>
        <div className="banner-source">Agricultural Household Survey · 2024</div>
      </div>
      <div className="filter-row">
        <span className="filter-label">
          <SlidersHorizontal size={13} />
          Filters
        </span>
        <Choice
          label="Province"
          value={region}
          onChange={setRegion}
          options={provinceNames}
          className="filter-select"
        />
        <Choice
          label="Data edition"
          value="2024 / 2025"
          onChange={() => {}}
          options={["2024 / 2025"]}
          className="filter-select"
        />
        <Choice
          label="Season"
          value={season}
          onChange={setSeason}
          options={["All seasons", "Season A", "Season B", "Season C", "Annual"]}
          className="filter-select"
        />
        <Choice
          label="Crop category"
          value={category}
          onChange={setCategory}
          options={["All crops", "Cereals", "Legumes", "Fruits", "Roots & tubers", "Vegetables"]}
          className="filter-select"
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Reset filters"
          title="Reset filters"
          onClick={() => {
            setRegion("All Rwanda");
            setSeason("All seasons");
            setCategory("All crops");
            useDashboard.getState().setSearch("");
          }}
        >
          <RefreshCw size={13} />
        </Button>
        <span className="scope-tag">
          <MapPin size={11} />
          National statistics
        </span>
      </div>
      <Metrics />
      <div className="analysis-grid">
        <Panel
          title="Rwanda agricultural geography"
          description="Five provinces · Select an advisory geography"
          action={<span className="badge">3D view</span>}
        >
          <div className="map-panel">
            <div className="map-canvas">
              <Suspense fallback={<div className="empty-state">Loading Rwanda map…</div>}>
                <ProvinceMap />
              </Suspense>
              <span className="map-label north">Northern</span>
              <span className="map-label west">Western</span>
              <span className="map-label east">Eastern</span>
              <span className="map-label south">Southern</span>
              <span className="map-label kigali">Kigali</span>
            </div>
          </div>
          <div className="map-caption">
            <strong>
              <MapPin size={10} className="inline mr-1" />
              {region}
            </strong>
            <span>Boundary map · No provincial production data</span>
          </div>
        </Panel>
        <CropHistogram data={filtered} />
      </div>
      <div className="bottom-grid">
        <Panel
          title="Crop adoption overview"
          description="National household adoption · not market share"
          action={
            <Button variant="ghost" onClick={() => setExpanded(!expanded)}>
              {expanded ? "Show top 5" : "View all crops"}
              <ArrowRight size={12} />
            </Button>
          }
        >
          <div className="mt-4 overflow-x-auto">
            <table className="crop-table">
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>HH adoption</th>
                  <th>Season</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((c) => (
                  <tr key={c.name}>
                    <td>
                      <span className="crop-name">
                        <span className="crop-symbol">
                          <CropIcon name={c.name} />
                        </span>
                        {c.name}
                      </span>
                    </td>
                    <td>
                      <div className="adoption-cell">
                        {c.adoption}%
                        <span className="mini-bar">
                          <progress value={c.adoption} max={100} />
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge">
                        {c.season === "Annual" ? "Annual" : `Season ${c.season}`}
                      </span>
                    </td>
                    <td className="text-muted-foreground">{c.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!shown.length && <div className="empty-state">No crops match your search.</div>}
          </div>
          <div className="table-footer">
            <span>
              Showing {shown.length} of {filtered.length} crops
            </span>
            <span>Source: AHS 2024</span>
          </div>
        </Panel>
        <Panel
          title="Import substitution opportunities"
          description="Priority sectors with high import dependency"
          action={<ArrowUpRight size={15} className="text-muted-foreground" />}
        >
          <div className="opportunity-list">
            {opportunities.map((o) => (
              <div key={o.name} className="opportunity-item">
                <span className="opportunity-icon">
                  {o.icon === "fish" ? <Fish /> : o.icon === "oil" ? <Droplets /> : <Wheat />}
                </span>
                <div className="opportunity-copy">
                  <div className="opportunity-title">
                    {o.name}
                    <span className="badge amber">{o.idr}% IDR</span>
                  </div>
                  <p>
                    {o.crop}
                    <br />
                    {o.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="opportunity-action">
            <span>FBS 2025 edition</span>
            <Button variant="link" size="sm" asChild>
              <Link href="/opportunities">
                Explore opportunities <ArrowRight />
              </Link>
            </Button>
          </div>
        </Panel>
      </div>
      <ExportDialog
        open={advisory}
        onClose={() => setAdvisory(false)}
        title="Planting policy advisory"
        text={text}
      />
    </Shell>
  );
}

export function Opportunities() {
  const { region } = useDashboard();
  const [selected, setSelected] = useState<string | null>(null);
  const campaign = opportunities.find((x) => x.name === selected);
  const text = campaign
    ? `IMPORT SUBSTITUTION CAMPAIGN BRIEF\nSector: ${campaign.name}\nAdvisory geography: ${region}\n\nEvidence: ${campaign.name} import dependency ratio is ${campaign.idr}% in the supplied FBS 2025 edition. This is a national food-balance indicator, not district-level unmet demand.\n\nProposed focus: ${campaign.crop}. ${campaign.reason}\n\nSMS DRAFT:\nExplore ${campaign.crop.toLowerCase()} opportunities with your local extension officer. Confirm local soil, water and market suitability before investing.\n\nRADIO SCRIPT DRAFT:\nRwanda can strengthen local food supply through suitable production and processing. Farmers and cooperatives interested in ${campaign.crop.toLowerCase()} should consult extension teams for site assessment, training and market information.\n\nEXTENSION CHECKLIST:\n- Validate local crop and water suitability.\n- Verify input access and buyer demand.\n- Identify producer groups and processing capacity.\n- Establish a baseline and measure campaign outcomes.\n\nSource: FBS 2025 edition. Proposed campaign, not yet launched; review required. IDR may exceed 100% because of exports and stock changes.`
    : "";

  return (
    <Shell>
      <PageTitle
        eyebrow="OPPORTUNITIES & FOOD SECURITY"
        title="Under-supplied crops"
        description="Turn import exposure and nutritional gaps into targeted action."
      >
        <Button
          onClick={() =>
            exportPDF(
              "Import substitution policy note",
              `National opportunity screening\nVegetable oils IDR: 210%\nSugar IDR: 102.2%\nFish IDR: 81%\n\nProposed response: assess domestic oilseed supply chains, sugar processing and aquaculture viability. No PPS is reported: adoption, climate-fit and demand-growth inputs are missing.\nSource: FBS 2025 edition.`,
            )
          }
        >
          <Download />
          Export policy note
        </Button>
      </PageTitle>
      <div className="section-note">
        <Info />
        National import dependency identifies sectors for investigation. A district-level market gap
        or promotion score cannot be calculated without additional supply, demand and suitability
        data.
      </div>
      <div className="report-grid">
        {opportunities.map((o) => (
          <section key={o.name} className="panel campaign-card">
            <div className="campaign-head">
              <span className="opportunity-icon">
                {o.icon === "fish" ? <Fish /> : o.icon === "oil" ? <Droplets /> : <Wheat />}
              </span>
              <span className="badge amber">{o.priority}</span>
            </div>
            <h2>{o.name}</h2>
            <div className="big-number">{o.idr}%</div>
            <span className="unavailable">Import dependency ratio · FBS</span>
            <p>
              {o.reason}
              <br />
              Potential focus: {o.crop}.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setSelected(o.name)}>
              <Mail />
              Prepare campaign brief
            </Button>
          </section>
        ))}
      </div>
      <h2 className="view-heading">The nutrition opportunity</h2>
      <div className="analysis-grid">
        <Panel
          title="Nutrient availability vs. recommended intake"
          description="Available daily supply · FBS 2025 edition"
        >
          <div className="panel-body">
            {[
              { name: "Calcium", value: 246, target: 1008, unit: "mg" },
              { name: "Vitamin B12", value: 0.2, target: 2, unit: "µg" },
              { name: "Vitamin D", value: 0.7, target: 5.7, unit: "µg" },
            ].map((n) => (
              <div className="nutrient-block" key={n.name}>
                <div className="nutrient-row">
                  <strong>{n.name}</strong>
                  <span>
                    {n.value} / {n.target} {n.unit}
                  </span>
                </div>
                <progress className="meter" value={n.value} max={n.target} />
                <p className="text-[10px] text-muted-foreground mt-2">
                  {((100 * n.value) / n.target).toFixed(1)}% of recommended intake
                </p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="Dietary energy & food security"
          description="National food availability indicators"
        >
          <div className="panel-body metric-list">
            {[
              ["Daily energy supply", "2,366.7 kcal"],
              ["Carbohydrate share", "77.8%"],
              ["Fat share", "12.0%"],
              ["Prevalence of undernourishment", "29.9%"],
              ["People undernourished", "4.1 million"],
            ].map(([n, v]) => (
              <div className="metric-list-row" key={n}>
                <span className="text-muted-foreground">{n}</span>
                <strong>{v}</strong>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              FBS key findings (p. 10): carbs 77.8%, fat 12.0%. Table 7 (p. 18) differs: 77.7% and
              12.2%.
            </p>
            <div className="section-note mt-4 mb-0">
              <Leaf />
              Prioritize nutrient access alongside crop volume. Oilseeds, legumes and diversified
              food supply merit local assessment.
            </div>
          </div>
        </Panel>
      </div>
      <ExportDialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={`${selected ?? "Opportunity"} campaign brief`}
        text={text}
      />
    </Shell>
  );
}

export function Advisory() {
  const { region, setRegion, season, setSeason } = useDashboard();
  const [ph, setPh] = useState("");
  const [rain, setRain] = useState("");
  const [alt, setAlt] = useState("");
  const [yieldTarget, setYield] = useState([3]);
  const [irrigation, setIrrigation] = useState(false);
  const [uploaded, setUploaded] = useState("");
  const [open, setOpen] = useState(false);

  const text = `SOIL–CLIMATE FIELD ASSESSMENT\nLocation: ${region}\nSeason: ${season}\n\nUSER-SUPPLIED INPUTS\nSoil pH: ${ph || "Not supplied"}\nRainfall: ${rain ? rain + " mm/year" : "Not supplied"}\nAltitude: ${alt ? alt + " m" : "Not supplied"}\nTarget yield: ${yieldTarget[0]} t/ha (planning target, not predicted yield)\nIrrigation: ${irrigation ? "Available (user reported)" : "Not available / not confirmed"}\nSoil test: ${uploaded || "Not uploaded"}\n\nFIELD CHECKLIST\n1. Soil: validate pH, texture, organic matter and laboratory N/P/K measurements.\n2. Climate: verify rainfall distribution, temperatures and seasonal forecast with Meteo Rwanda.\n3. Geography: assess slope, drainage and erosion risk at the plot.\n4. Crop match: compare local soil and climate measurements with validated RAB crop requirements.\n5. Seed & fertilizer: consult RAB and an extension officer for approved varieties and laboratory-based application rates.\n\nNo crop suitability score or fertilizer rate is calculated: validated crop parameters and soil nutrient measurements are not connected. This is a field-assessment draft, not agronomic advice.\n\nNational context: AHS 2024 reports improved seed use at 64.6%, organic fertilizer at 94%, inorganic fertilizer at 66.5%, irrigation at 14.1%, erosion control at 90.2%.\n\nSMS DRAFT: Before planting, confirm your soil test, seasonal forecast and approved varieties with your extension officer. Bring your soil and plot measurements for a locally validated planting plan.\n\nSource: AHS 2024. Inputs supplied by user; review before distribution.`;

  async function upload(file: File | undefined) {
    if (!file) return;
    try {
      const content = await file.text();
      if (file.name.endsWith(".json")) {
        const data = JSON.parse(content) as Record<string, unknown>;
        if (data["ph"] !== undefined) {
          if (
            !Number.isFinite(Number(data["ph"])) ||
            Number(data["ph"]) < 0 ||
            Number(data["ph"]) > 14
          )
            throw Error("pH must be between 0 and 14");
          setPh(String(data["ph"]));
        }
        if (data["rainfall"] !== undefined) setRain(String(data["rainfall"]));
        if (data["altitude"] !== undefined) setAlt(String(data["altitude"]));
      } else if (file.name.endsWith(".csv")) {
        const lines = content.trim().split(/\r?\n/);
        if (lines.length < 2) throw Error("CSV needs headers and a data row");
        const keys = (lines[0] ?? "").split(",").map((s) => s.trim().toLowerCase());
        const values = (lines[1] ?? "").split(",");
        const index = keys.indexOf("ph");
        if (index < 0) throw Error("CSV requires a ph column");
        const p = Number(values[index]);
        if (!Number.isFinite(p) || p < 0 || p > 14) throw Error("pH must be between 0 and 14");
        setPh(String(p));
        const r = keys.indexOf("rainfall");
        if (r >= 0) setRain((values[r] ?? "").trim());
        const a = keys.indexOf("altitude");
        if (a >= 0) setAlt((values[a] ?? "").trim());
      } else throw Error("Use a JSON or CSV soil test");
      setUploaded(file.name);
      toast.success("Soil measurements imported");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read soil test");
    }
  }

  return (
    <Shell>
      <PageTitle
        eyebrow="FROM FIELD DATA TO FARM DECISIONS"
        title="Soil–climate advisory"
        description="Build a field assessment for locally validated planting advice."
      >
        <Button onClick={() => setOpen(true)}>
          <FileText />
          Generate field assessment
        </Button>
      </PageTitle>
      <div className="section-note">
        <Info />
        No live weather or validated crop catalog is connected. Soil inputs are user-reported; crop
        and fertilizer recommendations require extension-officer validation.
      </div>
      <div className="advisory-layout">
        <Panel title="Your field profile" description="Advisory geography & plot conditions">
          <div className="panel-body form-grid">
            <div className="form-field">
              <label>Province</label>
              <Choice
                label="Advisory province"
                value={region}
                onChange={setRegion}
                options={provinceNames}
              />
            </div>
            <div className="form-field">
              <label>Season</label>
              <Choice
                label="Advisory season"
                value={season}
                onChange={setSeason}
                options={["All seasons", "Season A", "Season B", "Season C", "Annual"]}
              />
            </div>
            <div className="form-field">
              <label>Soil test</label>
              <Input
                type="file"
                accept=".csv,.json"
                aria-label="Upload soil test"
                onChange={(e) => upload(e.target.files?.[0])}
              />
              <small>CSV or JSON · ph, rainfall, altitude</small>
              {uploaded && (
                <p className="text-xs text-success mt-2">
                  <Check size={12} className="inline" /> {uploaded}
                </p>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="soil-ph">Soil pH</label>
              <Input
                id="soil-ph"
                type="number"
                min={0}
                max={14}
                step={0.1}
                placeholder="Enter test result"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
              />
            </div>
            <div className="field-pair">
              <div className="form-field">
                <label htmlFor="rainfall">Rainfall (mm/year)</label>
                <Input
                  id="rainfall"
                  type="number"
                  min={0}
                  placeholder="Measured"
                  value={rain}
                  onChange={(e) => setRain(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="altitude">Altitude (m)</label>
                <Input
                  id="altitude"
                  type="number"
                  min={0}
                  placeholder="Measured"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                />
              </div>
            </div>
            <div className="form-field">
              <label>
                Yield target <span className="float-right text-primary">{yieldTarget[0]} t/ha</span>
              </label>
              <Slider
                aria-label="Yield target"
                value={yieldTarget}
                onValueChange={setYield}
                min={0.5}
                max={10}
                step={0.5}
              />
              <small>Planning target only</small>
            </div>
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="irrigation">Irrigation available</label>
              <Switch id="irrigation" checked={irrigation} onCheckedChange={setIrrigation} />
            </div>
            <Button onClick={() => setOpen(true)}>
              Prepare assessment <ArrowRight />
            </Button>
          </div>
        </Panel>
        <Panel
          title="Five stages of a planting assessment"
          description="Measurements first. Recommendations after validation."
        >
          <div className="panel-body">
            {[
              {
                name: "Soil",
                text: ph
                  ? `Reported soil pH: ${ph}. Confirm the laboratory result and add N, P, K, texture and organic matter measurements.`
                  : "Upload a soil test or enter your pH. Laboratory nutrient measurements are needed before fertilizer requirements can be calculated.",
              },
              {
                name: "Climate",
                text: rain
                  ? `Reported annual rainfall: ${rain} mm. Verify rainfall timing and temperature with Meteo Rwanda before selecting a crop.`
                  : "Add measured rainfall and obtain a local seasonal forecast. Annual totals alone do not indicate drought or flood risk.",
              },
              {
                name: "Geography",
                text: `Selected geography: ${region}. ${alt ? `Reported altitude: ${alt} m.` : "Plot altitude not supplied."} Assess slope, erosion risk and drainage on site.`,
              },
              {
                name: "Crop match",
                text: "Beans and maize are widely adopted nationally. Local suitability is not scored because crop-specific thresholds and field measurements have not been validated.",
              },
              {
                name: "Seed & fertilizer",
                text: "Confirm approved improved varieties with RAB. Nutrient application rates require soil N/P/K, crop uptake and previous-crop credits; do not infer them from national averages.",
              },
            ].map((s, i) => (
              <div className="advisory-stage" key={s.name}>
                <span className="stage-number">{i + 1}</span>
                <div>
                  <h3>{s.name}</h3>
                  <p>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <ExportDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Soil–climate field assessment"
        text={text}
      />
    </Shell>
  );
}

export function Reports() {
  const { search } = useDashboard();
  const filtered = sources.filter((s) =>
    (s.name + " " + s.tag + " " + s.period).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Shell>
      <PageTitle
        eyebrow="EVIDENCE & DATA LINEAGE"
        title="Reports & exports"
        description="Explore the official publications behind every indicator."
      >
        <Button
          variant="outline"
          onClick={() => {
            exportCSV(
              crops.map((c) => ({
                Crop: c.name,
                Adoption_percent: c.adoption,
                Season: c.season,
                Source: "AHS 2024",
              })),
            );
            toast.success("National crop adoption exported");
          }}
        >
          <Download />
          Export crop dataset
        </Button>
      </PageTitle>
      <div className="section-note">
        <ShieldCheck />
        Reports retain their original publication labels. The 2025 Food Balance Sheets edition
        includes 2025 statistics and historical comparisons; these are not live 2026 observations.
      </div>
      <div className="report-grid">
        {filtered.map((s) => (
          <article className="report-item" key={s.url}>
            <div className="flex justify-between items-center">
              <span className="source-icon">
                <FileText size={20} />
              </span>
              <span className="badge">
                {s.tag} · {s.period}
              </span>
            </div>
            <h2>{s.name}</h2>
            <p>{s.description}</p>
            <Button variant="outline" asChild>
              <a href={s.url} target="_blank" rel="noreferrer">
                Open {s.tag === "XLSX" ? "spreadsheet" : "source report"} <ArrowUpRight />
              </a>
            </Button>
          </article>
        ))}
      </div>
      {!filtered.length && <div className="empty-state">No source reports match your search.</div>}
    </Shell>
  );
}

export function SettingsPage() {
  const { role, setRole, region, setRegion } = useDashboard();
  const [compact, setCompact] = useState(false);

  return (
    <Shell>
      <PageTitle
        eyebrow="YOUR WORKSPACE"
        title="Settings"
        description="Manage your workspace context and data preferences."
      />
      <div className="max-w-3xl">
        <Panel
          title="Workspace preferences"
          description="Session preferences · no account or access-control service connected"
        >
          <div className="panel-body">
            <div className="settings-row">
              <div>
                <h3>Workspace role</h3>
                <p>Role context for prepared documents; not an access permission.</p>
              </div>
              <Choice
                label="Workspace role"
                value={role}
                onChange={setRole}
                options={["NISR Analyst", "MINAGRI Officer", "District Officer", "Farmer"]}
              />
            </div>
            <div className="settings-row">
              <div>
                <h3>Default advisory geography</h3>
                <p>National statistics remain unchanged.</p>
              </div>
              <Choice
                label="Default province"
                value={region}
                onChange={setRegion}
                options={provinceNames}
              />
            </div>
            <div className="settings-row">
              <div>
                <h3>Report review reminders</h3>
                <p>Add a verification checklist to your downloadable workspace note.</p>
              </div>
              <Switch
                aria-label="Report review reminders"
                checked={compact}
                onCheckedChange={setCompact}
              />
            </div>
            <div className="settings-row">
              <div>
                <h3>Data connection</h3>
                <p>9 uploaded publications. No live data service connected.</p>
              </div>
              <span className="badge">Report-based</span>
            </div>
            <div className="mt-5 flex justify-end">
              <Button
                onClick={() => {
                  exportPDF(
                    "Workspace preferences",
                    `Role context: ${role}\nDefault advisory geography: ${region}\nSource publications: 9\nLive feeds: not connected\n${compact ? "\nReview checklist: verify reference period, source table, geography and units before distribution." : ""}`,
                  );
                  toast.success("Workspace preferences downloaded");
                }}
              >
                <Download />
                Export preferences
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    </Shell>
  );
}
