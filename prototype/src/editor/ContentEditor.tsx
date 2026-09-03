import type { Dispatch, SetStateAction } from 'react'
import type { OnboardingConfig, ScreenId } from '../types/onboarding'
import { cloneConfig } from '../utils/config'
import { DeveloperNoteEditor } from './DeveloperNoteEditor'
import { EditorSection, TextField } from './EditorFields'
import { QuestionEditor } from './QuestionEditor'
import { TagEditor } from './TagEditor'
import { PostOnboardingEditor } from './PostOnboardingEditor'

type Props = {
  config: OnboardingConfig
  setConfig: Dispatch<SetStateAction<OnboardingConfig>>
  screen: ScreenId
  questionIndex: number
  setQuestionIndex: (index: number) => void
}

export function ContentEditor({ config, setConfig, screen, questionIndex, setQuestionIndex }: Props) {
  const mutate = (recipe: (next: OnboardingConfig) => void) => setConfig((current) => { const next = cloneConfig(current); recipe(next); return next })

  if (screen === 'matching') {
    const value = config.matchingMode
    return <>
      <EditorSection title="첫 화면 문구" description="입력하는 즉시 왼쪽 Preview에 반영됩니다.">
        <TextField label="Eyebrow" value={value.eyebrow} onChange={(eyebrow) => mutate((next) => { next.matchingMode.eyebrow = eyebrow })} />
        <TextField label="대제목" value={value.headline} onChange={(headline) => mutate((next) => { next.matchingMode.headline = headline })} multiline />
        <TextField label="보조 설명" value={value.description} onChange={(description) => mutate((next) => { next.matchingMode.description = description })} multiline />
      </EditorSection>
      {value.options.map((option, index) => <EditorSection title={`${index + 1} · ${option.title}`} key={option.id}>
        <TextField label="Mode 이름" value={option.title} onChange={(title) => mutate((next) => { next.matchingMode.options[index].title = title })} />
        <TextField label="Mode 설명" value={option.description} onChange={(description) => mutate((next) => { next.matchingMode.options[index].description = description })} multiline />
        <TextField label="작은 문구" value={option.microcopy} onChange={(microcopy) => mutate((next) => { next.matchingMode.options[index].microcopy = microcopy })} />
        <TextField label="포인트 Emoji" value={option.emoji} onChange={(emoji) => mutate((next) => { next.matchingMode.options[index].emoji = emoji })} />
      </EditorSection>)}
      <EditorSection title="하단 문구"><TextField label="안내" value={value.bottomNote} onChange={(bottomNote) => mutate((next) => { next.matchingMode.bottomNote = bottomNote })} multiline /><TextField label="CTA" value={value.cta} onChange={(cta) => mutate((next) => { next.matchingMode.cta = cta })} /></EditorSection>
    </>
  }

  if (screen === 'basic') {
    const value = config.commonSignup.basic
    return <>
      <EditorSection title="기본 정보 문구"><TextField label="화면 제목" value={value.header} onChange={(header) => mutate((next) => { next.commonSignup.basic.header = header })} /><TextField label="단계 문구" value={value.eyebrow} onChange={(eyebrow) => mutate((next) => { next.commonSignup.basic.eyebrow = eyebrow })} /><TextField label="대제목" value={value.headline} onChange={(headline) => mutate((next) => { next.commonSignup.basic.headline = headline })} multiline /><TextField label="설명" value={value.description} onChange={(description) => mutate((next) => { next.commonSignup.basic.description = description })} multiline /></EditorSection>
      <EditorSection title="입력 항목">{value.fields.map((field, index) => <div className="paired-fields" key={field.id}><TextField label={`Label ${index + 1}`} value={field.label} onChange={(label) => mutate((next) => { next.commonSignup.basic.fields[index].label = label })} /><TextField label="Placeholder" value={field.placeholder} onChange={(placeholder) => mutate((next) => { next.commonSignup.basic.fields[index].placeholder = placeholder })} /></div>)}</EditorSection>
      <EditorSection title="하단"><TextField label="Warning" value={value.warning} onChange={(warning) => mutate((next) => { next.commonSignup.basic.warning = warning })} multiline /><TextField label="CTA" value={value.cta} onChange={(cta) => mutate((next) => { next.commonSignup.basic.cta = cta })} /></EditorSection>
    </>
  }

  if (screen === 'verify') {
    const value = config.commonSignup.verification
    const fields: Array<[keyof typeof value, string, boolean?]> = [['header', '화면 제목'], ['eyebrow', '단계 문구'], ['headline', '대제목', true], ['description', '설명', true], ['phoneLabel', '휴대폰 Label'], ['phonePlaceholder', '휴대폰 Placeholder'], ['sendButton', '번호 전송 Button'], ['codeLabel', '인증번호 Label'], ['codePlaceholder', '인증번호 Placeholder'], ['verifyButton', '인증 확인 Button'], ['helper', 'Prototype 안내', true], ['cta', 'CTA']]
    return <EditorSection title="본인 인증 문구">{fields.map(([key, label, multiline]) => <TextField key={key} label={label} value={value[key]} onChange={(text) => mutate((next) => { next.commonSignup.verification[key] = text })} multiline={multiline} />)}</EditorSection>
  }

  if (screen === 'photo') {
    const value = config.firstImpression.photo
    return <><EditorSection title="사진 화면 문구"><TextField label="단계 문구" value={value.eyebrow} onChange={(eyebrow) => mutate((next) => { next.firstImpression.photo.eyebrow = eyebrow })} /><TextField label="대제목" value={value.headline} onChange={(headline) => mutate((next) => { next.firstImpression.photo.headline = headline })} multiline /><TextField label="설명" value={value.description} onChange={(description) => mutate((next) => { next.firstImpression.photo.description = description })} multiline /><TextField label="메인 사진 Label" value={value.mainLabel} onChange={(mainLabel) => mutate((next) => { next.firstImpression.photo.mainLabel = mainLabel })} /><TextField label="추가 사진 1 Label" value={value.extraLabels[0]} onChange={(label) => mutate((next) => { next.firstImpression.photo.extraLabels[0] = label })} /><TextField label="추가 사진 2 Label" value={value.extraLabels[1]} onChange={(label) => mutate((next) => { next.firstImpression.photo.extraLabels[1] = label })} /><TextField label="CTA" value={value.cta} onChange={(cta) => mutate((next) => { next.firstImpression.photo.cta = cta })} /></EditorSection><EditorSection title="사진 가이드"><TextField label="가이드 제목" value={value.guideTitle} onChange={(guideTitle) => mutate((next) => { next.firstImpression.photo.guideTitle = guideTitle })} /><TextField label="가이드 항목 · 줄바꿈으로 구분" value={value.guideItems.join('\n')} onChange={(text) => mutate((next) => { next.firstImpression.photo.guideItems = text.split('\n') })} multiline /></EditorSection></>
  }

  if (screen === 'charms') return <TagEditor value={config.firstImpression.charms} onChange={(charms) => mutate((next) => { next.firstImpression.charms = charms })} />

  if (screen === 'preferences') return <><TagEditor value={config.firstImpression.preferences} onChange={(preferences) => mutate((next) => { next.firstImpression.preferences = { ...next.firstImpression.preferences, ...preferences } })} /><DeveloperNoteEditor note={config.firstImpression.preferences.developerNote} onChange={(developerNote) => mutate((next) => { next.firstImpression.preferences.developerNote = developerNote })} /></>

  if (screen === 'valuesIntro') {
    const value = config.values.intro
    return <><EditorSection title="VALUES 시작 화면"><TextField label="단계 문구" value={value.eyebrow} onChange={(eyebrow) => mutate((next) => { next.values.intro.eyebrow = eyebrow })} /><TextField label="대제목" value={value.headline} onChange={(headline) => mutate((next) => { next.values.intro.headline = headline })} multiline /><TextField label="설명" value={value.description} onChange={(description) => mutate((next) => { next.values.intro.description = description })} multiline /><TextField label="CTA" value={value.cta} onChange={(cta) => mutate((next) => { next.values.intro.cta = cta })} /></EditorSection><DeveloperNoteEditor note={value.developerNote} onChange={(developerNote) => mutate((next) => { next.values.intro.developerNote = developerNote })} /></>
  }

  if (screen === 'question') return <><EditorSection title="질문 화면 공통 문구"><TextField label="상단 단계 문구" value={config.values.questionEyebrow} onChange={(questionEyebrow) => mutate((next) => { next.values.questionEyebrow = questionEyebrow })} /><TextField label="질문 안내" value={config.values.questionHelper} onChange={(questionHelper) => mutate((next) => { next.values.questionHelper = questionHelper })} multiline /><TextField label="다음 CTA" value={config.values.nextQuestionCta} onChange={(nextQuestionCta) => mutate((next) => { next.values.nextQuestionCta = nextQuestionCta })} /><TextField label="마지막 CTA" value={config.values.finishQuestionCta} onChange={(finishQuestionCta) => mutate((next) => { next.values.finishQuestionCta = finishQuestionCta })} /></EditorSection><QuestionEditor config={config} questionIndex={questionIndex} setQuestionIndex={setQuestionIndex} onChange={(questions) => mutate((next) => { next.values.questions = questions })} /></>

  if (['serviceGuide', 'home', 'chat', 'chatRoom', 'feed', 'profile'].includes(screen)) {
    return <PostOnboardingEditor value={config.postOnboarding} screen={screen} onChange={(postOnboarding) => mutate((next) => { next.postOnboarding = postOnboarding })} />
  }

  const value = config.complete
  return <EditorSection title="완료 화면 문구"><TextField label="첫눈 Eyebrow" value={value.firstEyebrow} onChange={(firstEyebrow) => mutate((next) => { next.complete.firstEyebrow = firstEyebrow })} /><TextField label="첫눈 대제목" value={value.firstHeadline} onChange={(firstHeadline) => mutate((next) => { next.complete.firstHeadline = firstHeadline })} multiline /><TextField label="첫눈 설명" value={value.firstDescription} onChange={(firstDescription) => mutate((next) => { next.complete.firstDescription = firstDescription })} multiline /><TextField label="가치관 Eyebrow" value={value.valuesEyebrow} onChange={(valuesEyebrow) => mutate((next) => { next.complete.valuesEyebrow = valuesEyebrow })} /><TextField label="가치관 대제목" value={value.valuesHeadline} onChange={(valuesHeadline) => mutate((next) => { next.complete.valuesHeadline = valuesHeadline })} multiline /><TextField label="가치관 설명" value={value.valuesDescription} onChange={(valuesDescription) => mutate((next) => { next.complete.valuesDescription = valuesDescription })} multiline /><TextField label="CTA" value={value.cta} onChange={(cta) => mutate((next) => { next.complete.cta = cta })} /></EditorSection>
}
