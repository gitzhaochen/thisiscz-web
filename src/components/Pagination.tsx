'use client'

import {
  Pagination as ShadcnPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { MouseEvent } from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', pageNumber.toString())
    return `${pathname}?${params.toString()}`
  }

  const handlePageChange = (page: number) => {
    router.push(createPageURL(page))
  }

  // 生成要显示的页码
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      // 如果总页数小于等于最大可见页数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 始终显示第一页
      pages.push(1)

      // 计算中间页码的起始和结束
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      // 调整起始和结束页码，确保显示足够的页码
      if (start > 2) {
        pages.push('...')
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // 如果最后一页不在可见范围内，添加省略号
      if (end < totalPages - 1) {
        pages.push('...')
      }

      // 始终显示最后一页
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <ShadcnPagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e: MouseEvent) => {
              e.preventDefault()
              if (currentPage > 1) {
                handlePageChange(currentPage - 1)
              }
            }}
            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>

        {getPageNumbers().map((page, index) => (
          <PaginationItem key={index}>
            {page === '...' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                href="#"
                onClick={(e: MouseEvent) => {
                  e.preventDefault()
                  handlePageChange(page as number)
                }}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e: MouseEvent) => {
              e.preventDefault()
              if (currentPage < totalPages) {
                handlePageChange(currentPage + 1)
              }
            }}
            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>
      </PaginationContent>
    </ShadcnPagination>
  )
}
