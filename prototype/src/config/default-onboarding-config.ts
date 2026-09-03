import type {
  DeveloperNoteConfig,
  OnboardingConfig,
  QuestionCategory,
  QuestionConfig,
} from '../types/onboarding'

const options = (...labels: string[]) =>
  labels.map((label, index) => ({ id: `option_${index + 1}`, label }))

const question = (
  id: string,
  category: QuestionCategory,
  topic: string,
  text: string,
  labels: string[],
): QuestionConfig => ({
  id,
  category,
  topic,
  question: text,
  description: '',
  developerNote: '',
  options: options(...labels),
})

const baseNote: DeveloperNoteConfig = {
  enabled: true,
  label: '개발자 한마디',
  text: '취향은 취향이니까 솔직하게 갑시다.\n저도 열심히 맞는 분을 찾아보겠습니다 :)',
  font: 'hand',
  fontSize: 14,
  align: 'left',
  background: '#fff1cf',
  border: '#2a252a',
  rotation: -1,
  showEmoji: false,
}

export const DEFAULT_ONBOARDING_CONFIG: OnboardingConfig = {
  schemaVersion: 1,
  brand: {
    name: '잘되면 밥한끼',
    labTitle: 'ONBOARDING LAB',
  },
  matchingMode: {
    eyebrow: '잘되면 밥한끼 · 시작 방식',
    headline: '어떤 만남으로 시작하시겠어요?',
    description: '지금 더 끌리는 시작을 골라주세요. 두 방식 모두 좋은 만남으로 이어질 수 있어요.',
    options: [
      {
        id: 'first_impression',
        emoji: '⚡',
        title: '첫눈에 끌리는 만남',
        description: '처음 느껴지는 분위기와 스타일도 중요한 만남의 시작이라고 생각해요.',
        microcopy: '분위기 · 스타일 · 첫인상',
      },
      {
        id: 'values',
        emoji: '☕',
        title: '대화로 깊어지는 만남',
        description: '어떤 이야기가 통하는지 알아보는 것부터 만남을 시작하고 싶어요.',
        microcopy: '대화 · 생활 · 연애관',
      },
    ],
    bottomNote: '가입 후에도 언제든 만남 방식을 변경할 수 있어요.',
    cta: '선택하고 시작하기',
  },
  commonSignup: {
    basic: {
      header: '가입하기',
      eyebrow: '공통 가입 단계 · 기본정보',
      headline: '기본 정보를 입력해 주세요.',
      description: '지금은 가입에 필요한 정보만 가볍게 받아볼게요.',
      fields: [
        { id: 'nickname', label: '닉네임', placeholder: '어떻게 불러드릴까요?' },
        { id: 'birthDate', label: '생년월일', placeholder: '예: 1997. 08. 08' },
        { id: 'gender', label: '성별', placeholder: '선택해주세요' },
        { id: 'region', label: '거주지역', placeholder: '예: 서울 · 마포구' },
      ],
      warning: '입력한 정보는 기획용 Preview 안에서만 사용합니다.',
      cta: '다음 단계로',
    },
    verification: {
      header: '본인 인증',
      eyebrow: '공통 가입 단계 · 본인인증',
      headline: '안전한 만남을 위해 본인 인증을 해주세요.',
      description: '이 화면은 인증 UX를 확인하기 위한 Prototype입니다.',
      phoneLabel: '휴대폰 번호',
      phonePlaceholder: '010-1234-5678',
      sendButton: '번호 전송',
      codeLabel: '인증번호',
      codePlaceholder: '인증번호 6자리',
      verifyButton: '인증 확인',
      helper: '실제 문자는 발송되지 않습니다.',
      cta: '인증 완료하고 다음으로',
    },
  },
  firstImpression: {
    profileTitle: '얼빠 & 금사빠 프로필',
    photo: {
      eyebrow: '첫눈에 끌리는 만남 · 프로필 만들기',
      headline: '첫인상을 중요하게 생각한다면 멋지고 예쁜 사진으로!',
      description: '나다운 분위기가 잘 보이는 사진을 등록해주세요.',
      mainLabel: '메인 사진',
      extraLabels: ['추가 사진 1', '추가 사진 2'],
      guideTitle: '어떤 사진이 좋은 프로필인가요?',
      guideItems: ['얼굴이 충분히 보이는 사진', '혼자 나온 사진 권장', '지나치게 강한 필터는 가볍게 줄이기'],
      cta: '사진 저장하고 다음으로',
    },
    charms: {
      header: '얼빠 & 금사빠 프로필',
      eyebrow: '첫눈에 끌리는 만남 · 프로필 만들기',
      headline: '나의 매력 포인트는?',
      description: '스스로 생각했을 때 나에게 가장 눈에 띄는 매력을 골라주세요.',
      cta: '선택하고 다음으로',
      tags: [
        '눈이 예뻐요', '피부가 좋아요', '스타일이 좋아요', '목소리가 매력적이에요',
        '체형이 좋아요', '미소가 자신 있어요', '어깨가 넓어요', '키가 큰 편이에요',
        '비율이 좋아요', '손이 예뻐요', '옷을 잘 입어요', '귀여운 인상이에요',
        '차분한 인상이에요', '동안이에요', '웃을 때 매력 있어요',
      ].map((label, index) => ({ id: `charm_${index + 1}`, label })),
      minSelection: 1,
      maxSelection: 5,
      allowCustom: true,
      customMaxLength: 25,
      customPlaceholder: '예: 보조개가 있어요',
    },
    preferences: {
      header: '얼빠 & 금사빠 프로필',
      eyebrow: '첫눈에 끌리는 만남 · 프로필 만들기',
      headline: '이성을 볼 때 가장 중요하게 생각하는 것!',
      description: '처음 만났을 때 자연스럽게 눈길이 가는 요소를 골라주세요.',
      cta: '프로필 만들기 완료',
      tags: [
        '얼굴', '눈', '미소', '키', '체형', '어깨', '패션 센스', '헤어스타일',
        '피부', '목소리', '청결감', '귀여운 인상', '성숙한 분위기', '운동한 체형', '전체적인 분위기',
      ].map((label, index) => ({ id: `preference_${index + 1}`, label })),
      minSelection: 1,
      maxSelection: 5,
      allowCustom: true,
      customMaxLength: 25,
      customPlaceholder: '예: 안경이 잘 어울리는 사람',
      developerNote: baseNote,
    },
  },
  values: {
    profileTitle: '가치관 & 내면 프로필',
    intro: {
      eyebrow: '대화로 깊어지는 만남 · 프로필 만들기',
      headline: '대화 코드, 가치관이 맞는 사람을 찾아봅시다!',
      description: '서로 어떤 생각을 가지고 살아가는지, 어떤 관계를 원하는지 조금 더 알아볼게요.',
      cta: '진지모드 Q&A 시작하기',
      developerNote: {
        ...baseNote,
        text: '가치관 & 내면 고르신 분들은\n여기서부터 진지모드 Q&A 갑시다^^',
        background: '#efe7ff',
        rotation: 0.6,
      },
    },
    questionEyebrow: '대화로 깊어지는 만남 · 가치관 질문',
    questionHelper: '정답은 없어요. 지금의 나와 가장 가까운 답을 골라주세요.',
    nextQuestionCta: '선택 후 다음 질문',
    finishQuestionCta: '답변 저장하고 완료',
    questions: [
      question('conflict', 'values', '갈등 해결 방식', '연인과 의견이 다를 때 어떤 방식이 가장 편한가요?', ['바로 이야기해서 풀기', '감정을 정리한 뒤 대화하기', '서로 생각할 시간을 갖기', '상황에 따라 다름']),
      question('dating_cost', 'values', '데이트 비용', '연애할 때 데이트 비용은 어떻게 하는 게 가장 편한가요?', ['비슷하게 나누기', '번갈아 내기', '여유 있는 사람이 더 내기', '크게 신경 쓰지 않음']),
      question('promise', 'values', '약속', '연인과 잡은 약속에 대해서 나는?', ['웬만하면 반드시 지킨다', '중요한 약속은 꼭 지킨다', '상황에 따라 바꿀 수 있다', '즉흥적인 편이다']),
      question('personal_time', 'values', '혼자만의 시간', '연애 중에도 혼자만의 시간이 필요한가요?', ['매우 중요하다', '어느 정도 필요하다', '같이 있는 시간이 더 좋다', '크게 신경 쓰지 않는다']),
      question('value_difference', 'values', '가치관 차이', '서로 생각이 많이 다른 주제가 있다면?', ['충분히 대화하며 맞춰간다', '서로 다름을 인정한다', '중요한 가치관은 비슷해야 한다', '경우에 따라 다르다']),
      question('weekend', 'lifestyle', '주말', '황금 같은 이번 주말, 나는?', ['밖으로 나가 활동한다', '새로운 곳을 찾아간다', '집에서 푹 쉰다', '그날 기분에 따라 정한다']),
      question('drinking', 'lifestyle', '음주', '술자리에 대한 나의 생각은?', ['좋아한다', '가끔 즐긴다', '거의 마시지 않는다', '전혀 마시지 않는다']),
      question('exercise', 'lifestyle', '운동', '평소 운동은?', ['꾸준히 한다', '가끔 한다', '시작하려고 노력 중이다', '거의 하지 않는다']),
      question('travel', 'lifestyle', '여행', '여행을 간다면?', ['계획을 꼼꼼하게 세운다', '큰 틀만 정한다', '즉흥적으로 움직인다', '자주 가지 않는다']),
      question('free_time', 'lifestyle', '휴일', '시간이 생기면 가장 하고 싶은 것은?', ['친구 만나기', '취미생활', '집에서 쉬기', '새로운 경험']),
      question('daily_rhythm', 'lifestyle', '생활 리듬', '나는 어느 쪽에 가까운가요?', ['완전 아침형', '아침형에 가까움', '야행성에 가까움', '완전 야행성']),
      question('message_style', 'lifestyle', '연락 스타일', '평소 메시지 스타일은?', ['짧게 자주', '한 번에 길게', '필요할 때 주로', '상대 스타일에 맞춘다']),
      question('hobby', 'lifestyle', '취미', '연인과 취미는?', ['같이 즐기면 좋다', '하나 정도 공유하면 좋다', '서로 달라도 괜찮다', '각자 취미가 있으면 좋다']),
      question('contact_frequency', 'love', '연락 빈도', '연인과 연락은 어느 정도가 편한가요?', ['자주 연락하고 싶다', '적당히 꾸준하게', '필요한 순간에', '정해두고 싶지 않다']),
      question('affection', 'love', '애정 표현', '애정 표현은?', ['많이 하는 편', '표현하려고 노력한다', '행동으로 보여준다', '표현이 조금 서툴다']),
      question('meeting_frequency', 'love', '만남 빈도', '연인을 얼마나 자주 만나고 싶나요?', ['거의 매일', '일주일에 2~3번', '일주일에 한 번 정도', '상황에 따라']),
      question('relationship_pace', 'love', '연애 속도', '관계가 시작될 때 나는?', ['빠르게 가까워진다', '자연스럽게 가까워진다', '천천히 알아간다', '상대에 따라 다르다']),
      question('problem_response', 'love', '문제 해결', '관계에서 문제가 생겼을 때?', ['바로 이야기한다', '정리한 뒤 말한다', '충분히 생각한 뒤 말한다', '상대가 먼저 말하길 기다린다']),
      question('social_circle', 'love', '인간관계', '연인의 친구나 인간관계에 대해서는?', ['적극적으로 알고 지내면 좋다', '필요한 정도만 알면 된다', '각자의 관계를 존중한다', '별로 신경 쓰지 않는다']),
      question('desired_relationship', 'love', '원하는 관계', '가장 원하는 연애에 가까운 것은?', ['친구처럼 편한 연애', '설렘이 많은 연애', '서로 성장하는 연애', '안정적이고 오래 가는 연애']),
    ],
  },
  complete: {
    firstEyebrow: 'FIRST IMPRESSION · COMPLETE',
    firstHeadline: '첫인상 프로필을 만들었어요.',
    firstDescription: '사진과 취향이 지금 느낌대로 잘 담겼는지 한 번 확인해보세요.',
    valuesEyebrow: 'VALUES · COMPLETE',
    valuesHeadline: '답변을 저장했어요.',
    valuesDescription: '비슷한 대화 코드와 가치관을 가진 사람을 소개할 때 참고할게요.',
    cta: '이용 방법 확인하기',
  },
  postOnboarding: {
    navigation: {
      home: '홈',
      chat: '채팅',
      feed: '피드',
      profile: '마이',
    },
    guide: {
      eyebrow: 'WELCOME · 시작하기 전에',
      headline: '밥한끼에서는\n이렇게 연결돼요.',
      description: '프로필을 다 만들었어요. 홈으로 가기 전에 채팅과 운영자 매칭 방식을 짧게 알려드릴게요.',
      points: [
        { id: 'guide_chat', icon: '01', title: '동의한 뒤 채팅 시작', description: '소개를 받은 두 사람이 모두 대화를 원할 때 채팅방이 열려요. 먼저 연락처를 공개하지 않습니다.' },
        { id: 'guide_operator', icon: '02', title: '운영자가 직접 주선', description: 'HELP를 요청하면 작성한 프로필과 선호를 운영자가 읽고, 어울릴 것 같은 두 사람에게 각각 의사를 물어요.' },
        { id: 'guide_choice', icon: '03', title: '부담 없이 결정', description: '소개 제안은 언제든 사양할 수 있어요. 거절 이유는 상대에게 전달되지 않고 자동 메시지도 보내지지 않습니다.' },
      ],
      operatorLabel: 'NO AI · ADMIN MATCH',
      operatorTitle: '진짜 운영자가 읽고 연결합니다.',
      operatorDescription: '점수나 궁합 퍼센트로 자동 연결하지 않아요. 작성한 내용과 지금 원하는 만남 방식을 함께 살펴봅니다.',
      helper: '운영자 매칭을 사용하지 않아도 홈과 피드는 자유롭게 둘러볼 수 있어요.',
      cta: '확인했어요 · 홈으로',
    },
    home: {
      eyebrow: 'TODAY · 밥한끼',
      greeting: '반가워요, {nickname}님.',
      description: '좋은 만남을 서두르기보다, 지금의 취향과 속도에 맞춰 천천히 시작해보세요.',
      statusLabel: 'PROFILE STATUS',
      statusTitle: '프로필 검토 중이에요',
      statusDescription: '운영자가 공개 전에 사진과 문구를 확인하고 있어요. 완료되면 채팅 탭으로 알려드릴게요.',
      operatorLabel: 'HELP · 운영자 직접 매칭',
      operatorTitle: '누굴 만나야 할지 모르겠다면?',
      operatorDescription: '작성한 프로필을 바탕으로 운영자가 직접 소개 후보를 찾아볼게요. 양쪽 동의 전에는 채팅방이 열리지 않아요.',
      operatorCta: '진행 방식 다시 보기',
      updatesTitle: '오늘의 작은 소식',
      updates: [
        '새 소개가 준비되면 채팅 탭에서 먼저 알려드려요.',
        '만남 방식과 프로필 키워드는 마이에서 언제든 바꿀 수 있어요.',
        '피드에는 운영자가 고른 대화 주제와 장소 이야기가 올라와요.',
      ],
    },
    chat: {
      eyebrow: 'CHAT · 서로 동의한 대화',
      headline: '채팅',
      description: '소개 제안과 열린 대화방을 한곳에서 확인해요.',
      operatorTitle: '밥한끼 운영자',
      operatorDescription: '새로운 소개 제안과 프로필 검토 결과는 이 대화에서 알려드릴게요.',
      operatorCta: '운영자 안내 보기',
      rooms: [
        { id: 'room_admin', name: '밥한끼 운영자', preview: '프로필 검토가 시작됐어요. 완료되면 알려드릴게요.', time: '방금', status: '안내' },
        { id: 'room_sample', name: '민지 · 성수', preview: '추천해주신 카페 봤어요. 분위기 좋네요!', time: '오후 8:21', status: '대화중' },
      ],
      emptyText: '아직 열린 채팅방이 없어요. 소개가 준비되면 여기에서 알려드릴게요.',
    },
    chatRoom: {
      title: '민지 · 성수',
      subtitle: '서로 대화에 동의했어요',
      systemNotice: '이 채팅방은 두 사람 모두 소개를 수락한 뒤 열렸어요. 연락처는 직접 공유하기 전까지 공개되지 않습니다.',
      inputPlaceholder: '메시지를 입력해주세요',
      sendButton: '전송',
      messages: [
        { id: 'message_1', side: 'system', text: '밥한끼 운영자가 두 분의 채팅방을 열었어요.', time: '오후 8:10' },
        { id: 'message_2', side: 'theirs', text: '안녕하세요! 소개 글에서 맛집 찾는 걸 좋아하신다고 봤어요 :)', time: '오후 8:17' },
        { id: 'message_3', side: 'mine', text: '반가워요. 저도 성수 쪽 새로운 식당 찾아다니는 걸 좋아해요!', time: '오후 8:20' },
        { id: 'message_4', side: 'theirs', text: '추천해주신 카페 봤어요. 분위기 좋네요!', time: '오후 8:21' },
      ],
    },
    feed: {
      eyebrow: 'FEED · 작은 읽을거리',
      headline: '한끼 피드',
      description: '운영자가 직접 고른 대화거리, 만남 장소, 서비스 소식을 가볍게 모았어요.',
      posts: [
        { id: 'feed_1', category: '첫 만남', title: '대화가 끊겼을 때 꺼내기 좋은 질문 5개', body: '거창한 가치관 질문보다 오늘 먹은 것, 쉬는 날의 루틴처럼 대답하기 쉬운 이야기부터 시작해보세요.', meta: '운영자 노트 · 3분' },
        { id: 'feed_2', category: '동네 한끼', title: '조용히 이야기하기 좋은 합정의 작은 식당', body: '좌석 간격과 소음이 부담스럽지 않은 곳을 기준으로 골랐어요. 예약 가능 여부는 방문 전에 확인해주세요.', meta: '장소 이야기 · 서울' },
        { id: 'feed_3', category: '서비스', title: '운영자 매칭은 왜 조금 느릴 수 있나요?', body: '프로필을 한 사람씩 읽고 양쪽의 의사를 따로 확인합니다. 빠른 자동 추천보다 납득되는 소개를 목표로 해요.', meta: '밥한끼 이야기 · 2분' },
      ],
    },
    profile: {
      eyebrow: 'MY PROFILE · 지금의 나',
      headline: '{nickname}님의 프로필',
      status: '운영자 검토 중',
      summaryTitle: '현재 만남 설정',
      matchingModeLabel: '만남 방식',
      operatorMatchLabel: '운영자 직접 매칭',
      operatorMatchValue: '소개 제안 받기',
      menuTitle: '프로필 관리',
      menuItems: ['기본 정보 수정', '사진과 매력 키워드', '가치관 답변', '차단 및 안전 설정', '알림 설정'],
    },
  },
  design: {
    primary: '#f43b64',
    accent: '#8357df',
    background: '#fff9fa',
    surface: '#ffffff',
    text: '#211b28',
    mutedText: '#746d7b',
    border: '#ded7df',
    cardRadius: 18,
    buttonRadius: 12,
    tagRadius: 999,
    cardBorderWidth: 1,
    shadow: false,
    spacingDensity: 1,
    headlineFont: 'sans',
    bodyFont: 'sans',
    headlineSize: 23,
    bodySize: 11.5,
    controlSize: 10.5,
  },
}

export const freshConfig = (): OnboardingConfig =>
  JSON.parse(JSON.stringify(DEFAULT_ONBOARDING_CONFIG)) as OnboardingConfig

const mergeDefaults = (defaults: unknown, saved: unknown): unknown => {
  if (Array.isArray(defaults)) return Array.isArray(saved) ? saved : defaults.map((item) => mergeDefaults(item, undefined))
  if (defaults && typeof defaults === 'object') {
    const savedObject = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved as Record<string, unknown> : {}
    const result: Record<string, unknown> = { ...savedObject }
    Object.entries(defaults as Record<string, unknown>).forEach(([key, value]) => {
      result[key] = mergeDefaults(value, savedObject[key])
    })
    return result
  }
  return saved === undefined ? defaults : saved
}

export const normalizeConfig = (config: OnboardingConfig): OnboardingConfig => {
  const hadPostOnboarding = Boolean((config as Partial<OnboardingConfig>).postOnboarding)
  const merged = mergeDefaults(DEFAULT_ONBOARDING_CONFIG, config) as OnboardingConfig
  if (!hadPostOnboarding && config.complete.cta === '처음부터 다시 보기') {
    merged.complete.cta = DEFAULT_ONBOARDING_CONFIG.complete.cta
  }
  return merged
}
