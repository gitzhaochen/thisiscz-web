import type { CarDTO } from '@/lib/api/generated'

export function getLocalizedCarPost(
  car: Pick<CarDTO, 'postTitle' | 'postContent' | 'postTitleEn' | 'postContentEn'>,
  locale: string,
) {
  const useEnglish = locale.toLowerCase().startsWith('en')
  return {
    title: (useEnglish ? car.postTitleEn || car.postTitle : car.postTitle) || '',
    content: (useEnglish ? car.postContentEn || car.postContent : car.postContent) || '',
  }
}
