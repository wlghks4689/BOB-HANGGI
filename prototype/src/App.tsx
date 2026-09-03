import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import './App.css'
import { ContentEditor } from './editor/ContentEditor'
import { DesignEditor } from './editor/DesignEditor'
import { freshConfig, normalizeConfig } from './config/default-onboarding-config'
import { Preview } from './prototype/Preview'
import {
  clearConfig,
  isOnboardingConfig,
  loadConfig,
  loadSnapshots,
  saveConfig,
  saveSnapshots,
} from './storage/prototype-storage'
import type {
  MatchingMode,
  OnboardingConfig,
  PrototypeData,
  SavedSnapshot,
  ScreenId,
} from './types/onboarding'
import { ALL_SCREENS, cloneConfig, SCREEN_GROUPS, uid } from './utils/config'

type EditorTab = 'content' | 'design' | 'flow' | 'data'
type ViewMode = 'preview' | 'edit'

const initialData: PrototypeData = {
  matchingMode: 'first_impression',
  formValues: {},
  verificationSent: false,
  verificationDone: false,
  selectedCharmPoints: [],
  selectedPreferences: [],
  customCharmPoints: [],
  customPreferences: [],
  answers: {},
}

function App() {
  const [config, setConfig] = useState<OnboardingConfig>(() => {
    const saved = loadConfig()
    return saved && isOnboardingConfig(saved) ? normalizeConfig(saved) : freshConfig()
  })
  const [screen, setScreen] = useState<ScreenId>('matching')
  const [mode, setModeState] = useState<MatchingMode>('first_impression')
  const [width, setWidth] = useState(390)
  const [viewMode, setViewMode] = useState<ViewMode>('edit')
  const [editorTab, setEditorTab] = useState<EditorTab>('content')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [data, setData] = useState<PrototypeData>(initialData)
  const [photoUrls, setPhotoUrls] = useState<Array<string | null>>([null, null, null])
  const [snapshots, setSnapshots] = useState<SavedSnapshot[]>(() => loadSnapshots())
  const [snapshotOpen, setSnapshotOpen] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSaveStatus('saving')
    const timer = window.setTimeout(() => {
      saveConfig(config)
      setSaveStatus('saved')
    }, 500)
    return () => window.clearTimeout(timer)
  }, [config])

  useEffect(() => {
    if (questionIndex >= config.values.questions.length) {
      setQuestionIndex(Math.max(0, config.values.questions.length - 1))
    }
  }, [config.values.questions.length, questionIndex])

  const setMode = (value: MatchingMode) => {
    setModeState(value)
    setData((current) => ({ ...current, matchingMode: value }))
  }

  const flow = useMemo<ScreenId[]>(() => mode === 'first_impression'
    ? ['matching', 'basic', 'verify', 'photo', 'charms', 'preferences', 'complete', 'serviceGuide', 'home', 'chat', 'chatRoom', 'feed', 'profile']
    : ['matching', 'basic', 'verify', 'valuesIntro', 'question', 'complete', 'serviceGuide', 'home', 'chat', 'chatRoom', 'feed', 'profile'], [mode])

  const devPrevious = () => {
    if (screen === 'question' && questionIndex > 0) return setQuestionIndex((index) => index - 1)
    const index = flow.indexOf(screen)
    if (index > 0) setScreen(flow[index - 1])
  }

  const devNext = () => {
    if (screen === 'question' && questionIndex < config.values.questions.length - 1) return setQuestionIndex((index) => index + 1)
    const index = flow.indexOf(screen)
    if (index >= 0 && index < flow.length - 1) setScreen(flow[index + 1])
  }

  const importConfig = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as unknown
      if (!isOnboardingConfig(parsed)) throw new Error('invalid config')
      setConfig(normalizeConfig(parsed))
      setQuestionIndex(0)
      window.alert('기획안을 불러왔습니다.')
    } catch {
      window.alert('지원하지 않는 JSON입니다. onboarding-config.json 형식을 확인해주세요.')
    }
  }

  const reset = () => {
    if (!window.confirm('현재 수정한 기획안을 지우고 초기 Seed로 되돌릴까요?')) return
    clearConfig()
    setConfig(freshConfig())
    setScreen('matching')
    setQuestionIndex(0)
    setData(initialData)
    setPhotoUrls([null, null, null])
  }

  const createSnapshot = () => {
    const name = window.prompt('버전 이름을 입력해주세요.', `${new Date().getMonth() + 1}/${new Date().getDate()} 초안`)
    if (!name?.trim()) return
    const next = [{ id: uid('snapshot'), name: name.trim(), createdAt: new Date().toISOString(), config: cloneConfig(config) }, ...snapshots]
    setSnapshots(next)
    saveSnapshots(next)
    setSnapshotOpen(true)
  }

  const restoreSnapshot = (snapshot: SavedSnapshot) => {
    if (!window.confirm(`“${snapshot.name}” 버전으로 현재 편집 내용을 교체할까요?`)) return
    setConfig(normalizeConfig(cloneConfig(snapshot.config)))
  }

  const removeSnapshot = (id: string) => {
    if (!window.confirm('이 버전 기록을 삭제할까요?')) return
    const next = snapshots.filter((item) => item.id !== id)
    setSnapshots(next)
    saveSnapshots(next)
  }

  const currentLabel = ALL_SCREENS.find((item) => item.id === screen)?.label ?? screen
  const exportHref = useMemo(
    () => `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(config, null, 2))}`,
    [config],
  )

  return (
    <div className="lab-app">
      <header className="lab-header">
        <div className="lab-brand"><span>잘되면 밥한끼</span><b>ONBOARDING LAB</b><i>기획용 · 브라우저에만 저장</i></div>
        <div className="view-switch" role="tablist"><button className={viewMode === 'preview' ? 'is-active' : ''} onClick={() => setViewMode('preview')}>PREVIEW</button><button className={viewMode === 'edit' ? 'is-active' : ''} onClick={() => setViewMode('edit')}>EDIT</button></div>
        <div className="header-actions">
          <span className={`save-status ${saveStatus}`}>{saveStatus === 'saved' ? '저장됨 ✓' : '저장 중…'}</span>
          <a className="action-link" download="onboarding-config.json" href={exportHref}>기획안 내보내기</a>
          <button onClick={() => importRef.current?.click()}>기획안 불러오기</button>
          <input hidden ref={importRef} type="file" accept="application/json,.json" onChange={importConfig} />
          <button onClick={createSnapshot}>현재 버전 저장</button>
          <button className="quiet-danger" onClick={reset}>초기안으로</button>
        </div>
      </header>

      {snapshotOpen && <div className="snapshot-bar"><div><b>VERSION SNAPSHOTS</b><span>최대 12개를 이 브라우저에 저장합니다.</span></div><div className="snapshot-list">{snapshots.length === 0 && <em>저장한 버전이 없습니다.</em>}{snapshots.map((snapshot) => <div key={snapshot.id}><button onClick={() => restoreSnapshot(snapshot)}><b>{snapshot.name}</b><small>{new Date(snapshot.createdAt).toLocaleString('ko-KR')}</small></button><button aria-label={`${snapshot.name} 삭제`} onClick={() => removeSnapshot(snapshot.id)}>×</button></div>)}</div><button onClick={() => setSnapshotOpen(false)}>닫기</button></div>}

      <div className={`lab-workspace ${viewMode === 'preview' ? 'is-preview-only' : ''}`}>
        <section className="preview-panel">
          <div className="panel-title"><div><span>MOBILE PREVIEW</span><b>{currentLabel}</b></div><p>실제 버튼을 누르거나 아래 도구로 빠르게 이동하세요.</p></div>
          <div className="preview-toolbar">
            <div><span>WIDTH</span>{[360, 375, 390, 430].map((item) => <button className={width === item ? 'is-active' : ''} key={item} onClick={() => setWidth(item)}>{item}</button>)}</div>
            <label><span>MODE</span><select value={mode} onChange={(event) => setMode(event.target.value as MatchingMode)}><option value="first_impression">FIRST IMPRESSION</option><option value="values">VALUES</option></select></label>
            {screen === 'question' && <label><span>QUESTION</span><select value={questionIndex} onChange={(event) => setQuestionIndex(Number(event.target.value))}>{config.values.questions.map((question, index) => <option value={index} key={question.id}>{index + 1}. {question.topic}</option>)}</select></label>}
          </div>
          <Preview config={config} screen={screen} setScreen={setScreen} mode={mode} setMode={setMode} width={width} data={data} setData={setData} questionIndex={questionIndex} setQuestionIndex={setQuestionIndex} photoUrls={photoUrls} setPhotoUrls={setPhotoUrls} />
          <div className="dev-navigation"><button disabled={screen === 'matching'} onClick={devPrevious}>← 이전 화면</button><span>{currentLabel}{screen === 'question' ? ` · ${questionIndex + 1}/${config.values.questions.length}` : ''}</span><button disabled={screen === 'profile'} onClick={devNext}>다음 화면 →</button></div>
        </section>

        {viewMode === 'edit' && <section className="editor-panel">
          <ScreenNavigator screen={screen} setScreen={(id) => { setScreen(id); setEditorTab('content') }} />
          <div className="editor-main">
            <div className="editor-tabs"><button className={editorTab === 'content' ? 'is-active' : ''} onClick={() => setEditorTab('content')}>CONTENT</button><button className={editorTab === 'design' ? 'is-active' : ''} onClick={() => setEditorTab('design')}>DESIGN</button><button className={editorTab === 'flow' ? 'is-active' : ''} onClick={() => setEditorTab('flow')}>FLOW</button><button className={editorTab === 'data' ? 'is-active' : ''} onClick={() => setEditorTab('data')}>DATA</button></div>
            <div className="editor-scroll">
              {editorTab === 'content' && <ContentEditor config={config} setConfig={setConfig} screen={screen} questionIndex={questionIndex} setQuestionIndex={setQuestionIndex} />}
              {editorTab === 'design' && <DesignEditor value={config.design} onChange={(design) => setConfig((current) => ({ ...current, design }))} />}
              {editorTab === 'flow' && <FlowMap screen={screen} setScreen={setScreen} />}
              {editorTab === 'data' && <DataDebug data={data} photoUrls={photoUrls} questionIndex={questionIndex} screen={screen} />}
            </div>
          </div>
        </section>}
      </div>
    </div>
  )
}

function ScreenNavigator({ screen, setScreen }: { screen: ScreenId; setScreen: (screen: ScreenId) => void }) {
  return <nav className="screen-navigator"><h2>SCREENS</h2>{SCREEN_GROUPS.map((group) => <div key={group.title}><b>{group.title}</b>{group.screens.map((item) => <button className={screen === item.id ? 'is-active' : ''} key={item.id} onClick={() => setScreen(item.id)}>{item.label}</button>)}</div>)}</nav>
}

function FlowMap({ screen, setScreen }: { screen: ScreenId; setScreen: (screen: ScreenId) => void }) {
  const node = (id: ScreenId, label: string) => <button className={screen === id ? 'is-active' : ''} onClick={() => setScreen(id)}>{label}</button>
  return <div className="flow-map"><div className="flow-intro"><h3>FLOW MAP</h3><p>노드를 누르면 Preview가 해당 화면으로 이동합니다.</p></div>{node('matching', 'START · MODE')}<i>↓</i>{node('basic', 'BASIC INFO')}<i>↓</i>{node('verify', 'VERIFY')}<i>↙︎　　↘︎</i><div className="flow-branches"><div>{node('photo', 'PHOTO')}<i>↓</i>{node('charms', 'CHARMS')}<i>↓</i>{node('preferences', 'PREFERENCE')}</div><div>{node('valuesIntro', 'VALUES INTRO')}<i>↓</i>{node('question', 'QUESTIONS')}</div></div><i>↘︎　　↙︎</i>{node('complete', 'COMPLETE')}</div>
}

function DataDebug({ data, photoUrls, questionIndex, screen }: { data: PrototypeData; photoUrls: Array<string | null>; questionIndex: number; screen: ScreenId }) {
  return <div className="data-debug"><h3>PROTOTYPE DATA</h3><p>기획 Config가 아니라 Preview에서 현재 선택·입력한 체험 데이터입니다.</p><pre>{JSON.stringify({ currentScreen: screen, currentQuestionIndex: questionIndex, photoCount: photoUrls.filter(Boolean).length, ...data }, null, 2)}</pre></div>
}

export default App
