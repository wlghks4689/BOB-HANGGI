import { useRef, useState } from 'react'
import type { CSSProperties, Dispatch, SetStateAction } from 'react'
import type {
  DeveloperNoteConfig,
  MatchingMode,
  OnboardingConfig,
  PrototypeData,
  ScreenId,
  TagScreenConfig,
} from '../types/onboarding'
import { fontStack, isPostOnboardingScreen } from '../utils/config'
import { PostOnboardingPreview } from './PostOnboardingPreview'

type Props = {
  config: OnboardingConfig
  screen: ScreenId
  setScreen: (screen: ScreenId) => void
  mode: MatchingMode
  setMode: (mode: MatchingMode) => void
  width: number
  data: PrototypeData
  setData: Dispatch<SetStateAction<PrototypeData>>
  questionIndex: number
  setQuestionIndex: Dispatch<SetStateAction<number>>
  photoUrls: Array<string | null>
  setPhotoUrls: Dispatch<SetStateAction<Array<string | null>>>
}

const categoryLabel = { values: '가치관', lifestyle: '라이프스타일', love: '연애관' }

export function Preview({
  config,
  screen,
  setScreen,
  mode,
  setMode,
  width,
  data,
  setData,
  questionIndex,
  setQuestionIndex,
  photoUrls,
  setPhotoUrls,
}: Props) {
  const tokens = config.design
  const previewStyle = {
    '--p-primary': tokens.primary,
    '--p-accent': tokens.accent,
    '--p-bg': tokens.background,
    '--p-surface': tokens.surface,
    '--p-text': tokens.text,
    '--p-muted': tokens.mutedText,
    '--p-border': tokens.border,
    '--p-card-radius': `${tokens.cardRadius}px`,
    '--p-button-radius': `${tokens.buttonRadius}px`,
    '--p-tag-radius': `${tokens.tagRadius}px`,
    '--p-border-width': `${tokens.cardBorderWidth}px`,
    '--p-space': tokens.spacingDensity,
    '--p-headline-font': fontStack(tokens.headlineFont),
    '--p-body-font': fontStack(tokens.bodyFont),
    '--p-headline-size': `${tokens.headlineSize}px`,
    '--p-body-size': `${tokens.bodySize}px`,
    '--p-control-size': `${tokens.controlSize}px`,
    '--p-shadow': tokens.shadow ? '0 8px 20px rgba(35, 24, 39, .10)' : 'none',
  } as CSSProperties

  const next = () => {
    const route: Record<ScreenId, ScreenId> = {
      matching: 'basic',
      basic: 'verify',
      verify: mode === 'first_impression' ? 'photo' : 'valuesIntro',
      photo: 'charms',
      charms: 'preferences',
      preferences: 'complete',
      valuesIntro: 'question',
      question: questionIndex >= config.values.questions.length - 1 ? 'complete' : 'question',
      complete: 'serviceGuide',
      serviceGuide: 'home',
      home: 'chat',
      chat: 'chatRoom',
      chatRoom: 'feed',
      feed: 'profile',
      profile: 'home',
    }
    if (screen === 'question' && questionIndex < config.values.questions.length - 1) {
      setQuestionIndex((index) => index + 1)
      return
    }
    if (screen === 'complete') setQuestionIndex(0)
    setScreen(route[screen])
  }

  const back = () => {
    if (screen === 'question' && questionIndex > 0) {
      setQuestionIndex((index) => index - 1)
      return
    }
    const route: Record<ScreenId, ScreenId> = {
      matching: 'matching',
      basic: 'matching',
      verify: 'basic',
      photo: 'verify',
      charms: 'photo',
      preferences: 'charms',
      valuesIntro: 'verify',
      question: 'valuesIntro',
      complete: mode === 'first_impression' ? 'preferences' : 'question',
      serviceGuide: 'complete',
      home: 'serviceGuide',
      chat: 'home',
      chatRoom: 'chat',
      feed: 'chatRoom',
      profile: 'feed',
    }
    setScreen(route[screen])
  }

  return (
    <div className="preview-stage">
      <div className="phone-measure" style={{ width }}>
        <div className="phone-shell" style={previewStyle}>
          <div className="phone-status"><b>9:41</b><span>● ● ▰</span></div>
          <div className="phone-scroll">
            {screen === 'matching' && (
              <MatchingScreen config={config} data={data} setData={setData} setMode={setMode} next={next} />
            )}
            {screen === 'basic' && <BasicScreen config={config} data={data} setData={setData} back={back} next={next} />}
            {screen === 'verify' && <VerifyScreen config={config} data={data} setData={setData} back={back} next={next} />}
            {screen === 'photo' && (
              <PhotoScreen config={config} photoUrls={photoUrls} setPhotoUrls={setPhotoUrls} back={back} next={next} />
            )}
            {screen === 'charms' && (
              <TagScreen
                screenConfig={config.firstImpression.charms}
                selected={data.selectedCharmPoints}
                custom={data.customCharmPoints}
                onSelected={(selectedCharmPoints) => setData((current) => ({ ...current, selectedCharmPoints }))}
                onCustom={(customCharmPoints) => setData((current) => ({ ...current, customCharmPoints }))}
                step="2 / 3"
                back={back}
                next={next}
              />
            )}
            {screen === 'preferences' && (
              <TagScreen
                screenConfig={config.firstImpression.preferences}
                selected={data.selectedPreferences}
                custom={data.customPreferences}
                onSelected={(selectedPreferences) => setData((current) => ({ ...current, selectedPreferences }))}
                onCustom={(customPreferences) => setData((current) => ({ ...current, customPreferences }))}
                note={config.firstImpression.preferences.developerNote}
                step="3 / 3"
                back={back}
                next={next}
              />
            )}
            {screen === 'valuesIntro' && <ValuesIntro config={config} back={back} next={next} />}
            {screen === 'question' && (
              <QuestionScreen
                config={config}
                data={data}
                setData={setData}
                questionIndex={questionIndex}
                back={back}
                next={next}
              />
            )}
            {screen === 'complete' && <CompleteScreen config={config} mode={mode} next={next} />}
            {isPostOnboardingScreen(screen) && <PostOnboardingPreview config={config} screen={screen} nickname={data.formValues.nickname ?? ''} mode={mode} onNavigate={setScreen} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function MatchingScreen({ config, data, setData, setMode, next }: {
  config: OnboardingConfig
  data: PrototypeData
  setData: Dispatch<SetStateAction<PrototypeData>>
  setMode: (mode: MatchingMode) => void
  next: () => void
}) {
  const content = config.matchingMode
  return (
    <ScreenBody footer={<PhoneButton onClick={next}>{content.cta}</PhoneButton>}>
      <p className="phone-eyebrow">{content.eyebrow}</p>
      <h1>{content.headline}</h1>
      <p className="phone-description">{content.description}</p>
      <div className="mode-cards">
        {content.options.map((option) => {
          const selected = data.matchingMode === option.id
          return (
            <button
              className={`mode-card ${selected ? 'is-selected' : ''}`}
              key={option.id}
              onClick={() => {
                setMode(option.id)
                setData((current) => ({ ...current, matchingMode: option.id }))
              }}
            >
              <span className="mode-emoji">{option.emoji}</span>
              <span className="mode-copy">
                <small>{option.microcopy}</small>
                <b>{option.title}</b>
                <span>{option.description}</span>
              </span>
              <span className="fake-radio">{selected ? '●' : ''}</span>
            </button>
          )
        })}
      </div>
      <p className="change-note">↻ {content.bottomNote}</p>
    </ScreenBody>
  )
}

function BasicScreen({ config, data, setData, back, next }: {
  config: OnboardingConfig; data: PrototypeData; setData: Dispatch<SetStateAction<PrototypeData>>; back: () => void; next: () => void
}) {
  const content = config.commonSignup.basic
  return (
    <ScreenBody header={<PhoneHeader title={content.header} onBack={back} />} progress={{ eyebrow: content.eyebrow, value: 1, total: 2 }} footer={<PhoneButton onClick={next}>{content.cta}</PhoneButton>}>
      <h1>{content.headline}</h1>
      <p className="phone-description">{content.description}</p>
      <div className="phone-form">
        {content.fields.map((field) => (
          <label className="phone-field" key={field.id}>
            <span>{field.label}</span>
            <input
              placeholder={field.placeholder}
              value={data.formValues[field.id] ?? ''}
              onChange={(event) => setData((current) => ({ ...current, formValues: { ...current.formValues, [field.id]: event.target.value } }))}
            />
          </label>
        ))}
      </div>
      <p className="phone-warning">＊ {content.warning}</p>
    </ScreenBody>
  )
}

function VerifyScreen({ config, data, setData, back, next }: {
  config: OnboardingConfig; data: PrototypeData; setData: Dispatch<SetStateAction<PrototypeData>>; back: () => void; next: () => void
}) {
  const content = config.commonSignup.verification
  return (
    <ScreenBody header={<PhoneHeader title={content.header} onBack={back} />} progress={{ eyebrow: content.eyebrow, value: 2, total: 2 }} footer={<PhoneButton onClick={next}>{content.cta}</PhoneButton>}>
      <h1>{content.headline}</h1>
      <p className="phone-description">{content.description}</p>
      <div className="phone-form verify-form">
        <label className="phone-field"><span>{content.phoneLabel}</span><div className="inline-input"><input placeholder={content.phonePlaceholder} /><button onClick={() => setData((current) => ({ ...current, verificationSent: true }))}>{content.sendButton}</button></div></label>
        <label className="phone-field"><span>{content.codeLabel}</span><div className="inline-input"><input disabled={!data.verificationSent} placeholder={content.codePlaceholder} /><button disabled={!data.verificationSent} onClick={() => setData((current) => ({ ...current, verificationDone: true }))}>{data.verificationDone ? '확인됨' : content.verifyButton}</button></div></label>
      </div>
      <p className="prototype-flag">PROTOTYPE · {content.helper}</p>
    </ScreenBody>
  )
}

function PhotoScreen({ config, photoUrls, setPhotoUrls, back, next }: {
  config: OnboardingConfig; photoUrls: Array<string | null>; setPhotoUrls: Dispatch<SetStateAction<Array<string | null>>>; back: () => void; next: () => void
}) {
  const content = config.firstImpression.photo
  const fileRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]
  const labels = [content.mainLabel, ...content.extraLabels]
  const choose = (index: number, file?: File) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPhotoUrls((current) => current.map((item, itemIndex) => itemIndex === index ? url : item))
  }
  return (
    <ScreenBody header={<PhoneHeader title={config.firstImpression.profileTitle} onBack={back} />} progress={{ eyebrow: content.eyebrow, value: 1, total: 3 }} footer={<PhoneButton onClick={next}>{content.cta}</PhoneButton>}>
      <h1>{content.headline}</h1>
      <p className="phone-description">{content.description}</p>
      <div className="photo-grid">
        {labels.map((label, index) => (
          <div className={`photo-slot slot-${index}`} key={`${label}-${index}`}>
            <input ref={fileRefs[index]} hidden type="file" accept="image/*" onChange={(event) => choose(index, event.target.files?.[0])} />
            {photoUrls[index] ? <img src={photoUrls[index] ?? ''} alt="선택한 미리보기" /> : <button onClick={() => fileRefs[index].current?.click()}><b>＋</b><span>{label}</span></button>}
            {photoUrls[index] && <div className="photo-actions"><button onClick={() => fileRefs[index].current?.click()}>교체</button><button onClick={() => setPhotoUrls((current) => current.map((item, itemIndex) => itemIndex === index ? null : item))}>삭제</button></div>}
          </div>
        ))}
      </div>
      <div className="photo-guide"><b>{content.guideTitle}</b>{content.guideItems.map((item, index) => <span key={`${item}-${index}`}>· {item}</span>)}</div>
    </ScreenBody>
  )
}

function TagScreen({ screenConfig, selected, custom, onSelected, onCustom, note, step, back, next }: {
  screenConfig: TagScreenConfig; selected: string[]; custom: string[]; onSelected: (items: string[]) => void; onCustom: (items: string[]) => void; note?: DeveloperNoteConfig; step: string; back: () => void; next: () => void
}) {
  const [draft, setDraft] = useState('')
  const toggle = (id: string) => {
    if (selected.includes(id)) onSelected(selected.filter((item) => item !== id))
    else if (selected.length < screenConfig.maxSelection) onSelected([...selected, id])
  }
  const addCustom = () => {
    const value = draft.trim()
    if (!value || custom.includes(value) || selected.length >= screenConfig.maxSelection) return
    onCustom([...custom, value])
    onSelected([...selected, `custom:${value}`])
    setDraft('')
  }
  const tags = [...screenConfig.tags, ...custom.map((label) => ({ id: `custom:${label}`, label }))]
  return (
    <ScreenBody header={<PhoneHeader title={screenConfig.header} onBack={back} />} progress={{ eyebrow: screenConfig.eyebrow, value: Number(step[0]), total: 3 }} footer={<PhoneButton onClick={next}>{screenConfig.cta}</PhoneButton>}>
      <h1>{screenConfig.headline}</h1>
      <p className="phone-description">{screenConfig.description}</p>
      {note && <DeveloperNote note={note} />}
      <div className="tag-meta">선택 {selected.length} / {screenConfig.maxSelection}</div>
      <div className="phone-tags">{tags.map((tag) => <button className={selected.includes(tag.id) ? 'is-selected' : ''} key={tag.id} onClick={() => toggle(tag.id)}>{tag.label}</button>)}</div>
      {screenConfig.allowCustom && <div className="custom-tag-input"><input maxLength={screenConfig.customMaxLength} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={screenConfig.customPlaceholder} /><button onClick={addCustom}>추가</button></div>}
    </ScreenBody>
  )
}

function ValuesIntro({ config, back, next }: { config: OnboardingConfig; back: () => void; next: () => void }) {
  const content = config.values.intro
  return (
    <ScreenBody header={<PhoneHeader title={config.values.profileTitle} onBack={back} />} progress={{ eyebrow: content.eyebrow, value: 0, total: config.values.questions.length }} footer={<PhoneButton accent onClick={next}>{content.cta}</PhoneButton>}>
      <h1>{content.headline}</h1>
      <p className="phone-description">{content.description}</p>
      <DeveloperNote note={content.developerNote} />
      <div className="question-summary"><b>{config.values.questions.length}</b><span>문항 수는 Editor에서 자유롭게 바뀝니다.</span></div>
    </ScreenBody>
  )
}

function QuestionScreen({ config, data, setData, questionIndex, back, next }: {
  config: OnboardingConfig; data: PrototypeData; setData: Dispatch<SetStateAction<PrototypeData>>; questionIndex: number; back: () => void; next: () => void
}) {
  const safeIndex = Math.min(questionIndex, Math.max(0, config.values.questions.length - 1))
  const current = config.values.questions[safeIndex]
  if (!current) return <ScreenBody><p>질문을 하나 추가해주세요.</p></ScreenBody>
  const selected = data.answers[current.id]
  return (
    <ScreenBody header={<PhoneHeader title={config.values.profileTitle} onBack={back} />} progress={{ eyebrow: `${config.values.questionEyebrow} · ${categoryLabel[current.category]}`, value: safeIndex + 1, total: config.values.questions.length }} footer={<PhoneButton accent onClick={next}>{safeIndex === config.values.questions.length - 1 ? config.values.finishQuestionCta : config.values.nextQuestionCta}</PhoneButton>}>
      <p className="phone-description">{config.values.questionHelper}</p>
      <div className="question-card"><small>질문 {String(safeIndex + 1).padStart(2, '0')} · {current.topic}</small><h2>{current.question}</h2>{current.description && <p>{current.description}</p>}</div>
      {current.developerNote && <p className="question-inline-note">{current.developerNote}</p>}
      <div className="question-options">{current.options.map((option) => <button className={selected === option.id ? 'is-selected' : ''} key={option.id} onClick={() => setData((state) => ({ ...state, answers: { ...state.answers, [current.id]: option.id } }))}><span className="option-radio">{selected === option.id ? '●' : ''}</span>{option.label}</button>)}</div>
    </ScreenBody>
  )
}

function CompleteScreen({ config, mode, next }: { config: OnboardingConfig; mode: MatchingMode; next: () => void }) {
  const isValues = mode === 'values'
  return <ScreenBody footer={<PhoneButton accent={isValues} onClick={next}>{config.complete.cta}</PhoneButton>}><div className="complete-mark">{isValues ? '☕' : '⚡'}</div><p className="phone-eyebrow">{isValues ? config.complete.valuesEyebrow : config.complete.firstEyebrow}</p><h1>{isValues ? config.complete.valuesHeadline : config.complete.firstHeadline}</h1><p className="phone-description">{isValues ? config.complete.valuesDescription : config.complete.firstDescription}</p></ScreenBody>
}

function DeveloperNote({ note }: { note: DeveloperNoteConfig }) {
  if (!note.enabled) return null
  return <aside className="developer-note" style={{ fontFamily: fontStack(note.font), fontSize: note.fontSize, textAlign: note.align, background: note.background, borderColor: note.border, transform: `rotate(${note.rotation}deg)` }}><b>{note.showEmoji ? '✎ ' : ''}{note.label}</b><p>{note.text}</p></aside>
}

function PhoneHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return <header className="phone-header"><button aria-label="이전 화면" onClick={onBack}>‹</button><b>{title}</b><span /></header>
}

function PhoneButton({ children, onClick, accent = false }: { children: string; onClick: () => void; accent?: boolean }) {
  return <button className={`phone-cta ${accent ? 'is-accent' : ''}`} onClick={onClick}>{children}</button>
}

function ScreenBody({ children, header, progress, footer }: { children: React.ReactNode; header?: React.ReactNode; progress?: { eyebrow: string; value: number; total: number }; footer?: React.ReactNode }) {
  return <div className="phone-screen">{header}{progress && <div className="phone-progress"><div><span>{progress.eyebrow}</span><b>{progress.value} / {progress.total}</b></div><i><em style={{ width: `${progress.total ? (progress.value / progress.total) * 100 : 0}%` }} /></i></div>}<main>{children}</main>{footer && <footer>{footer}</footer>}</div>
}
