import { useState } from 'react'
import type { OnboardingConfig, QuestionCategory, QuestionConfig } from '../types/onboarding'
import { uid } from '../utils/config'
import { EditorSection, Field, TextField } from './EditorFields'

export function QuestionEditor({ config, questionIndex, setQuestionIndex, onChange }: { config: OnboardingConfig; questionIndex: number; setQuestionIndex: (index: number) => void; onChange: (questions: QuestionConfig[]) => void }) {
  const questions = config.values.questions
  const safeIndex = Math.min(questionIndex, Math.max(0, questions.length - 1))
  const current = questions[safeIndex]
  const [dragged, setDragged] = useState<number | null>(null)
  const replace = (question: QuestionConfig) => onChange(questions.map((item) => item.id === question.id ? question : item))
  const move = (to: number) => {
    if (dragged === null || dragged === to) return
    const next = [...questions]
    const [item] = next.splice(dragged, 1)
    next.splice(to, 0, item)
    onChange(next)
    setQuestionIndex(to)
    setDragged(null)
  }
  const moveDirect = (from: number, to: number) => {
    if (to < 0 || to >= questions.length) return
    const next = [...questions]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
    setQuestionIndex(to)
  }
  const addQuestion = () => {
    const next: QuestionConfig = { id: uid('question'), category: 'values', topic: '새 질문', question: '질문을 입력해주세요.', description: '', developerNote: '', options: [{ id: uid('option'), label: '선택지 1' }, { id: uid('option'), label: '선택지 2' }] }
    onChange([...questions, next])
    setQuestionIndex(questions.length)
  }
  return <>
    <EditorSection title={`QUESTION LIST · ${questions.length}`} description="질문을 클릭해 편집하고, 드래그해 Progress 순서를 바꿉니다.">
      <div className="question-editor-list">
        {questions.map((item, index) => <div className={`question-list-row ${index === safeIndex ? 'is-active' : ''}`} draggable key={item.id} onDragStart={() => setDragged(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => move(index)}><button className="question-select" onClick={() => setQuestionIndex(index)}><span>≡</span><b>{String(index + 1).padStart(2, '0')}</b><em>{item.topic}</em></button><button aria-label={`${item.topic} 위로`} disabled={index === 0} onClick={() => moveDirect(index, index - 1)}>↑</button><button aria-label={`${item.topic} 아래로`} disabled={index === questions.length - 1} onClick={() => moveDirect(index, index + 1)}>↓</button></div>)}
      </div>
      <button className="secondary-action" onClick={addQuestion}>＋ 질문 추가</button>
    </EditorSection>
    {current && <EditorSection title={`질문 ${String(safeIndex + 1).padStart(2, '0')} 편집`}>
      <Field label="Category"><select value={current.category} onChange={(event) => replace({ ...current, category: event.target.value as QuestionCategory })}><option value="values">가치관</option><option value="lifestyle">라이프스타일</option><option value="love">연애관</option></select></Field>
      <TextField label="목록 이름" value={current.topic} onChange={(topic) => replace({ ...current, topic })} />
      <TextField label="Question" value={current.question} onChange={(question) => replace({ ...current, question })} multiline />
      <TextField label="Description · Optional" value={current.description} onChange={(description) => replace({ ...current, description })} multiline />
      <TextField label="Developer Note · Optional" value={current.developerNote} onChange={(developerNote) => replace({ ...current, developerNote })} multiline />
      <div className="option-editor"><span className="mini-label">CHOICES · {current.options.length}</span>{current.options.map((option, index) => <div className="reorder-row" key={option.id}><b>{index + 1}</b><input value={option.label} onChange={(event) => replace({ ...current, options: current.options.map((item) => item.id === option.id ? { ...item, label: event.target.value } : item) })} /><button className="icon-button danger" disabled={current.options.length <= 2} onClick={() => replace({ ...current, options: current.options.filter((item) => item.id !== option.id) })}>×</button></div>)}</div>
      <div className="editor-action-row"><button className="secondary-action" onClick={() => replace({ ...current, options: [...current.options, { id: uid('option'), label: `선택지 ${current.options.length + 1}` }] })}>＋ 선택지 추가</button><button className="text-danger" disabled={questions.length <= 1} onClick={() => { onChange(questions.filter((item) => item.id !== current.id)); setQuestionIndex(Math.max(0, safeIndex - 1)) }}>이 질문 삭제</button></div>
    </EditorSection>}
  </>
}
