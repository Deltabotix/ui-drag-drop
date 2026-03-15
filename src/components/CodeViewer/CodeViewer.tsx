import React from 'react'
import './CodeViewer.css'

// Fallback for syntax highlighting - using simple pre tag for now
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
// import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CodeViewerProps {
  code: string
  language?: string
}

const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language = 'typescript',
}) => {
  void language
  return (
    <div className="code-viewer">
      <div className="code-viewer-header">
        <h3>Generated Code</h3>
        <button
          className="copy-button"
          onClick={() => navigator.clipboard.writeText(code)}
        >
          Copy
        </button>
      </div>
      <div className="code-viewer-content">
        <pre className="code-content">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}

export default CodeViewer

