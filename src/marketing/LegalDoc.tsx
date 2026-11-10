import React from "react";
import Base from "./Base";
import Markdown from "./Markdown";
import usePageMeta from "./usePageMeta";

// A legal document page (privacy, terms). The body is markdown. The Astro
// Legal.astro layout built a table of contents from the level-2 headings; here
// we render the markdown directly and let the page's own structure stand, since
// the documents already contain their own heading anchors.

interface LegalDocProps {
  title: string;
  description: string;
  metaTitle: string;
  body: string;
}

export default function LegalDoc(props: LegalDocProps): React.JSX.Element {
  usePageMeta({
    title: props.metaTitle,
    description: props.description,
  });

  return (
    <Base title={props.metaTitle} description={props.description}>
      <article className="doc">
        <h1>{props.title}</h1>
        <Markdown>{props.body}</Markdown>
      </article>
    </Base>
  );
}
