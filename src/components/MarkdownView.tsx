import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
const MarkdownView = ({ content }: { content: string }) => {
  return (
    <div className="prose prose-zinc dark:prose-invert prose-img:mx-auto prose-img:block prose-img:max-w-full md:prose-img:max-w-[70%] text-foreground max-w-none">
      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </Markdown>
    </div>
  )
}

export default MarkdownView
