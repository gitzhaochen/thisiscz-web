import CarDetailClient from './components/CarDetailClient'
import { apiFetchServer } from '@/lib/apiFetch'
import type { CarDTO } from '@/lib/api/generated'
import { Locale } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { cache } from 'react'

type Props = {
  params: Promise<{ locale: Locale; id: string }>
}

const fetchCarDetail = cache(async (publicId: string): Promise<CarDTO | null> => {
  try {
    return await apiFetchServer(`/api/cars/${publicId}`)
  } catch {
    return null
  }
})

const buildDesc = (content?: string | null) => {
  const raw = (content || '').replace(/\s+/g, ' ').trim()
  if (!raw) return ''
  return raw.length > 160 ? `${raw.slice(0, 160)}...` : raw
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params
  const t = await getTranslations({ locale, namespace: 'PageCars' })
  const car = await fetchCarDetail(id)

  if (!car) {
    return {
      title: t('title'),
      description: t('loadError'),
    }
  }

  return {
    title: car.postTitle || t('title'),
    description: buildDesc(car.postContent) || t('description'),
  }
}

export default async function PageCarDetail({ params }: Props) {
  const { id } = await params
  return <CarDetailClient publicId={id} />
}
