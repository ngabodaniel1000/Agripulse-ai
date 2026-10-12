import {useEffect, useRef, useState} from 'react'
import {RotateCcw} from 'lucide-react'
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell} from 'recharts'
import {Button} from '@/components/ui/button'

type Crop = {name: string; adoption: number}

export function CropHistogram({data}: {data: Crop[]}) {
  const container = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(true)
  const [replay, setReplay] = useState(0)
  const shown = data.slice(0, 5)
  const signature = shown.map(crop => `${crop.name}:${crop.adoption}`).join('|')

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(preference.matches)
    update()
    preference.addEventListener('change', update)
    const element = container.current
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setVisible(true)
        observer.disconnect()
      }
    }, {threshold: 0.2})
    if (element) observer.observe(element)
    return () => {
      preference.removeEventListener('change', update)
      observer.disconnect()
    }
  }, [])

  return <section className="panel" aria-label="Crop adoption histogram">
    <div className="panel-head">
      <div><h2>Leading crops by household adoption</h2><p>Share of agricultural households growing each crop</p></div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="badge">AHS 2024</span>
        <Button variant="ghost" size="icon" aria-label="Replay histogram animation" title="Replay histogram animation" disabled={reducedMotion || !shown.length} onClick={() => setReplay(value => value + 1)}><RotateCcw size={14}/></Button>
      </div>
    </div>
    <div className="chart-body" ref={container}>
      {shown.length ? <div className="adoption-chart" role="img" aria-label={shown.map(crop => `${crop.name}: ${crop.adoption}%`).join('; ')}>
        {visible && <ResponsiveContainer width="100%" height="100%">
          <BarChart key={`${signature}:${replay}:${reducedMotion}`} data={shown} margin={{top: 24, right: 8, left: -12, bottom: 4}} barSize={32}>
            <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 4"/>
            <XAxis dataKey="name" interval={0} axisLine={false} tickLine={false} height={46} angle={-20} textAnchor="end" tick={{fill: 'var(--foreground)', fontSize: 10}}/>
            <YAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={value => `${value}%`} axisLine={false} tickLine={false} width={48} tick={{fill: 'var(--muted-foreground)', fontSize: 9}}/>
            <Tooltip cursor={{fill: 'var(--secondary)'}} contentStyle={{background: 'var(--card)', borderColor: 'var(--border)', borderRadius: 6, color: 'var(--foreground)'}} formatter={(value: number) => [`${value}%`, 'Household adoption']}/>
            <Bar dataKey="adoption" radius={[4, 4, 0, 0]} isAnimationActive={!reducedMotion} animationBegin={100} animationDuration={1500} animationEasing="ease-out" label={{position: 'top', fill: 'var(--foreground)', fontSize: 10, formatter: (value: number) => `${value}%`}}>
              {shown.map((crop, index) => <Cell key={crop.name} fill={index < 2 ? 'var(--chart-a)' : index < 4 ? 'var(--chart-b)' : 'var(--chart-c)'}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>}
      </div> : <div className="empty-state">No crops match these filters.</div>}
    </div>
    <div className="chart-legend"><span><span className="legend-swatch"/>Reported adoption</span><span>Reference seasons vary by crop</span></div>
  </section>
}