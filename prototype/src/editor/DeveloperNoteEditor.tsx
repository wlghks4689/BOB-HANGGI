import type { DeveloperNoteConfig, FontChoice, TextAlignChoice } from '../types/onboarding'
import { EditorSection, Field, NumberField, TextField, ToggleField } from './EditorFields'

export function DeveloperNoteEditor({ note, onChange }: { note: DeveloperNoteConfig; onChange: (note: DeveloperNoteConfig) => void }) {
  const patch = (value: Partial<DeveloperNoteConfig>) => onChange({ ...note, ...value })
  return <EditorSection title="DEVELOPER NOTE" description="메인 UI와 조금 다른 메모의 목소리를 실험합니다.">
    <ToggleField label="메모 표시" checked={note.enabled} onChange={(enabled) => patch({ enabled })} />
    <TextField label="Label" value={note.label} onChange={(label) => patch({ label })} />
    <TextField label="문구" value={note.text} onChange={(text) => patch({ text })} multiline />
    <div className="editor-grid two">
      <Field label="Font Style"><select value={note.font} onChange={(event) => patch({ font: event.target.value as FontChoice })}><option value="sans">기본 Sans</option><option value="hand">손글씨 느낌</option><option value="serif">Serif</option><option value="mono">Mono</option></select></Field>
      <NumberField label="Text Size" value={note.fontSize} min={10} max={24} onChange={(fontSize) => patch({ fontSize })} />
      <Field label="Text Align"><select value={note.align} onChange={(event) => patch({ align: event.target.value as TextAlignChoice })}><option value="left">왼쪽</option><option value="center">가운데</option><option value="right">오른쪽</option></select></Field>
      <NumberField label="Rotation" value={note.rotation} min={-6} max={6} onChange={(rotation) => patch({ rotation })} />
      <Field label="Background"><input type="color" value={note.background} onChange={(event) => patch({ background: event.target.value })} /></Field>
      <Field label="Border"><input type="color" value={note.border} onChange={(event) => patch({ border: event.target.value })} /></Field>
    </div>
    <ToggleField label="Label 앞 메모 기호 표시" checked={note.showEmoji} onChange={(showEmoji) => patch({ showEmoji })} />
  </EditorSection>
}
