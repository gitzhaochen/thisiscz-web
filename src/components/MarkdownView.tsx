import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
const MarkdownView = ({ content }: { content: string }) => {
  return (
    <div className="prose prose-zinc dark:prose-invert text-foreground max-w-none">
      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {content}
      </Markdown>
    </div>
  )
}

export default MarkdownView
