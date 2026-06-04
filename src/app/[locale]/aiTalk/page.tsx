'use client'
import MarkdownView from '@/components/MarkdownView'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
export default function PageAiTalk() {
  const t = useTranslations('PageAiTalk')
  const locale = useLocale()
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<{ message: string; response: string }[]>([])
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice')

  const speak = (text: string) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = locale === 'zh' ? 'zh-CN' : 'en-US'
    utterance.rate = 1.1
    utterance.pitch = 1

    const voices = speechSynthesis.getVoices()
    const matchedVoice = voices.find((v) => (locale === 'zh' ? v.lang.includes('zh') : v.lang.includes('en')))
    if (matchedVoice) utterance.voice = matchedVoice

    synthRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const fetchChatGPT = async (text: string) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/callGpt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      const fullReply = data.text
      setResponse(fullReply)
      speak(fullReply)

      setChatHistory((prev) => [...prev, { message: text, response: fullReply }])
      setMessage('')
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert(t('browserNotSupported'))
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition() as any
    recognition.lang = locale === 'zh' ? 'zh-CN' : 'en-US'
    recognition.interimResults = false
    recognition.continuous = true

    recognition.onstart = () => setMessage(`🎤 ${t('listening')}`)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      console.log('识别到文本：', transcript)
      setMessage(transcript)
      fetchChatGPT(transcript)
    }
    recognition.onerror = (e: any) => {
      console.error('识别错误:', e)
      setMessage(`❌ ${t('recognitionError')}`)
    }
    recognition.onend = () => {
      console.log('识别结束')
      setMessage('')
    }

    recognitionRef.current = recognition
    return () => recognition.stop()
  }, [locale])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatHistory])

  const holdTimer = useRef<NodeJS.Timeout | null>(null)

  const handlePressStart = (e: any) => {
    e.preventDefault()
    holdTimer.current = setTimeout(() => {
      if (!recognitionRef.current) return
      console.log('开始识别')
      recognitionRef.current.start()
    }, 200)
  }

  const handlePressEnd = (e: any) => {
    e.preventDefault()
    clearTimeout(holdTimer.current as NodeJS.Timeout)
    if (!recognitionRef.current) return
    console.log('停止识别')
    recognitionRef.current.stop()
  }

  return (
    <div className="page-wrapper py-6">
      <div className="mx-auto">
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-center text-xl font-bold">🎙️ {t('title')}</h1>
          <Button variant="outline" onClick={() => setInputMode((prev) => (prev === 'voice' ? 'text' : 'voice'))}>
            {t('currentMode')}: {inputMode === 'voice' ? t('voice') : t('text')}
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div ref={chatContainerRef} className="my-4 h-[calc(100*var(--vh)-300px)] overflow-y-auto rounded-lg border">
          <ul className="space-y-3">
            {chatHistory.map((chat, index) => (
              <li
                key={index}
                className={`bg-background m-3 border-dashed py-3 ${index === chatHistory.length - 1 ? '' : 'border-b'}`}
              >
                <p className="font-semibold">
                  {t('yourMessage')}:<span className="font-normal">{chat.message}</span>
                </p>
                <div className="">
                  <div className="font-semibold">AI:</div>
                  <div className="">
                    <MarkdownView content={chat.response} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {isLoading && (
            <div className="mt-4 flex items-center justify-center gap-1">
              <div className="inline-flex space-x-2">
                <div className="bg-muted-foreground size-1 animate-bounce rounded-full [animation-delay:-0.3s]"></div>
                <div className="bg-muted-foreground size-1 animate-bounce rounded-full [animation-delay:-0.15s]"></div>
                <div className="bg-muted-foreground size-1 animate-bounce rounded-full"></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex w-full justify-center">
          {inputMode === 'voice' ? (
            <Button
              className="bg-foreground active:bg-foreground/80 w-full cursor-pointer rounded-lg py-2 font-bold transition duration-200 select-none md:w-[50%]"
              onMouseDown={handlePressStart}
              onMouseUp={handlePressEnd}
              onTouchStart={handlePressStart}
              onTouchEnd={handlePressEnd}
              size="lg"
              disabled={isLoading}
            >
              {t('pressAndSpeak')}
            </Button>
          ) : (
            <div className="flex w-full items-center gap-2 md:w-[50%]">
              <Input
                type="text"
                className="h-10 flex-1 px-4"
                placeholder={t('enterText')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyUp={(e) => {
                  if (e.key === 'Enter' && message.trim()) {
                    fetchChatGPT(message.trim())
                  }
                }}
                disabled={isLoading}
              />
              <Button
                className="cursor-pointer px-4 py-2"
                size="lg"
                onClick={() => {
                  if (message.trim()) {
                    fetchChatGPT(message.trim())
                  }
                }}
                disabled={isLoading}
              >
                {t('send')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
