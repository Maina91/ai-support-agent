import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <ReactMarkdown
      className="prose dark:prose-invert max-w-none"
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        table({ node, ...props }) {
          return (
            <div className="overflow-x-auto">
              <table className="table-auto border-collapse w-full" {...props} />
            </div>
          );
        },
        thead({ node, ...props }) {
          return <thead className="bg-gray-100 dark:bg-gray-800" {...props} />;
        },
        th({ node, ...props }) {
          return <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left" {...props} />;
        },
        td({ node, ...props }) {
          return <td className="border border-gray-300 dark:border-gray-700 px-4 py-2" {...props} />;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};