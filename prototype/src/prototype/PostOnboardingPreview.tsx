import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import type { MatchingMode, OnboardingConfig, ScreenId } from '../types/onboarding'

type Props = {
  config: OnboardingConfig
  screen: ScreenId
  nickname: string
  mode: MatchingMode
  onNavigate: (screen: ScreenId) => void
}

const personalize = (text: string, nickname: string) =>
  text.replaceAll('{nickname}', nickname.trim() || '밥친구')

export function PostOnboardingPreview({ config, screen, nickname, mode, onNavigate }: Props) {
  const [draft, setDraft] = useState('')
  const [sentMessages, setSentMessages] = useState<string[]>([])
  const content = config.postOnboarding

  const sendMessage = (event: FormEvent) => {
    event.preventDefault()
    const message = draft.trim()
    if (!message) return
    setSentMessages((current) => [...current, message])
    setDraft('')
  }

  if (screen === 'serviceGuide') {
    const guide = content.guide
    return <div className="phone-screen service-guide-screen">
      <div className="guide-ghost-home"><span>잘되면 밥한끼</span><b>오늘의 소개를 준비하고 있어요.</b><i /></div>
      <main className="service-guide-backdrop">
        <section className="service-guide-sheet" aria-label="서비스 이용 안내">
          <div className="guide-handle" />
          <p className="service-eyebrow">{guide.eyebrow}</p>
          <h1>{guide.headline}</h1>
          <p className="service-copy">{guide.description}</p>
          <div className="guide-points">
            {guide.points.map((point) => <article key={point.id}><span>{point.icon}</span><div><b>{point.title}</b><p>{point.description}</p></div></article>)}
          </div>
          <aside className="operator-explainer"><small>{guide.operatorLabel}</small><b>{guide.operatorTitle}</b><p>{guide.operatorDescription}</p></aside>
          <p className="guide-helper">＊ {guide.helper}</p>
          <button className="service-primary" onClick={() => onNavigate('home')}>{guide.cta}</button>
        </section>
      </main>
    </div>
  }

  if (screen === 'home') {
    const home = content.home
    return <AppFrame active="home" config={config} onNavigate={onNavigate}>
      <p className="service-eyebrow">{home.eyebrow}</p>
      <h1>{personalize(home.greeting, nickname)}</h1>
      <p className="service-copy">{home.description}</p>
      <article className="home-status-card">
        <small>{home.statusLabel}</small><b>{home.statusTitle}</b><p>{home.statusDescription}</p><i><em /></i>
      </article>
      <article className="home-operator-card">
        <span>{home.operatorLabel}</span><h2>{home.operatorTitle}</h2><p>{home.operatorDescription}</p>
        <button onClick={() => onNavigate('serviceGuide')}>{home.operatorCta} →</button>
      </article>
      <section className="home-updates"><h2>{home.updatesTitle}</h2>{home.updates.map((update, index) => <div key={`${update}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><p>{update}</p></div>)}</section>
    </AppFrame>
  }

  if (screen === 'chat') {
    const chat = content.chat
    return <AppFrame active="chat" config={config} onNavigate={onNavigate}>
      <p className="service-eyebrow">{chat.eyebrow}</p>
      <h1>{chat.headline}</h1>
      <p className="service-copy">{chat.description}</p>
      <button className="operator-chat-card" onClick={() => onNavigate('serviceGuide')}>
        <span className="operator-avatar">B</span><span><b>{chat.operatorTitle}</b><small>{chat.operatorDescription}</small><em>{chat.operatorCta} →</em></span>
      </button>
      <div className="chat-room-list">
        {chat.rooms.length === 0 && <p className="service-empty">{chat.emptyText}</p>}
        {chat.rooms.map((room, index) => <button key={room.id} onClick={() => onNavigate('chatRoom')}>
          <span className={`chat-avatar avatar-${index % 3}`}>{room.name.slice(0, 1)}</span>
          <span className="chat-room-copy"><b>{room.name}</b><small>{room.preview}</small></span>
          <span className="chat-room-meta"><time>{room.time}</time><em>{room.status}</em></span>
        </button>)}
      </div>
    </AppFrame>
  }

  if (screen === 'chatRoom') {
    const room = content.chatRoom
    return <AppFrame active="chat" config={config} onNavigate={onNavigate} compact mainClassName="chat-room-main" header={<header className="service-room-header"><button aria-label="채팅 목록으로" onClick={() => onNavigate('chat')}>‹</button><div><b>{room.title}</b><small>{room.subtitle}</small></div><span>•••</span></header>}>
      <p className="chat-system-notice">{room.systemNotice}</p>
      <div className="message-thread">
        {room.messages.map((message) => message.side === 'system'
          ? <div className="message-system" key={message.id}><span>{message.text}</span><time>{message.time}</time></div>
          : <div className={`message-row is-${message.side}`} key={message.id}><p>{message.text}</p><time>{message.time}</time></div>)}
        {sentMessages.map((message, index) => <div className="message-row is-mine" key={`${message}-${index}`}><p>{message}</p><time>지금</time></div>)}
      </div>
      <form className="chat-composer" onSubmit={sendMessage}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={room.inputPlaceholder} /><button>{room.sendButton}</button></form>
    </AppFrame>
  }

  if (screen === 'feed') {
    const feed = content.feed
    return <AppFrame active="feed" config={config} onNavigate={onNavigate}>
      <p className="service-eyebrow">{feed.eyebrow}</p>
      <h1>{feed.headline}</h1>
      <p className="service-copy">{feed.description}</p>
      <div className="feed-list">{feed.posts.map((post, index) => <article key={post.id} className={`feed-post post-${index % 3}`}><small>{post.category}</small><h2>{post.title}</h2><p>{post.body}</p><footer>{post.meta}<span>읽기 →</span></footer></article>)}</div>
    </AppFrame>
  }

  const profile = content.profile
  const matchingLabel = mode === 'first_impression' ? config.matchingMode.options[0].title : config.matchingMode.options[1].title
  return <AppFrame active="profile" config={config} onNavigate={onNavigate}>
    <p className="service-eyebrow">{profile.eyebrow}</p>
    <h1>{personalize(profile.headline, nickname)}</h1>
    <div className="profile-ticket">
      <div className="profile-ticket-head"><span>{(nickname.trim() || '밥친구').slice(0, 1)}</span><div><b>{nickname.trim() || '밥친구'}</b><small>{profile.status}</small></div><em>PROFILE</em></div>
      <h2>{profile.summaryTitle}</h2>
      <dl><div><dt>{profile.matchingModeLabel}</dt><dd>{matchingLabel}</dd></div><div><dt>{profile.operatorMatchLabel}</dt><dd>{profile.operatorMatchValue}</dd></div></dl>
    </div>
    <section className="profile-menu"><h2>{profile.menuTitle}</h2>{profile.menuItems.map((item, index) => <button key={`${item}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span>{item}<b>›</b></button>)}</section>
  </AppFrame>
}

function AppFrame({ active, config, onNavigate, children, header, compact = false, mainClassName = '' }: {
  active: 'home' | 'chat' | 'feed' | 'profile'
  config: OnboardingConfig
  onNavigate: (screen: ScreenId) => void
  children: ReactNode
  header?: ReactNode
  compact?: boolean
  mainClassName?: string
}) {
  return <div className={`phone-screen service-app-screen ${compact ? 'is-compact' : ''}`}>
    {header ?? <header className="service-brand-header"><b>잘되면 밥한끼</b><span>••</span></header>}
    <main className={mainClassName}>{children}</main>
    <footer><nav className="service-tabs" aria-label="앱 메뉴">
      <TabButton active={active === 'home'} icon="⌂" label={config.postOnboarding.navigation.home} onClick={() => onNavigate('home')} />
      <TabButton active={active === 'chat'} icon="◌" label={config.postOnboarding.navigation.chat} onClick={() => onNavigate('chat')} />
      <TabButton active={active === 'feed'} icon="✦" label={config.postOnboarding.navigation.feed} onClick={() => onNavigate('feed')} />
      <TabButton active={active === 'profile'} icon="☺" label={config.postOnboarding.navigation.profile} onClick={() => onNavigate('profile')} />
    </nav></footer>
  </div>
}

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: string; label: string; onClick: () => void }) {
  return <button className={active ? 'is-active' : ''} onClick={onClick}><span>{icon}</span><small>{label}</small></button>
}
