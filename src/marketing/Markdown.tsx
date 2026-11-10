import React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";

// Renders a blog post body (markdown) the way Astro's <Content /> did. Internal
// links (starting with "/") become React Router <Link>s so the SPA does not do
// a full page reload; external links stay plain anchors so they open normally.
const components: Components = {
  a({ href, children, ...props }) {
    if (href && href.startsWith("/")) {
      return (
        <Link to={href} {...props}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
};

export default function Markdown({ children }: { children: string }): React.JSX.Element {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
}
