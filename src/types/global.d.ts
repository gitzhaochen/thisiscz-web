interface Window {
  SpeechRecognition: typeof SpeechRecognition
  webkitSpeechRecognition: typeof SpeechRecognition
  sessionStorage: typeof Storage
  localStorage: typeof Storage
}

interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
      }
    }
  }
}

declare class SpeechRecognition extends EventTarget {
  lang: string
  onresult: (event: SpeechRecognitionEvent) => void
  start(): void
  stop(): void
}
declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}
