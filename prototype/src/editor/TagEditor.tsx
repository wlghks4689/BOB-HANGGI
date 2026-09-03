import { useState } from 'react'
import type { TagScreenConfig } from '../types/onboarding'
import { uid } from '../utils/config'
import { EditorSection, NumberField, TextField, ToggleField } from './EditorFields'

export function TagEditor({ value, onChange }: { value: TagScreenConfig; onChange: (value: TagScreenConfig) => void }) {
  const [dragged, setDragged] = useState<number | null>(null)
  const patch = (change: Partial<TagScreenConfig>) => onChange({ ...value, ...change })
  const move = (to: number) => {
    if (dragged === null || dragged === to) return
    const tags = [...value.tags]
    const [item] = tags.splice(dragged, 1)
    tags.splice(to, 0, item)
    patch({ tags })
    setDragged(null)
  }
  const moveDirect = (from: number, to: number) => {
    if (to < 0 || to >= value.tags.length) return
    const tags = [...value.tags]
    const [item] = tags.splice(from, 1)
    tags.splice(to, 0, item)
    patch({ tags })
  }
  return <>
    <EditorSection title="화면 문구">
      <TextField label="Header" value={value.header} onChange={(header) => patch({ header })} />
      <TextField label="단계 문구" value={value.eyebrow} onChange={(eyebrow) => patch({ eyebrow })} />
      <TextField label="대제목" value={value.headline} onChange={(headline) => patch({ headline })} multiline />
      <TextField label="보조 설명" value={value.description} onChange={(description) => patch({ description })} multiline />
      <TextField label="CTA" value={value.cta} onChange={(cta) => patch({ cta })} />
    </EditorSection>
    <EditorSection title={`TAG EDITOR · ${value.tags.length}`} description="≡ 손잡이를 드래그해 Preview 순서를 바꿉니다.">
      <div className="reorder-list">
        {value.tags.map((tag, index) => <div className="reorder-row tag-row" draggable key={tag.id} onDragStart={() => setDragged(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => move(index)}>
          <span className="drag-handle">≡</span>
          <input value={tag.label} onChange={(event) => patch({ tags: value.tags.map((item) => item.id === tag.id ? { ...item, label: event.target.value } : item) })} />
          <button className="icon-button" aria-label={`${tag.label} 위로`} disabled={index === 0} onClick={() => moveDirect(index, index - 1)}>↑</button>
          <button className="icon-button" aria-label={`${tag.label} 아래로`} disabled={index === value.tags.length - 1} onClick={() => moveDirect(index, index + 1)}>↓</button>
          <button className="icon-button danger" aria-label={`${tag.label} 삭제`} onClick={() => patch({ tags: value.tags.filter((item) => item.id !== tag.id) })}>×</button>
        </div>)}
      </div>
      <button className="secondary-action" onClick={() => patch({ tags: [...value.tags, { id: uid('tag'), label: '새 태그' }] })}>＋ 태그 추가</button>
    </EditorSection>
    <EditorSection title="TAG 설정">
      <div className="editor-grid two"><NumberField label="최소 선택" value={value.minSelection} min={0} max={value.maxSelection} onChange={(minSelection) => patch({ minSelection })} /><NumberField label="최대 선택" value={value.maxSelection} min={1} max={20} onChange={(maxSelection) => patch({ maxSelection })} /><NumberField label="직접 입력 글자 수" value={value.customMaxLength} min={5} max={100} onChange={(customMaxLength) => patch({ customMaxLength })} /></div>
      <ToggleField label="직접 입력 허용" checked={value.allowCustom} onChange={(allowCustom) => patch({ allowCustom })} />
      <TextField label="직접 입력 Placeholder" value={value.customPlaceholder} onChange={(customPlaceholder) => patch({ customPlaceholder })} />
    </EditorSection>
  </>
}
