import React from "react";
import { Link } from "react-router-dom";
import Base from "./Base";
import usePageMeta from "./usePageMeta";
import { publishedPosts, postUrl, isoDate, longDate } from "./posts";
import { SITE, refs } from "./site";

export default function BlogIndex(): React.JSX.Element {
  const posts = publishedPosts();
  const description =
    "Notes on getting things into your AI's context without handing it your mailbox — how-tos, comparisons, and how dearkarl is built.";
  const graph = [
    {
      "@type": "Blog",
      "@id": `${SITE.url}/blog#blog`,
      name: `${SITE.name} blog`,
      url: `${SITE.url}/blog`,
      description,
      publisher: { "@id": refs.org },
      blogPost: posts.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        url: `${SITE.url}${postUrl(p)}`,
        datePublished: isoDate(p.published),
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE.url}/blog` },
      ],
    },
  ];

  usePageMeta({ title: `Blog — ${SITE.name}`, description, graph });

  return (
    <Base title={`Blog — ${SITE.name}`} description={description}>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">dearkarl</Link> / <span aria-current="page">Blog</span>
      </nav>
      <h1>Blog</h1>
      <p className="lede">{description}</p>
      {posts.length === 0 ? (
        <p className="small">Nothing published yet.</p>
      ) : (
        <ol className="postlist">
          {posts.map((p) => (
            <li key={p.slug}>
              <article>
                <h2>
                  <Link to={postUrl(p)}>{p.title}</Link>
                </h2>
                <p>{p.description}</p>
                <p className="meta">
                  <time dateTime={isoDate(p.published)}>{longDate(p.published)}</time>
                </p>
              </article>
            </li>
          ))}
        </ol>
      )}
      <p className="small">
        <a href="/blog/rss.xml">RSS feed</a>
      </p>
    </Base>
  );
}
