import { Locale } from 'next-intl'
import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ locale: Locale }>
}

export default async function AdminPage({ params }: Props) {
  const { locale } = await params
  redirect(`/${locale}/admin/cars`)
}
