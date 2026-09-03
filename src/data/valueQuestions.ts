import { ValueQuestion } from '../model/onboarding';

const options = (...labels: string[]) =>
  labels.map((label, index) => ({ id: `option_${index + 1}`, label }));

export const VALUE_QUESTIONS: ValueQuestion[] = [
  {
    id: 'conflict_resolution', category: 'values', categoryLabel: '가치관', topic: '갈등 해결', emoji: '💬',
    question: '연인과 의견이 다를 때 어떤 방식이 가장 편한가요?',
    options: options('바로 이야기해서 풀기', '감정을 정리한 뒤 대화하기', '서로 생각할 시간을 가진 뒤 이야기하기', '상황에 따라 다름'),
  },
  {
    id: 'dating_cost', category: 'values', categoryLabel: '가치관', topic: '데이트 비용', emoji: '💳',
    question: '연애할 때 데이트 비용은 어떻게 하는 게 가장 편한가요?',
    options: options('비슷하게 나누기', '번갈아 내기', '상황에 따라 여유 있는 사람이 더 내기', '크게 신경 쓰지 않음'),
  },
  {
    id: 'promise', category: 'values', categoryLabel: '가치관', topic: '약속', emoji: '🤝',
    question: '연인과 잡은 약속에 대해서 나는?',
    options: options('웬만하면 반드시 지킨다', '중요한 약속은 꼭 지킨다', '상황에 따라 유연하게 바꿀 수 있다', '즉흥적인 편이다'),
  },
  {
    id: 'personal_time', category: 'values', categoryLabel: '가치관', topic: '개인 시간', emoji: '🌿',
    question: '연애 중에도 혼자만의 시간이 필요한가요?',
    options: options('매우 중요하다', '어느 정도 필요하다', '같이 있는 시간이 더 좋다', '크게 신경 쓰지 않는다'),
  },
  {
    id: 'value_difference', category: 'values', categoryLabel: '가치관', topic: '생각의 차이', emoji: '🧭',
    question: '서로 생각이 많이 다른 주제가 있다면?',
    options: options('충분히 대화하며 맞춰간다', '서로 다름을 인정하면 된다', '중요한 가치관은 비슷해야 한다', '경우에 따라 다르다'),
  },
  {
    id: 'weekend', category: 'lifestyle', categoryLabel: '라이프스타일', topic: '평화로운 주말', emoji: '🎈',
    question: '황금 같은 이번 주말, 나는?',
    options: options('밖으로 나가 활동한다', '맛있는 음식이나 새로운 곳을 찾아간다', '집에서 푹 쉰다', '그날 기분에 따라 정한다'),
  },
  {
    id: 'drinking', category: 'lifestyle', categoryLabel: '라이프스타일', topic: '음주', emoji: '🥂',
    question: '술자리에 대한 나의 생각은?',
    options: options('좋아한다', '가끔 즐긴다', '거의 마시지 않는다', '전혀 마시지 않는다'),
  },
  {
    id: 'exercise', category: 'lifestyle', categoryLabel: '라이프스타일', topic: '운동', emoji: '🏃',
    question: '평소 운동은?',
    options: options('꾸준히 한다', '가끔 한다', '시작하려고 노력 중이다', '거의 하지 않는다'),
  },
  {
    id: 'travel', category: 'lifestyle', categoryLabel: '라이프스타일', topic: '여행', emoji: '🧳',
    question: '여행을 간다면?',
    options: options('계획을 꼼꼼하게 세운다', '큰 틀만 정한다', '즉흥적으로 움직인다', '여행 자체를 자주 가지 않는다'),
  },
  {
    id: 'free_time', category: 'lifestyle', categoryLabel: '라이프스타일', topic: '휴일', emoji: '☀️',
    question: '시간이 생기면 가장 하고 싶은 것은?',
    options: options('친구 만나기', '취미생활', '집에서 쉬기', '새로운 경험'),
  },
  {
    id: 'daily_rhythm', category: 'lifestyle', categoryLabel: '라이프스타일', topic: '생활 리듬', emoji: '⏰',
    question: '나는 어느 쪽에 가까운가요?',
    options: options('완전 아침형', '아침형에 가까움', '야행성에 가까움', '완전 야행성'),
  },
  {
    id: 'message_style', category: 'lifestyle', categoryLabel: '라이프스타일', topic: '메시지 스타일', emoji: '📱',
    question: '평소 메시지 스타일은?',
    options: options('짧게 자주', '한 번에 길게', '필요할 때 주로', '상대 스타일에 맞추는 편'),
  },
  {
    id: 'hobby', category: 'lifestyle', categoryLabel: '라이프스타일', topic: '취미', emoji: '🎨',
    question: '연인과 취미는?',
    options: options('같이 즐길 수 있으면 좋다', '하나 정도 공유하면 좋다', '서로 달라도 괜찮다', '각자 취미가 있는 게 좋다'),
  },
  {
    id: 'contact_frequency', category: 'love', categoryLabel: '연애관', topic: '연락 빈도', emoji: '💌',
    question: '연인과 연락은 어느 정도가 편한가요?',
    options: options('자주 연락하고 싶다', '적당히 꾸준하게', '필요한 순간에', '정해두고 싶지 않다'),
  },
  {
    id: 'affection', category: 'love', categoryLabel: '연애관', topic: '애정 표현', emoji: '💗',
    question: '애정 표현은?',
    options: options('많이 하는 편', '표현하려고 노력하는 편', '행동으로 보여주는 편', '표현이 조금 서툰 편'),
  },
  {
    id: 'meeting_frequency', category: 'love', categoryLabel: '연애관', topic: '만나는 빈도', emoji: '📅',
    question: '연인을 얼마나 자주 만나고 싶나요?',
    options: options('거의 매일', '일주일에 2~3번', '일주일에 한 번 정도', '상황에 따라'),
  },
  {
    id: 'relationship_pace', category: 'love', categoryLabel: '연애관', topic: '연애 속도', emoji: '🌱',
    question: '관계가 시작될 때 나는?',
    options: options('빠르게 가까워지는 편', '자연스럽게 가까워지는 편', '천천히 알아가는 편', '상대에 따라 다르다'),
  },
  {
    id: 'problem_response', category: 'love', categoryLabel: '연애관', topic: '문제가 생겼을 때', emoji: '🧩',
    question: '관계에서 문제가 생겼을 때?',
    options: options('바로 이야기한다', '어느 정도 정리한 뒤 말한다', '충분히 생각한 뒤 말한다', '상대가 먼저 이야기해주길 기다린다'),
  },
  {
    id: 'social_circle', category: 'love', categoryLabel: '연애관', topic: '서로의 인간관계', emoji: '👥',
    question: '연인의 친구나 인간관계에 대해서는?',
    options: options('서로 적극적으로 알고 지내면 좋다', '필요한 정도만 알면 된다', '각자의 관계를 존중하는 게 좋다', '별로 신경 쓰지 않는다'),
  },
  {
    id: 'desired_relationship', category: 'love', categoryLabel: '연애관', topic: '내가 원하는 관계', emoji: '☕',
    question: '가장 원하는 연애에 가까운 것은?',
    options: options('친구처럼 편한 연애', '설렘이 많은 연애', '서로 성장하는 연애', '안정적이고 오래 가는 연애'),
  },
];
