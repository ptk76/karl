import { describe, expect, it } from "vitest";
import htmlToMarkdown, {
  htmlToMarkdown as htmlToMarkdownNamed,
  type HtmlToMarkdownOptions,
} from "../shared/html-to-md";

describe("html-to-md", () => {
  it("converts headings at every level", () => {
    expect(htmlToMarkdown("<h1>One</h1><h2>Two</h2><h3>Three</h3>")).toBe(
      "# One\n\n## Two\n\n### Three\n",
    );
  });

  it("joins phrasing content into paragraphs", () => {
    expect(htmlToMarkdown("<p>Hello <b>world</b></p>")).toBe(
      "Hello **world**\n",
    );
  });

  it("keeps bare text as a paragraph", () => {
    expect(htmlToMarkdown("just some text")).toBe("just some text\n");
  });

  it("renders em / strong / del", () => {
    expect(
      htmlToMarkdown("<p><em>e</em> <strong>s</strong> <del>d</del></p>"),
    ).toBe("*e* **s** ~~d~~\n");
  });

  it("widens inline-code fences containing backticks", () => {
    expect(htmlToMarkdown("<p><code>a ` b</code></p>")).toBe("``a ` b``\n");
  });

  it("pads inline code that starts or ends with a space", () => {
    expect(htmlToMarkdown("<p><code> spaced </code></p>")).toBe(
      "`  spaced  `\n",
    );
  });

  it("renders links with titles", () => {
    expect(
      htmlToMarkdown('<p><a href="https://x.test" title="The X">x</a></p>'),
    ).toBe('[x](https://x.test "The X")\n');
  });

  it("renders images with alt text", () => {
    expect(
      htmlToMarkdown('<p><img src="/a.png" alt="a b"></p>'),
    ).toBe("![a b](/a.png)\n");
  });

  it("renders unordered lists", () => {
    expect(htmlToMarkdown("<ul><li>a</li><li>b</li></ul>")).toBe("- a\n- b\n");
  });

  it("renders ordered lists, honoring start", () => {
    expect(htmlToMarkdown('<ol start="3"><li>three</li></ol>')).toBe(
      "3. three\n",
    );
  });

  it("indents nested lists", () => {
    expect(
      htmlToMarkdown(
        "<ol><li>one<ol><li>a</li><li>b</li></ol></li><li>two</li></ol>",
      ),
    ).toBe("1. one\n   1. a\n   2. b\n2. two\n");
  });

  it("keeps a nested list inside an otherwise-empty item", () => {
    expect(
      htmlToMarkdown("<ul><li><ul><li>x</li></ul></li></ul>"),
    ).toBe("-\n  - x\n");
  });

  it("renders fenced code blocks with a language", () => {
    expect(
      htmlToMarkdown('<pre><code class="language-js">const a = 1;</code></pre>'),
    ).toBe("```js\nconst a = 1;\n```\n");
  });

  it("expands tabs in code blocks", () => {
    expect(htmlToMarkdown("<pre><code>a\tb</code></pre>")).toBe(
      "```\na  b\n```\n",
    );
  });

  it("renders blockquotes", () => {
    expect(
      htmlToMarkdown("<blockquote><p>q1</p><p>q2</p></blockquote>"),
    ).toBe("> q1\n>\n> q2\n");
  });

  it("renders horizontal rules", () => {
    expect(htmlToMarkdown("<hr>")).toBe("---\n");
  });

  it("renders hard breaks", () => {
    expect(htmlToMarkdown("<p>a<br>b</p>")).toBe("a  \nb\n");
  });

  it("renders GFM tables with alignment and escaped pipes", () => {
    const html =
      '<table><thead><tr><th align="left">A</th><th>B</th></tr></thead>' +
      "<tbody><tr><td>x | y</td><td>z</td></tr></tbody></table>";
    expect(htmlToMarkdown(html)).toBe(
      "| A | B |\n| :--- | --- |\n| x \\| y | z |\n",
    );
  });

  it("strips script and style content", () => {
    expect(
      htmlToMarkdown(
        "<p>keep</p><script>var x = 1;</script><style>.a{}</style><p>end</p>",
      ),
    ).toBe("keep\n\nend\n");
  });

  it("decodes named and numeric entities", () => {
    expect(htmlToMarkdown("<p>&euro;4 &#65; &#x48; &amp;amp;</p>")).toBe(
      "€4 A H &amp;\n",
    );
  });

  it("escapes markdown-significant characters in text", () => {
    expect(htmlToMarkdown("<p>a * b _ c [x] # no</p>")).toBe(
      "a \\* b \\_ c \\[x\\] # no\n",
    );
  });

  it("escapes line-leading markdown markers", () => {
    expect(htmlToMarkdown("<p># not a heading</p>")).toBe("\\# not a heading\n");
  });

  it("collapses whitespace runs", () => {
    expect(htmlToMarkdown("<p>a    b\n   c</p>")).toBe("a b c\n");
  });

  it("renders dl as a bold term over its definition", () => {
    expect(
      htmlToMarkdown("<dl><dt>Term</dt><dd>Definition</dd></dl>"),
    ).toBe("**Term**\n\nDefinition\n");
  });

  it("strips a leading BOM", () => {
    expect(htmlToMarkdown("﻿<h1>Hi</h1>")).toBe("# Hi\n");
  });

  it("returns an empty string for empty input", () => {
    expect(htmlToMarkdown("")).toBe("");
    expect(htmlToMarkdown("<script>gone</script>")).toBe("");
  });

  it("default and named exports are the same function", () => {
    expect(htmlToMarkdown).toBe(htmlToMarkdownNamed);
  });

  it("accepts options (bullets, fence, tab width)", () => {
    const opts: HtmlToMarkdownOptions = {
      bulletListMarker: "*",
      codeFence: "~~~",
      tabWidth: 4,
    };
    expect(htmlToMarkdown("<ul><li>a</li></ul>", opts)).toBe("* a\n");
    expect(htmlToMarkdown("<pre><code>a\tb</code></pre>", opts)).toBe(
      "~~~\na    b\n~~~\n",
    );
  });
});
