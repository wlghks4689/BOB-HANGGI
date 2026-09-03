import type { ChangeEventHandler, ReactNode } from 'react'

export function EditorSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="editor-section"><div className="section-heading"><h3>{title}</h3>{description && <p>{description}</p>}</div>{children}</section>
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="editor-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
}

export function TextField({ label, value, onChange, multiline = false, hint, placeholder }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; hint?: string; placeholder?: string }) {
  const handler: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (event) => onChange(event.target.value)
  return <Field label={label} hint={hint}>{multiline ? <textarea value={value} onChange={handler} placeholder={placeholder} rows={3} /> : <input value={value} onChange={handler} placeholder={placeholder} />}</Field>
}

export function NumberField({ label, value, onChange, min = 0, max = 100, step = 1, hint }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number; hint?: string }) {
  return <Field label={label} hint={hint}><input type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} /></Field>
}

export function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="toggle-field"><span>{label}</span><button type="button" className={checked ? 'is-on' : ''} onClick={() => onChange(!checked)}><i /></button></label>
}
