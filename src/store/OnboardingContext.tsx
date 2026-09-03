import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useReducer } from 'react';
import {
  CompletedSection,
  FirstImpressionProfile,
  initialOnboardingState,
  MatchingMode,
  OnboardingScreen,
  OnboardingState,
  ProfilePhoto,
  UserProfile,
  ValueAnswer,
  VerificationState,
} from '../model/onboarding';

const STORAGE_KEY = '@bobhanggi/onboarding/v1';

type Action =
  | { type: 'HYDRATE'; payload?: Partial<OnboardingState> }
  | { type: 'SET_SCREEN'; payload: OnboardingScreen }
  | { type: 'SET_MATCHING_MODE'; payload: MatchingMode }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'UPDATE_VERIFICATION'; payload: Partial<VerificationState> }
  | { type: 'SET_PHOTOS'; payload: ProfilePhoto[] }
  | { type: 'SET_CHARM_POINTS'; payload: { selected: string[]; custom: string[] } }
  | { type: 'SET_APPEARANCE_PREFERENCES'; payload: { selected: string[]; custom: string[] } }
  | { type: 'SET_VALUE_ANSWER'; payload: ValueAnswer }
  | { type: 'SET_VALUE_INDEX'; payload: number }
  | { type: 'COMPLETE_SECTION'; payload: CompletedSection }
  | { type: 'RESET' };

const reducer = (state: OnboardingState, action: Action): OnboardingState => {
  switch (action.type) {
    case 'HYDRATE': {
      const saved = action.payload;
      if (!saved || saved.schemaVersion !== 1) {
        return { ...initialOnboardingState, hydrated: true };
      }
      return {
        ...initialOnboardingState,
        ...saved,
        hydrated: true,
        userProfile: { ...initialOnboardingState.userProfile, ...saved.userProfile },
        verification: { ...initialOnboardingState.verification, ...saved.verification },
        firstImpressionProfile: {
          ...initialOnboardingState.firstImpressionProfile,
          ...saved.firstImpressionProfile,
        },
        valuesProfile: { ...initialOnboardingState.valuesProfile, ...saved.valuesProfile },
      };
    }
    case 'SET_SCREEN':
      return { ...state, currentScreen: action.payload };
    case 'SET_MATCHING_MODE':
      return { ...state, matchingMode: action.payload };
    case 'UPDATE_USER_PROFILE':
      return { ...state, userProfile: { ...state.userProfile, ...action.payload } };
    case 'UPDATE_VERIFICATION':
      return { ...state, verification: { ...state.verification, ...action.payload } };
    case 'SET_PHOTOS':
      return {
        ...state,
        firstImpressionProfile: { ...state.firstImpressionProfile, photos: action.payload },
      };
    case 'SET_CHARM_POINTS':
      return {
        ...state,
        firstImpressionProfile: {
          ...state.firstImpressionProfile,
          charmPoints: action.payload.selected,
          customCharmPoints: action.payload.custom,
        },
      };
    case 'SET_APPEARANCE_PREFERENCES':
      return {
        ...state,
        firstImpressionProfile: {
          ...state.firstImpressionProfile,
          appearancePreferences: action.payload.selected,
          customAppearancePreferences: action.payload.custom,
        },
      };
    case 'SET_VALUE_ANSWER': {
      const answers = state.valuesProfile.answers.filter(
        (answer) => answer.questionId !== action.payload.questionId,
      );
      return {
        ...state,
        valuesProfile: { answers: [...answers, action.payload] },
      };
    }
    case 'SET_VALUE_INDEX':
      return { ...state, valueQuestionIndex: action.payload };
    case 'COMPLETE_SECTION':
      return state.completedSections.includes(action.payload)
        ? state
        : { ...state, completedSections: [...state.completedSections, action.payload] };
    case 'RESET':
      return { ...initialOnboardingState, hydrated: true };
    default:
      return state;
  }
};

type OnboardingContextValue = {
  state: OnboardingState;
  setScreen: (screen: OnboardingScreen) => void;
  setMatchingMode: (mode: MatchingMode) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateVerification: (verification: Partial<VerificationState>) => void;
  setPhotos: (photos: ProfilePhoto[]) => void;
  updateFirstImpression: (
    key: 'charms' | 'preferences',
    selected: string[],
    custom: string[],
  ) => void;
  setValueAnswer: (answer: ValueAnswer) => void;
  setValueQuestionIndex: (index: number) => void;
  completeSection: (section: CompletedSection) => void;
  reset: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, initialOnboardingState);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!mounted) return;
        dispatch({ type: 'HYDRATE', payload: raw ? JSON.parse(raw) : undefined });
      })
      .catch(() => {
        if (mounted) dispatch({ type: 'HYDRATE' });
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const { hydrated: _hydrated, ...persistedState } = state;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState)).catch(() => {
      // The UI remains usable if local persistence is unavailable.
    });
  }, [state]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      state,
      setScreen: (screen) => dispatch({ type: 'SET_SCREEN', payload: screen }),
      setMatchingMode: (mode) => dispatch({ type: 'SET_MATCHING_MODE', payload: mode }),
      updateUserProfile: (profile) => dispatch({ type: 'UPDATE_USER_PROFILE', payload: profile }),
      updateVerification: (verification) =>
        dispatch({ type: 'UPDATE_VERIFICATION', payload: verification }),
      setPhotos: (photos) => dispatch({ type: 'SET_PHOTOS', payload: photos }),
      updateFirstImpression: (key, selected, custom) =>
        dispatch({
          type: key === 'charms' ? 'SET_CHARM_POINTS' : 'SET_APPEARANCE_PREFERENCES',
          payload: { selected, custom },
        }),
      setValueAnswer: (answer) => dispatch({ type: 'SET_VALUE_ANSWER', payload: answer }),
      setValueQuestionIndex: (index) => dispatch({ type: 'SET_VALUE_INDEX', payload: index }),
      completeSection: (section) => dispatch({ type: 'COMPLETE_SECTION', payload: section }),
      reset: () => dispatch({ type: 'RESET' }),
    }),
    [state],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return context;
}
