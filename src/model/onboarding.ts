export type MatchingMode = 'first_impression' | 'values';

export type Gender = 'male' | 'female' | 'undisclosed';

export type OnboardingScreen =
  | 'matching_mode'
  | 'basic_info'
  | 'verification'
  | 'first_photos'
  | 'first_charms'
  | 'first_preferences'
  | 'values_intro'
  | 'values_question'
  | 'complete';

export type UserProfile = {
  nickname: string;
  birthDate: string;
  gender: Gender | null;
  region: string;
};

export type VerificationState = {
  provider: 'mock_sms';
  phoneNumber: string;
  codeSent: boolean;
  verified: boolean;
};

export type ProfilePhoto = {
  id: string;
  localUri: string;
  fileName?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  isPrimary: boolean;
};

export type FirstImpressionProfile = {
  photos: ProfilePhoto[];
  charmPoints: string[];
  customCharmPoints: string[];
  appearancePreferences: string[];
  customAppearancePreferences: string[];
};

export type ValueQuestionCategory = 'values' | 'lifestyle' | 'love';

export type ValueQuestionOption = {
  id: string;
  label: string;
};

export type ValueQuestion = {
  id: string;
  category: ValueQuestionCategory;
  categoryLabel: string;
  topic: string;
  emoji: string;
  question: string;
  options: ValueQuestionOption[];
};

export type ValueAnswer = {
  questionId: string;
  optionId: string;
};

export type ValuesProfile = {
  answers: ValueAnswer[];
};

export type CompletedSection =
  | 'matching_mode'
  | 'basic_info'
  | 'verification'
  | 'first_impression'
  | 'values';

export type OnboardingState = {
  schemaVersion: 1;
  hydrated: boolean;
  currentScreen: OnboardingScreen;
  matchingMode: MatchingMode | null;
  userProfile: UserProfile;
  verification: VerificationState;
  firstImpressionProfile: FirstImpressionProfile;
  valuesProfile: ValuesProfile;
  valueQuestionIndex: number;
  completedSections: CompletedSection[];
};

export const initialOnboardingState: OnboardingState = {
  schemaVersion: 1,
  hydrated: false,
  currentScreen: 'matching_mode',
  matchingMode: null,
  userProfile: {
    nickname: '',
    birthDate: '',
    gender: null,
    region: '',
  },
  verification: {
    provider: 'mock_sms',
    phoneNumber: '',
    codeSent: false,
    verified: false,
  },
  firstImpressionProfile: {
    photos: [],
    charmPoints: [],
    customCharmPoints: [],
    appearancePreferences: [],
    customAppearancePreferences: [],
  },
  valuesProfile: {
    answers: [],
  },
  valueQuestionIndex: 0,
  completedSections: [],
};
