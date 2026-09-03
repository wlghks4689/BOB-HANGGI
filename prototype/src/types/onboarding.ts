export type ScreenId =
  | 'matching'
  | 'basic'
  | 'verify'
  | 'photo'
  | 'charms'
  | 'preferences'
  | 'valuesIntro'
  | 'question'
  | 'complete'
  | 'serviceGuide'
  | 'home'
  | 'chat'
  | 'chatRoom'
  | 'feed'
  | 'profile'

export type MatchingMode = 'first_impression' | 'values'
export type QuestionCategory = 'values' | 'lifestyle' | 'love'
export type FontChoice = 'sans' | 'serif' | 'mono' | 'hand'
export type TextAlignChoice = 'left' | 'center' | 'right'

export type DeveloperNoteConfig = {
  enabled: boolean
  label: string
  text: string
  font: FontChoice
  fontSize: number
  align: TextAlignChoice
  background: string
  border: string
  rotation: number
  showEmoji: boolean
}

export type TagItem = {
  id: string
  label: string
}

export type TagScreenConfig = {
  header: string
  eyebrow: string
  headline: string
  description: string
  cta: string
  tags: TagItem[]
  minSelection: number
  maxSelection: number
  allowCustom: boolean
  customMaxLength: number
  customPlaceholder: string
}

export type QuestionOption = {
  id: string
  label: string
}

export type QuestionConfig = {
  id: string
  category: QuestionCategory
  topic: string
  question: string
  description: string
  developerNote: string
  options: QuestionOption[]
}

export type DesignTokens = {
  primary: string
  accent: string
  background: string
  surface: string
  text: string
  mutedText: string
  border: string
  cardRadius: number
  buttonRadius: number
  tagRadius: number
  cardBorderWidth: number
  shadow: boolean
  spacingDensity: number
  headlineFont: FontChoice
  bodyFont: FontChoice
  headlineSize: number
  bodySize: number
  controlSize: number
}

export type GuidePoint = {
  id: string
  icon: string
  title: string
  description: string
}

export type ChatRoomPreview = {
  id: string
  name: string
  preview: string
  time: string
  status: string
}

export type ChatMessageConfig = {
  id: string
  side: 'system' | 'theirs' | 'mine'
  text: string
  time: string
}

export type FeedPostConfig = {
  id: string
  category: string
  title: string
  body: string
  meta: string
}

export type PostOnboardingConfig = {
  navigation: {
    home: string
    chat: string
    feed: string
    profile: string
  }
  guide: {
    eyebrow: string
    headline: string
    description: string
    points: GuidePoint[]
    operatorLabel: string
    operatorTitle: string
    operatorDescription: string
    helper: string
    cta: string
  }
  home: {
    eyebrow: string
    greeting: string
    description: string
    statusLabel: string
    statusTitle: string
    statusDescription: string
    operatorLabel: string
    operatorTitle: string
    operatorDescription: string
    operatorCta: string
    updatesTitle: string
    updates: string[]
  }
  chat: {
    eyebrow: string
    headline: string
    description: string
    operatorTitle: string
    operatorDescription: string
    operatorCta: string
    rooms: ChatRoomPreview[]
    emptyText: string
  }
  chatRoom: {
    title: string
    subtitle: string
    systemNotice: string
    inputPlaceholder: string
    sendButton: string
    messages: ChatMessageConfig[]
  }
  feed: {
    eyebrow: string
    headline: string
    description: string
    posts: FeedPostConfig[]
  }
  profile: {
    eyebrow: string
    headline: string
    status: string
    summaryTitle: string
    matchingModeLabel: string
    operatorMatchLabel: string
    operatorMatchValue: string
    menuTitle: string
    menuItems: string[]
  }
}

export type OnboardingConfig = {
  schemaVersion: 1
  brand: {
    name: string
    labTitle: string
  }
  matchingMode: {
    eyebrow: string
    headline: string
    description: string
    options: Array<{
      id: MatchingMode
      emoji: string
      title: string
      description: string
      microcopy: string
    }>
    bottomNote: string
    cta: string
  }
  commonSignup: {
    basic: {
      header: string
      eyebrow: string
      headline: string
      description: string
      fields: Array<{ id: string; label: string; placeholder: string }>
      warning: string
      cta: string
    }
    verification: {
      header: string
      eyebrow: string
      headline: string
      description: string
      phoneLabel: string
      phonePlaceholder: string
      sendButton: string
      codeLabel: string
      codePlaceholder: string
      verifyButton: string
      helper: string
      cta: string
    }
  }
  firstImpression: {
    profileTitle: string
    photo: {
      eyebrow: string
      headline: string
      description: string
      mainLabel: string
      extraLabels: [string, string]
      guideTitle: string
      guideItems: string[]
      cta: string
    }
    charms: TagScreenConfig
    preferences: TagScreenConfig & { developerNote: DeveloperNoteConfig }
  }
  values: {
    profileTitle: string
    intro: {
      eyebrow: string
      headline: string
      description: string
      cta: string
      developerNote: DeveloperNoteConfig
    }
    questionEyebrow: string
    questionHelper: string
    nextQuestionCta: string
    finishQuestionCta: string
    questions: QuestionConfig[]
  }
  complete: {
    firstEyebrow: string
    firstHeadline: string
    firstDescription: string
    valuesEyebrow: string
    valuesHeadline: string
    valuesDescription: string
    cta: string
  }
  postOnboarding: PostOnboardingConfig
  design: DesignTokens
}

export type PrototypeData = {
  matchingMode: MatchingMode
  formValues: Record<string, string>
  verificationSent: boolean
  verificationDone: boolean
  selectedCharmPoints: string[]
  selectedPreferences: string[]
  customCharmPoints: string[]
  customPreferences: string[]
  answers: Record<string, string>
}

export type SavedSnapshot = {
  id: string
  name: string
  createdAt: string
  config: OnboardingConfig
}
