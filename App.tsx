import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CompletionScreen } from './src/features/completion/CompletionScreen';
import { BasicInfoScreen } from './src/features/common/BasicInfoScreen';
import { VerificationScreen } from './src/features/common/VerificationScreen';
import { AppearancePreferencesScreen } from './src/features/first-impression/AppearancePreferencesScreen';
import { CharmPointsScreen } from './src/features/first-impression/CharmPointsScreen';
import { PhotoUploadScreen } from './src/features/first-impression/PhotoUploadScreen';
import { MatchingModeScreen } from './src/features/matching-mode/MatchingModeScreen';
import { ValueQuestionScreen } from './src/features/values/ValueQuestionScreen';
import { ValuesIntroScreen } from './src/features/values/ValuesIntroScreen';
import { OnboardingScreen } from './src/model/onboarding';
import { OnboardingProvider, useOnboarding } from './src/store/OnboardingContext';
import { colors } from './src/theme/tokens';

export default function App() {
  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </OnboardingProvider>
    </SafeAreaProvider>
  );
}

const screens: Record<OnboardingScreen, React.ComponentType> = {
  matching_mode: MatchingModeScreen,
  basic_info: BasicInfoScreen,
  verification: VerificationScreen,
  first_photos: PhotoUploadScreen,
  first_charms: CharmPointsScreen,
  first_preferences: AppearancePreferencesScreen,
  values_intro: ValuesIntroScreen,
  values_question: ValueQuestionScreen,
  complete: CompletionScreen,
};

function AppNavigator() {
  const { state } = useOnboarding();
  if (!state.hydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.coral} size="large" />
        <Text style={styles.loadingText}>이어갈 준비를 하고 있어요</Text>
      </View>
    );
  }
  const Screen = screens[state.currentScreen];
  return <Screen />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { color: colors.muted, fontSize: 13 },
});
