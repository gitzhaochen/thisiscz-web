import MarkdownView from '@/components/MarkdownView'
import { PostCategory, PostDTO } from '@/lib/api/generated'
import { apiFetchServer } from '@/lib/apiFetch'
import { __IS_PROD__ } from '@/lib/constants'
import { format } from 'date-fns'
import dynamic from 'next/dynamic'
import { Locale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import CommentAction from '../components/CommentAction'
import LikeAction from '../components/LikeAction'
import PostAdminActions from '../components/PostAdminActions'

const CommentList = dynamic(() => import('./components/CommentList'), {
  loading: () => <div className="mt-8 text-sm text-gray-500">Loading comments...</div>,
})

const MARKDOWN_REVALIDATE_SECONDS = 3600
const FILE_NAME_SANITIZE_REGEX = /[^\w\s.-]/g

type Props = {
  params: Promise<{ locale: Locale; id: string }>
}

/**
 * 从 AWS S3 读取 markdown 文件内容（通过公共 URL）
 * @param fileName 文件名（不包含路径和扩展名）
 * @param locale 语言环境
 * @returns markdown 内容，如果文件不存在则返回 null
 */
async function readAwsMarkdown(fileName: string, locale: Locale): Promise<string | null> {
  try {
    const baseurl = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/assets`

    // 构建文件 URL：先尝试带 locale 的文件，再尝试不带 locale 的文件
    const filePaths = [`${baseurl}/posts/${fileName}.${locale}.md`, `${baseurl}/posts/${fileName}.md`]

    for (const url of filePaths) {
      try {
        const response = await fetch(url + '?v20260904', {
          // Markdown assets change infrequently; cache with ISR for faster TTFB.
          cache: 'force-cache',
          next: { revalidate: MARKDOWN_REVALIDATE_SECONDS },
        })

        if (response.ok) {
          const content = await response.text()
          if (content) {
            return content
          }
        } else if (response.status === 404) {
          // 文件不存在，继续尝试下一个路径
          continue
        } else {
          // 其他 HTTP 错误记录日志但继续尝试
          console.warn(`从 S3 读取文件失败 (${url}): HTTP ${response.status}`)
          continue
        }
      } catch (error: any) {
        // 网络错误或其他错误记录日志但继续尝试
        console.warn(`从 S3 读取文件失败 (${url}):`, error.message)
        continue
      }
    }

    return null
  } catch (error: any) {
    console.error('从 AWS S3 读取 markdown 文件失败:', error)
    return null
  }
}

/**
 * 根据 post title 生成文件名
 * 将标题转换为文件名格式（保留字母数字、点号、连字符和下划线，空格转换为空字符串）
 * 例如："Full Stack Blog 01: Quick Start" -> "FullStackBlog01QuickStart"
 */
function generateFileNameFromTitle(title: string): string {
  // 移除特殊字符，保留字母、数字、点号、连字符和下划线
  // 将空格移除（不转换为连字符，以匹配现有文件命名风格）
  return title
    .replace(FILE_NAME_SANITIZE_REGEX, '') // 移除特殊字符
    .replace(/\s+/g, '') // 移除所有空格
    .trim()
}

export default async function PagePostsDetail({ params }: Props) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const postDetailPromise = apiFetchServer(`/api/posts/${id}`) as Promise<PostDTO>
  const tPromise = getTranslations('PostCategory')
  const tCommonPromise = getTranslations('Common')
  const [postDetail, t, tCommon] = await Promise.all([postDetailPromise, tPromise, tCommonPromise])

  // 尝试从静态文件读取内容
  let markdownContent = locale === 'zh' ? postDetail.contentZh : postDetail.content

  // 尝试根据 title 生成文件名
  if (postDetail.title) {
    const fileName = generateFileNameFromTitle(postDetail.title)
    const staticContent = await readAwsMarkdown(fileName, locale)
    if (staticContent) {
      markdownContent = staticContent
    }
  }

  return (
    <div className="page-wrapper py-6">
      <div className="">
        <div key={postDetail.id!} className="relative flex flex-col gap-6">
          <div className="">
            <MarkdownView content={markdownContent || ''} />
          </div>
          <div className="text-muted-foreground flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span>{postDetail.author?.userName}</span>
              <span>{format(postDetail.createdAt!, 'yyyy.MM.dd HH:mm')}</span>
            </div>
            <div>
              {tCommon('category')}: {t(postDetail.category as PostCategory) || ''}
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <LikeAction post={postDetail} />
            <CommentAction post={postDetail} />
            <PostAdminActions post={postDetail} />
          </div>
        </div>
        <CommentList post={postDetail} />
      </div>
    </div>
  )
}
