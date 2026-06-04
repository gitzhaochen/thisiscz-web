import { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import ClientOnly from '@/components/ClientOnly'
import Typewriter from '@/components/Typewriter'

type Props = {
  params: Promise<{ locale: Locale }>
}
export default async function Home({ params }: Props) {
  const { locale } = await params

  setRequestLocale(locale)

  const chineseTexts = [
    '欢迎来到我的博客！',
    '在这里，我将与大家分享生活中的点滴，无论是欢笑还是泪水，都是我们成长的一部分。',
    '生活如同一场冒险，充满了未知的挑战和意想不到的机遇。我希望通过文字，将这些珍贵的瞬间记录下来，与大家一同分享。',
    '在技术的世界里，我将不定期地更新我在编程和开发中遇到的各种问题和解决方案。无论是初学者还是资深开发者，我都希望这些内容能为你提供一些启发和帮助。',
    '感谢你的到来，希望你能在这里找到共鸣，激发灵感，甚至结识志同道合的朋友！',
    '赵晨',
    '中国 上海',
    '2025.10.25',
  ]

  const englishTexts = [
    'Welcome to my blog!',
    "Here, I will share snippets of life with everyone, whether it's laughter or tears, they are all part of our growth.",
    'Life is like an adventure, full of unknown challenges and unexpected opportunities. I hope to record these precious moments through words and share them with everyone.',
    'In the world of technology, I will periodically update various problems and solutions I encounter in programming and development. Whether you are a beginner or an experienced developer, I hope these contents can provide you with some inspiration and help.',
    'Thank you for coming, and I hope you can find resonance here, spark inspiration, and even meet like-minded friends!',
    'CZ',
    'China, Shanghai',
    '2025.10.25',
  ]

  return (
    <div className="page-wrapper pt-8 text-[16px] md:pt-[10vh] md:text-[20px]">
      <ClientOnly>
        <div
          className={`${locale === 'en' ? 'hidden' : 'flex'} font-chinese mx-auto max-w-[800px] flex-col gap-4 opacity-80`}
        >
          <Typewriter texts={chineseTexts} speed={30} delay={200} signatureStartIndex={5} />
        </div>
        <div
          className={`${locale === 'en' ? 'flex' : 'hidden'} font-schoolbell mx-auto flex max-w-[800px] flex-col gap-4 tracking-wide`}
        >
          <Typewriter texts={englishTexts} speed={30} delay={200} signatureStartIndex={5} />
        </div>
      </ClientOnly>
    </div>
  )
}
