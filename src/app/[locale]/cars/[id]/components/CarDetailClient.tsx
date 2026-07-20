'use client'

import { useGetApiCarsPublicId } from '@/lib/api/generated'
import {
  getCarStatusLabel,
  getFuelTypeLabel,
  getSellerTypeLabel,
  getSourcePlatformLabel,
  getTransmissionLabel,
} from '@/lib/carEnumLabels'
import { LinkIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { useState } from 'react'
import { FreeMode, Navigation, Thumbs } from 'swiper/modules'
import type { Swiper as SwiperClass } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/free-mode'
import 'swiper/css/navigation'
import 'swiper/css/thumbs'
import ContactAdminNotice from '@/components/ContactAdminNotice'

export default function CarDetailClient({ publicId }: { publicId: string }) {
  const t = useTranslations('PageCars')
  const { data: car, isPending } = useGetApiCarsPublicId(publicId, {
    query: { enabled: !!publicId },
  })
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperClass | null>(null)

  if (isPending) {
    return (
      <div className="page-wrapper py-6">
        <div className="my-4 flex items-center justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-b-2 border-gray-500 dark:border-white"></div>
        </div>
      </div>
    )
  }

  if (!car) {
    return (
      <div className="page-wrapper py-6">
        <p className="text-muted-foreground">{t('loadError')}</p>
      </div>
    )
  }

  const images = car.imageUrls || []
  const showValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') return '-'
    return String(value)
  }
  const formatDateTime = (value?: string | null) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString()
  }

  return (
    <div className="page-wrapper py-6">
      <div className="mx-auto max-w-[860px] space-y-4">
        <h1 className="text-xl font-bold">{car.postTitle}</h1>

        <div className="relative overflow-hidden rounded-lg border">
          <Swiper
            modules={[Navigation, Thumbs]}
            navigation={images.length > 1}
            thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
            className="car-detail-swiper relative aspect-square w-full"
          >
            {images.length > 0 ? (
              images.map((url, index) => (
                <SwiperSlide key={`${url}-${index}`}>
                  <div className="relative h-full w-full">
                    <Image
                      src={url}
                      alt={`${car.postTitle || 'car'}-${index}`}
                      fill
                      className="object-cover object-center"
                    />
                  </div>
                </SwiperSlide>
              ))
            ) : (
              <SwiperSlide>
                <div className="text-muted-foreground flex h-full items-center justify-center text-sm">No image</div>
              </SwiperSlide>
            )}
          </Swiper>
        </div>

        {images.length > 1 && (
          <Swiper
            onSwiper={setThumbsSwiper}
            modules={[FreeMode, Thumbs]}
            watchSlidesProgress
            freeMode
            spaceBetween={8}
            slidesPerView={5}
            breakpoints={{ 768: { slidesPerView: 8 } }}
            className="[&_.swiper-slide-thumb-active_.thumb]:ring-primary mt-2 !overflow-visible [&_.swiper-slide-thumb-active_.thumb]:ring-2"
          >
            {images.map((url, index) => (
              <SwiperSlide key={`${url}-${index}`}>
                <div className="thumb relative aspect-square overflow-hidden rounded-md border">
                  <Image src={url} alt={`${car.postTitle || 'car'}-${index}`} fill className="object-cover" />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 rounded-lg border p-3 text-sm">
            <div className="text-muted-foreground">车源信息</div>
            <p>
              <span className="font-medium">价格：</span>
              <span className="font-semibold text-[#ef4444] tabular-nums">
                {showValue(car.price)} {showValue(car.currency)}
              </span>
            </p>
            <p>
              <span className="font-medium">状态：</span>
              {getCarStatusLabel(car.status)}
            </p>
            <p>
              <span className="font-medium">公里数：</span>
              {typeof car.mileageKm === 'number' && car.mileageKm > 0
                ? `${(car.mileageKm / 10000).toFixed(1).replace(/\.0$/, '')}万公里`
                : '-'}
            </p>
            <p>
              <span className="font-medium">年份：</span>
              {showValue(car.year)}
            </p>
            <p>
              <span className="font-medium">品牌：</span>
              {showValue(car.manufacturer)}
            </p>
            <p>
              <span className="font-medium">车型：</span>
              {showValue(car.model)}
            </p>

            <p>
              <span className="font-medium">变速箱：</span>
              {getTransmissionLabel(car.transmission)}
            </p>
            <p>
              <span className="font-medium">排量：</span>
              {showValue(car.engineDisplacementL)}
            </p>
            <p>
              <span className="font-medium">燃油类型：</span>
              {getFuelTypeLabel(car.fuelType)}
            </p>
            <p>
              <span className="font-medium">地区：</span>
              {showValue(car.country)} {showValue(car.city)}
            </p>

            {/* <p>
              <span className="font-medium">更新时间：</span>
              {formatDateTime(car.updatedAt)}
            </p> */}
          </div>

          <div className="space-y-2 rounded-lg border p-3 text-sm">
            <div className="text-muted-foreground">卖家信息</div>
            <p>
              <span className="font-medium">卖家类型：</span>
              {getSellerTypeLabel(car.sellerType)}
            </p>
            <p>
              <span className="font-medium">电话：</span>
              {showValue(car.contactPhone)}
            </p>
            <p>
              <span className="font-medium">微信：</span>
              {showValue(car.contactWechat)}
            </p>
            <p>
              <span className="font-medium">邮箱：</span>
              {showValue(car.contactEmail)}
            </p>
            <p>
              <span className="font-medium">创建时间：</span>
              {formatDateTime(car.createdAt)}
            </p>
            <p>
              <span className="font-medium">数据来源：</span>
              {car.sourceUrl && (
                <a
                  href={car.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm underline"
                >
                  <LinkIcon className="h-3 w-3" />
                  跳转小红书查看原文
                </a>
              )}
            </p>
          </div>
        </div>

        <div className="prose dark:prose-invert md:text-md max-w-none rounded-lg border p-3 text-sm leading-relaxed">
          <div className="text-muted-foreground">帖子内容</div>
          <p>{car.postContent}</p>
        </div>
        <ContactAdminNotice />
      </div>
      <style jsx global>{`
        .car-detail-swiper .swiper-button-prev,
        .car-detail-swiper .swiper-button-next {
          width: 3rem;
          height: 3rem;
          padding: 10px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.35);
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          color: #fff;
          transition:
            transform 0.2s ease,
            background-color 0.2s ease,
            border-color 0.2s ease;
        }

        @media (max-width: 767px) {
          .car-detail-swiper .swiper-button-prev,
          .car-detail-swiper .swiper-button-next {
            display: none !important;
          }
        }

        @media (min-width: 768px) {
          .car-detail-swiper .swiper-button-prev,
          .car-detail-swiper .swiper-button-next {
            opacity: 0;
            pointer-events: none;
            transition:
              opacity 0.2s ease,
              transform 0.2s ease,
              background-color 0.2s ease,
              border-color 0.2s ease;
          }

          .car-detail-swiper:hover .swiper-button-prev,
          .car-detail-swiper:hover .swiper-button-next {
            opacity: 1;
            pointer-events: auto;
          }
        }

        .car-detail-swiper .swiper-button-prev:hover,
        .car-detail-swiper .swiper-button-next:hover {
          transform: scale(1.06);
          background: rgba(15, 23, 42, 0.62);
          border-color: rgba(255, 255, 255, 0.55);
        }

        .car-detail-swiper .swiper-button-prev:after,
        .car-detail-swiper .swiper-button-next:after {
          font-size: 0.7rem;
          font-weight: 700;
        }

        .car-detail-swiper .swiper-button-disabled {
          opacity: 0.35;
          cursor: default;
        }

        .dark .car-detail-swiper .swiper-button-prev,
        .dark .car-detail-swiper .swiper-button-next {
          border-color: rgba(148, 163, 184, 0.45);
          background: rgba(15, 23, 42, 0.65);
        }
      `}</style>
    </div>
  )
}
