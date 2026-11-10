import React from "react";
import { Link, useParams } from "react-router-dom";
import Base from "./Base";
import Waitlist from "./Waitlist";
import Markdown from "./Markdown";
import usePageMeta from "./usePageMeta";
import { getPost, postUrl, isoDate, longDate } from "./posts";
import { SITE, AUTHOR, refs } from "./site";

export default function BlogPost(): React.JSX.Element {
  const { slug } = useParams();
  const post = slug ? getPost(slug) : undefined;

  if (!post) {
    usePageMeta({
      title: "Not here — dearkarl",
      description: "This post does not exist.",
    });
    return (
      <Base title="Not here — dearkarl" description="This post does not exist.">
        <div className="flow">
          <h1>Nothing at this address.</h1>
          <p className="lede">Even Karl cannot deliver to a page that does not exist.</p>
          <div className="btnrow">
            <Link className="btn" to="/">
              Back to dearkarl
            </Link>
          </div>
        </div>
      </Base>
    );
  }

  const url = `${SITE.url}${postUrl(post)}`;
  const changed = isoDate(post.updated) !== isoDate(post.published);

  const graph: object[] = [
    {
      "@type": "BlogPosting",
      "@id": `${url}#post`,
      headline: post.title,
      description: post.description,
      url,
      mainEntityOfPage: url,
      datePublished: isoDate(post.published),
      dateModified: isoDate(post.updated),
      inLanguage: SITE.lang,
      keywords: post.tags.join(", "),
      author: { "@type": "Person", name: AUTHOR.name, url: AUTHOR.url },
      publisher: { "@id": refs.org },
      isPartOf: { "@id": `${SITE.url}/blog#blog` },
      mainEntity: {
        "@type": "Question",
        name: post.question,
        acceptedAnswer: { "@type": "Answer", text: post.answer },
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE.url}/blog` },
        { "@type": "ListItem", position: 3, name: post.title, item: url },
      ],
    },
  ];
  if (post.faq.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: post.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  usePageMeta({
    title: `${post.title} — ${SITE.name}`,
    description: post.description,
    graph,
  });

  return (
    <Base title={`${post.title} — ${SITE.name}`} description={post.description}>
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/">dearkarl</Link> / <Link to="/blog">Blog</Link>
      </nav>
      <article className="doc post">
        <header>
          <h1>{post.title}</h1>
          <p className="meta">
            By <a href={AUTHOR.url} rel="author">{AUTHOR.name}</a> ·{" "}
            <time dateTime={isoDate(post.published)}>{longDate(post.published)}</time>
            {changed && (
              <>
                {" "}
                · updated <time dateTime={isoDate(post.updated)}>{longDate(post.updated)}</time>
              </>
            )}
          </p>
        </header>

        <section className="answer" aria-label="Short answer">
          <p className="q">{post.question}</p>
          <p>{post.answer}</p>
        </section>

        <Markdown>{post.body}</Markdown>

        {post.faq.length > 0 && (
          <section className="faq-block">
            <h2 id="questions">Questions</h2>
            {post.faq.map((f) => (
              <React.Fragment key={f.q}>
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </React.Fragment>
            ))}
          </section>
        )}

        <aside className="post-cta">
          <h2>Try dearkarl</h2>
          <p>
            Forward an email, and your next Claude Code session opens knowing it arrived. The
            self-hosted version is free and works today; the hosted one is opening soon.
          </p>
          <Waitlist id="email-post" />
          <p className="cta-note">
            Or <a href={SITE.repo}>self-host it from GitHub</a>.
          </p>
        </aside>
      </article>
    </Base>
  );
}
