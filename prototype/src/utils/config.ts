import type { FontChoice, OnboardingConfig, ScreenId } from '../types/onboarding'

export const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`

export const cloneConfig = (config: OnboardingConfig): OnboardingConfig =>
  JSON.parse(JSON.stringify(config)) as OnboardingConfig

export const fontStack = (font: FontChoice) => {
  const stacks: Record<FontChoice, string> = {
    sans: "Pretendard, 'Noto Sans KR', 'Segoe UI', sans-serif",
    serif: "'Noto Serif KR', Georgia, serif",
    mono: "'D2Coding', 'SFMono-Regular', Consolas, monospace",
    hand: "'Nanum Pen Script', 'Segoe Print', cursive",
  }
  return stacks[font]
}

export const SCREEN_GROUPS: Array<{
  title: string
  screens: Array<{ id: ScreenId; label: string }>
}> = [
  { title: 'INTRO', screens: [{ id: 'matching', label: '01 만남 방식 선택' }] },
  {
    title: 'COMMON',
    screens: [
      { id: 'basic', label: '02 기본 정보' },
      { id: 'verify', label: '03 본인 인증' },
    ],
  },
  {
    title: 'FIRST IMPRESSION',
    screens: [
      { id: 'photo', label: '04 사진' },
      { id: 'charms', label: '05 나의 매력' },
      { id: 'preferences', label: '06 상대 선호' },
    ],
  },
  {
    title: 'VALUES',
    screens: [
      { id: 'valuesIntro', label: '07 가치관 시작' },
      { id: 'question', label: '08 질문' },
    ],
  },
  { title: 'END', screens: [{ id: 'complete', label: '09 프로필 완료' }] },
  { title: 'SERVICE START', screens: [{ id: 'serviceGuide', label: '10 이용 안내 팝업' }] },
  {
    title: 'APP',
    screens: [
      { id: 'home', label: '11 홈' },
      { id: 'chat', label: '12 채팅' },
      { id: 'chatRoom', label: '13 채팅방' },
      { id: 'feed', label: '14 피드' },
      { id: 'profile', label: '15 마이 프로필' },
    ],
  },
]

export const ALL_SCREENS = SCREEN_GROUPS.flatMap((group) => group.screens)

export const isPostOnboardingScreen = (screen: ScreenId) =>
  ['serviceGuide', 'home', 'chat', 'chatRoom', 'feed', 'profile'].includes(screen)
