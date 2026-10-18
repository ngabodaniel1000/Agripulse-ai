"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AXIS = { fill: "var(--muted-foreground)", fontSize: 10 };
const TOOLTIP_STYLE = {
  background: "var(--card)",
  borderColor: "var(--border)",
  borderRadius: 6,
  color: "var(--foreground)",
  fontSize: 11,
};
const PALETTE = [
  "var(--chart-a)",
  "var(--chart-b)",
  "var(--chart-c)",
  "var(--success)",
  "var(--warning)",
];

function grid() {
  return <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 4" />;
}

export function TrendLine({
  data,
  xKey,
  series,
  height = 240,
  yFormatter,
  yDomain,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: { key: string; label: string; color?: string }[];
  height?: number;
  yFormatter?: (value: number) => string;
  yDomain?: [number | "auto", number | "auto"];
}) {
  return (
    <div style={{ width: "100%", height }} role="img" aria-label="Trend chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, left: -8, bottom: 4 }}>
          {grid()}
          <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={AXIS} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={AXIS}
            width={52}
            domain={yDomain}
            tickFormatter={yFormatter as never}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={yFormatter as never} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {series.map((s, i) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color ?? PALETTE[i % PALETTE.length]}
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AreaTrend({
  data,
  xKey,
  yKey,
  yLabel,
  color = "var(--chart-a)",
  height = 220,
  yFormatter,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  yLabel: string;
  color?: string;
  height?: number;
  yFormatter?: (value: number) => string;
}) {
  return (
    <div style={{ width: "100%", height }} role="img" aria-label={`${yLabel} area chart`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 12, left: -8, bottom: 4 }}>
          <defs>
            <linearGradient id={`area-${yKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.5} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          {grid()}
          <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={AXIS} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={AXIS}
            width={52}
            tickFormatter={yFormatter as never}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={yFormatter as never} />
          <Area
            type="monotone"
            dataKey={yKey}
            name={yLabel}
            stroke={color}
            strokeWidth={2}
            fill={`url(#area-${yKey})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarCompare({
  data,
  xKey,
  yKey,
  yLabel,
  color = "var(--chart-a)",
  height = 260,
  horizontal = false,
  yFormatter,
  colorByIndex = false,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  yLabel: string;
  color?: string;
  height?: number;
  horizontal?: boolean;
  yFormatter?: (value: number) => string;
  colorByIndex?: boolean;
}) {
  return (
    <div style={{ width: "100%", height }} role="img" aria-label={`${yLabel} bar chart`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 12, right: 16, left: horizontal ? 8 : -8, bottom: 4 }}
        >
          {grid()}
          {horizontal ? (
            <>
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={AXIS}
                tickFormatter={yFormatter as never}
              />
              <YAxis
                type="category"
                dataKey={xKey}
                axisLine={false}
                tickLine={false}
                tick={AXIS}
                width={104}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xKey}
                axisLine={false}
                tickLine={false}
                tick={{ ...AXIS, fontSize: 9 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={44}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={AXIS}
                width={52}
                tickFormatter={yFormatter as never}
              />
            </>
          )}
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={yFormatter as never}
            cursor={{ fill: "var(--secondary)" }}
          />
          <Bar dataKey={yKey} name={yLabel} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={colorByIndex ? PALETTE[i % PALETTE.length] : color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutShare({
  data,
  nameKey,
  valueKey,
  height = 260,
  valueFormatter,
}: {
  data: Record<string, string | number>[];
  nameKey: string;
  valueKey: string;
  height?: number;
  valueFormatter?: (value: number) => string;
}) {
  return (
    <div style={{ width: "100%", height }} role="img" aria-label="Share chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={valueFormatter as never} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            innerRadius="52%"
            outerRadius="78%"
            paddingAngle={2}
            stroke="var(--card)"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
