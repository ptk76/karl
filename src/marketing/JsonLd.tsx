import React from "react";

// Structured data for search and answer engines, as one JSON-LD block.
// This is a data block, not a script: the browser never executes
// type="application/ld+json". We inject it with dangerouslySetInnerHTML
// so React does not touch the content, and escape "<" so no string in the
// data can close the tag early.
export default function JsonLd(props: { graph: object[] }): React.JSX.Element {
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": props.graph }).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
