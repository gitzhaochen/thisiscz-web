import CarDetailClient from './components/CarDetailClient'

type Props = {
  params: Promise<{ id: string }>
}

export default async function PageCarDetail({ params }: Props) {
  const { id } = await params
  return <CarDetailClient publicId={id} />
}
