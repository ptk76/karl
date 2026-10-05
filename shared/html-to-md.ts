/**
 * html-to-md — dependency-free HTML → Markdown converter.
 *
 * A small, self-contained module with no runtime dependencies. It tokenizes
 * the HTML into a lightweight tree, then renders that tree to GitHub-flavored
 * Markdown (headings, emphasis, links/images, lists, code, blockquotes,
 * horizontal rules, and GFM tables). Runs in Node and in the browser.
 *
 * Lives in `shared/` (like the error contract) so both the worker and the
 * frontend can import it, and TypeScript checks it via `npm run check`.
 *
 *   import htmlToMarkdown from "./html-to-md";
 *   const md = htmlToMarkdown("<h1>Hi</h1><p>Hello <b>world</b></p>");
 *   // => "# Hi\n\nHello **world**\n"
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Options controlling how HTML is rendered to Markdown. */
export interface HtmlToMarkdownOptions {
  /** Unordered-list marker ("-", "*", or "+"). Default "-". */
  bulletListMarker?: string;
  /** Fence used for fenced code blocks. Default "```". */
  codeFence?: string;
  /** Spaces a tab expands to inside code blocks (0 keeps tabs). Default 2. */
  tabWidth?: number;
}

interface ResolvedOptions {
  bulletListMarker: string;
  codeFence: string;
  tabWidth: number;
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

type TextToken = { type: "text"; data: string };
type StartToken = {
  type: "start";
  tag: string;
  attrs: Record<string, string>;
  selfClosing: boolean;
};
type EndToken = { type: "end"; tag: string };
type Token = TextToken | StartToken | EndToken;

/** Elements that never have a closing tag or child content. */
const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/**
 * Elements whose content must be read verbatim until the matching close tag
 * (never parsed as markup). script/style/xmp are dropped entirely by the
 * renderer; textarea/title are treated as plain text.
 */
const RAW_TEXT_ELEMENTS = new Set([
  "script", "style", "xmp", "iframe", "noembed", "noframes", "textarea", "title",
]);

/**
 * Turn an HTML string into a flat list of tokens.
 * Tolerant of malformed input: stray "<" becomes text, unterminated raw-text
 * elements run to the end of the input.
 */
function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = html.length;

  const pushText = (slice: string): void => {
    if (!slice) return;
    const last = tokens[tokens.length - 1];
    if (last && last.type === "text") last.data += slice;
    else tokens.push({ type: "text", data: slice });
  };

  while (i < n) {
    const lt = html.indexOf("<", i);
    if (lt === -1) {
      pushText(html.slice(i));
      break;
    }
    if (lt > i) pushText(html.slice(i, lt));

    if (html.startsWith("<!--", lt)) {
      const close = html.indexOf("-->", lt + 4);
      i = close === -1 ? n : close + 3; // comments never reach the output
      continue;
    }
    if (html.startsWith("<!", lt)) {
      const close = html.indexOf(">", lt); // doctype / declarations
      i = close === -1 ? n : close + 1;
      continue;
    }
    if (html.startsWith("</", lt)) {
      const end = readEndTag(html, lt + 2);
      if (end.name) tokens.push({ type: "end", tag: end.name });
      i = end.next;
      continue;
    }

    const start = readStartTag(html, lt + 1);
    if (!start) {
      pushText("<"); // not a real tag — treat the "<" as text
      i = lt + 1;
      continue;
    }
    const tag = start.name.toLowerCase();
    const selfClosing = start.selfClosing || VOID_ELEMENTS.has(tag);
    tokens.push({ type: "start", tag, attrs: start.attrs, selfClosing });

    if (RAW_TEXT_ELEMENTS.has(tag)) {
      // Consume raw content up to (not including) the matching close tag.
      const rest = html.slice(start.next);
      const close = rest.search(new RegExp(`</${tag}[\\s>]`, "i"));
      if (close === -1) {
        pushText(rest);
        i = n;
      } else {
        pushText(rest.slice(0, close));
        i = start.next + close;
      }
      continue;
    }
    i = start.next;
  }
  return tokens;
}

/** Read "</name" starting just after "</"; returns {name, next}. */
function readEndTag(html: string, from: number): { name: string; next: number } {
  const m = /^[a-zA-Z][a-zA-Z0-9:-]*/.exec(html.slice(from));
  if (!m) return { name: "", next: skipToGt(html, from) };
  const next = skipToGt(html, from + m[0].length);
  return { name: m[0].toLowerCase(), next };
}

/** Read "<name attrs>" starting just after "<"; returns the tag or null. */
function readStartTag(
  html: string,
  from: number,
): { name: string; attrs: Record<string, string>; selfClosing: boolean; next: number } | null {
  const nameMatch = /^[a-zA-Z][a-zA-Z0-9:-]*/.exec(html.slice(from));
  if (!nameMatch) return null;
  const attrs: Record<string, string> = {};
  let selfClosing = false;
  let pos = from + nameMatch[0].length;

  while (pos < html.length) {
    pos = skipWs(html, pos);
    const ch = html[pos];
    if (ch === ">" || ch === undefined) {
      pos = pos < html.length ? pos + 1 : pos;
      break;
    }
    if (ch === "/") {
      pos = skipWs(html, pos + 1);
      if (html[pos] === ">") {
        selfClosing = true;
        pos += 1;
        break;
      }
      continue;
    }
    const attrMatch = /[^\s=/>]+/.exec(html.slice(pos));
    if (!attrMatch) {
      pos = skipToGt(html, pos);
      break;
    }
    const name = attrMatch[0].toLowerCase();
    pos += attrMatch[0].length;
    pos = skipWs(html, pos);
    if (html[pos] === "=") {
      pos = skipWs(html, pos + 1);
      const quote = html[pos];
      if (quote === '"' || quote === "'") {
        const close = html.indexOf(quote, pos + 1);
        if (close === -1) {
          attrs[name] = html.slice(pos + 1);
          pos = html.length;
        } else {
          attrs[name] = html.slice(pos + 1, close);
          pos = close + 1;
        }
      } else {
        const unquoted = /[^\s>]+/.exec(html.slice(pos));
        attrs[name] = unquoted ? unquoted[0] : "";
        pos += unquoted ? unquoted[0].length : 0;
      }
    } else {
      attrs[name] = ""; // boolean attribute
    }
  }

  return { name: nameMatch[0], attrs, selfClosing, next: pos };
}

/** Advance past whitespace. */
function skipWs(html: string, from: number): number {
  const m = /^[ \t\r\n\f]*/.exec(html.slice(from));
  return from + (m ? m[0].length : 0);
}

/** Advance to just after the next ">", tolerating quotes. */
function skipToGt(html: string, from: number): number {
  let quote: string | null = null;
  for (let p = from; p < html.length; p++) {
    const ch = html[p];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === ">") {
      return p + 1;
    }
  }
  return html.length;
}

// ---------------------------------------------------------------------------
// Tree builder
// ---------------------------------------------------------------------------

type TextNode = { type: "text"; data: string };
type ElementNode = {
  type: "element";
  tag: string;
  attrs: Record<string, string>;
  children: HtmlNode[];
};
type RootNode = { type: "root"; children: HtmlNode[] };
type HtmlNode = TextNode | ElementNode;

/**
 * Fold tokens into a lightweight tree. Mismatched close tags are ignored
 * (tolerant parsing) instead of erroring.
 */
function buildTree(tokens: Token[]): RootNode {
  const root: RootNode = { type: "root", children: [] };
  const stack: (RootNode | ElementNode)[] = [root];

  for (const tok of tokens) {
    if (tok.type === "text") {
      stack[stack.length - 1].children.push({ type: "text", data: tok.data });
    } else if (tok.type === "start") {
      const el: ElementNode = { type: "element", tag: tok.tag, attrs: tok.attrs, children: [] };
      stack[stack.length - 1].children.push(el);
      if (!tok.selfClosing) stack.push(el);
    } else if (tok.type === "end") {
      for (let k = stack.length - 1; k >= 1; k--) {
        const node = stack[k];
        if (node.type === "element" && node.tag === tok.tag) {
          stack.length = k; // pop the element and anything unclosed above it
          break;
        }
      }
    }
  }
  return root;
}

// ---------------------------------------------------------------------------
// Entity decoding
// ---------------------------------------------------------------------------

/** Common named character references (lowercased keys). */
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'",
  nbsp: " ", copy: "©", reg: "®", trade: "™",
  hellip: "…", mdash: "—", ndash: "–",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
  bull: "•", dagger: "†", Dagger: "‡",
  sect: "§", para: "¶", deg: "°", permil: "‰",
  euro: "€", pound: "£", yen: "¥", cent: "¢",
  curren: "¤", middot: "·", times: "×", divide: "÷",
  plusmn: "±", frac12: "½", frac14: "¼", frac34: "¾",
  prime: "′", Prime: "″", laquo: "«", raquo: "»",
  sup2: "²", sup3: "³",
};

/** Decode named + numeric character references into text. */
function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => codepoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => codepoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z][a-zA-Z0-9]{1,31});/g, (m, name) =>
      NAMED_ENTITIES[name] !== undefined ? NAMED_ENTITIES[name] : m,
    );
}

/** Render a numeric code point as text, ignoring invalid values. */
function codepoint(code: number): string {
  try {
    return String.fromCodePoint(code);
  } catch {
    return "�";
  }
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

/** Phrasing (inline) content elements. */
const INLINE_ELEMENTS = new Set([
  "a", "abbr", "b", "bdi", "bdo", "big", "br", "cite", "code", "data",
  "del", "dfn", "em", "font", "i", "img", "ins", "kbd", "label", "mark",
  "q", "s", "samp", "small", "span", "strike", "strong", "sub", "sup",
  "time", "tt", "u", "var", "wbr",
]);

/** Renderer state threaded through the tree walk. */
interface RenderContext {
  opt: ResolvedOptions;
  inPre: boolean;
  inTable: boolean;
  listDepth: number;
}

/** Collapse runs of whitespace to a single space (not used inside pre/code). */
function collapse(text: string): string {
  return text.replace(/\s+/g, " ");
}

/** Escape Markdown-significant characters in plain text. */
function escapeInline(text: string): string {
  return text
    .replace(/[\\*_`[\]]/g, (ch) => "\\" + ch)
    .replace(/^([#>:+\-*]|\d+[.)])(?=\s|$)/gm, "\\$1");
}

/** Trim leading/trailing space of an inline run. */
function trimRun(text: string): string {
  return text.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, "");
}

/** Concatenated text of a subtree (entities already decoded at the source). */
function textContent(node: ElementNode, out: string[] = []): string {
  for (const child of node.children) {
    if (child.type === "text") out.push(child.data);
    else textContent(child, out);
  }
  return out.join("");
}

/** Render a run of inline nodes (text + phrasing elements) to a string. */
function renderInlineSeq(children: HtmlNode[], ctx: RenderContext): string {
  let out = "";
  for (const child of children) {
    if (child.type === "text") {
      const data = ctx.inPre ? child.data : collapse(child.data);
      out += data ? escapeInline(decodeEntities(data)) : "";
    } else {
      out += renderInline(child, ctx);
    }
  }
  return trimRun(out);
}

/**
 * Render block-level children to a Markdown string, gathering any bare text or
 * phrasing content into paragraphs and joining blocks with blank lines.
 */
function renderBlocks(children: HtmlNode[], ctx: RenderContext): string {
  const blocks: string[] = [];
  let inlineRun: HtmlNode[] = [];

  const flush = (): void => {
    if (inlineRun.length) {
      const text = renderInlineSeq(inlineRun, ctx);
      if (text) blocks.push(text);
      inlineRun = [];
    }
  };

  for (const child of children) {
    if (child.type === "text") {
      if (collapse(child.data).trim()) inlineRun.push(child);
    } else if (INLINE_ELEMENTS.has(child.tag)) {
      inlineRun.push(child);
    } else {
      flush();
      const rendered = renderBlock(child, ctx);
      if (rendered && rendered.trim()) blocks.push(rendered.trim());
    }
  }
  flush();
  return blocks.join("\n\n");
}

/** Inline (phrasing) element renderer. */
function renderInline(el: ElementNode, ctx: RenderContext): string {
  const content = (): string => renderInlineSeq(el.children, ctx);

  switch (el.tag) {
    case "strong":
    case "b":
      return "**" + content() + "**";
    case "em":
    case "i":
      return "*" + content() + "*";
    case "del":
    case "s":
    case "strike":
      return "~~" + content() + "~~";
    case "code":
      return renderCodeInline(el);
    case "a":
      return renderLink(el, ctx);
    case "img":
      return renderImage(el, ctx);
    case "br":
      return ctx.inTable ? "<br>" : "  \n";
    case "sub":
    case "sup":
      // Plain text; markdown has no portable subscript/superscript.
      return content();
    default:
      return content();
  }
}

/** Inline <code>: backtick-wrapped, widening the fence if needed. */
function renderCodeInline(el: ElementNode): string {
  let code = textContent(el);
  if (code.includes("`")) return "``" + code + "``";
  if (/^ | $/.test(code)) code = " " + code + " ";
  return "`" + code + "`";
}

/** <a href="...">text</a> */
function renderLink(el: ElementNode, ctx: RenderContext): string {
  const text = renderInlineSeq(el.children, ctx);
  const href = (el.attrs.href || "").trim();
  if (!href) return text;
  const title = el.attrs.title ? ` "${el.attrs.title.replace(/"/g, '\\"')}"` : "";
  const target = /\s/.test(href) ? `<${href}>` : href;
  return `[${text}](${target}${title})`;
}

/** <img src="..." alt="..."> */
function renderImage(el: ElementNode, ctx: RenderContext): string {
  const src = (el.attrs.src || "").trim();
  const alt =
    renderInlineSeq(el.children, ctx) || (el.attrs.alt || "").trim();
  return `![${alt.replace(/\]/g, "\\]")}](${src})`;
}

/** Block-level element renderer. */
function renderBlock(el: ElementNode, ctx: RenderContext): string {
  const heading = /^h([1-6])$/.exec(el.tag);
  if (heading) {
    return "#".repeat(Number(heading[1])) + " " + renderInlineSeq(el.children, ctx);
  }

  switch (el.tag) {
    case "p":
      return renderInlineSeq(el.children, ctx);
    case "pre":
      return renderPre(el, ctx);
    case "blockquote":
      return renderBlockquote(el, ctx);
    case "ul":
    case "ol":
      return renderList(el, ctx);
    case "hr":
      return "---";
    case "table":
      return renderTable(el, ctx);
    case "dt":
      return "**" + renderInlineSeq(el.children, ctx) + "**";
    case "dd":
      return renderBlocks(el.children, ctx);
    case "script":
    case "style":
    case "iframe":
    case "noscript":
    case "template":
      return ""; // never surfaces in Markdown
    // Generic containers: unwrap and render their children.
    default:
      return renderBlocks(el.children, ctx);
  }
}

/** <pre> → fenced code block, keeping language from a language-* class. */
function renderPre(el: ElementNode, ctx: RenderContext): string {
  const opt = ctx.opt;
  let code = textContent(el).replace(/^\n+/, "").replace(/\n+$/, "");
  // Tabs → spaces for predictable fenced-code output.
  if (opt.tabWidth > 0) code = code.replace(/\t/g, " ".repeat(opt.tabWidth));

  const language = detectLanguage(el);
  let fence = opt.codeFence;
  // Widen the fence if the code itself contains it.
  while (code.includes(fence)) fence += opt.codeFence[0];
  return `${fence}${language}\n${code}\n${fence}`;
}

/** Pull a programming language out of language-*, lang-* or data-language attrs. */
function detectLanguage(el: ElementNode): string {
  let found = "";
  const visit = (node: HtmlNode): void => {
    if (found) return;
    if (node.type === "text") return;
    const cls = node.attrs.class || "";
    const m = /(?:^|\s)(?:language|lang)-([A-Za-z0-9_+#-]+)/.exec(cls);
    if (m) {
      found = m[1];
      return;
    }
    const dataLang = node.attrs["data-language"];
    if (dataLang) {
      found = dataLang;
      return;
    }
    for (const c of node.children) visit(c);
  };
  visit(el);
  return found;
}

/** "> "-prefixed block, one marker per line. */
function renderBlockquote(el: ElementNode, ctx: RenderContext): string {
  const inner = renderBlocks(el.children, ctx);
  return inner
    .split("\n")
    .map((line) => (line ? `> ${line}` : ">"))
    .join("\n");
}

/** <ul>/<ol> → dash/number items with indented nesting. */
function renderList(el: ElementNode, ctx: RenderContext): string {
  const opt = ctx.opt;
  const ordered = el.tag === "ol";
  let index = el.attrs.start !== undefined ? parseInt(el.attrs.start, 10) || 1 : 1;

  const parts: string[] = [];
  for (const child of el.children) {
    if (child.type === "element" && child.tag === "li") {
      const marker = ordered ? `${index}.` : opt.bulletListMarker;
      index += 1;
      const body = renderListItem(child, marker.length + 1, ctx);
      // A body starting with a newline is a nested block already indented —
      // don't insert the separator space after the marker.
      parts.push(body.startsWith("\n") ? marker + body : marker + " " + body);
    } else if (child.type === "element") {
      // A non-li block element directly in the list (a nested list, a wrapper).
      const extra = renderBlock(child, { ...ctx, listDepth: ctx.listDepth + 1 });
      if (extra && extra.trim()) parts.push(extra);
    }
    // Bare text directly under <ul>/<ol> is malformed; ignored.
  }
  return parts.join("\n");
}

/**
 * Render one <li>. Block children (nested lists, paragraphs) are joined on a
 * single newline, then continuation lines are indented by the marker width so
 * nested lists stay part of the item.
 */
function renderListItem(li: ElementNode, indentWidth: number, ctx: RenderContext): string {
  const blocks: string[] = [];
  let inlineRun: HtmlNode[] = [];

  const flush = (): void => {
    if (inlineRun.length) {
      const text = renderInlineSeq(inlineRun, ctx);
      if (text) blocks.push(text);
      inlineRun = [];
    }
  };

  for (const child of li.children) {
    if (child.type === "text") {
      if (collapse(child.data).trim()) inlineRun.push(child);
    } else if (INLINE_ELEMENTS.has(child.tag)) {
      inlineRun.push(child);
    } else {
      flush();
      const rendered = renderBlock(child, { ...ctx, listDepth: ctx.listDepth + 1 });
      if (rendered && rendered.trim()) blocks.push(rendered.trim());
    }
  }
  flush();

  const body = blocks.join("\n");
  const lines = body.split("\n");
  const indent = (line: string): string =>
    line ? " ".repeat(indentWidth) + line : line;
  // When content starts with a nested list / blockquote, keep it on a
  // continuation line so it stays part of the item instead of gluing onto the
  // marker (e.g. an empty <li> that only wraps a nested list).
  const firstIsBlockMarker = /^(?:[-*+] |\d+[.)] |>)/.test(lines[0] ?? "");
  if (firstIsBlockMarker) return "\n" + lines.map(indent).join("\n");

  const [first, ...rest] = lines;
  return [first ?? "", ...rest.map(indent)].join("\n");
}

/** GFM table: header row + alignment divider + body rows. */
function renderTable(el: ElementNode, ctx: RenderContext): string {
  const rows = collectRows(el);
  if (!rows.length) return "";

  const renderCells = (row: ElementNode[]): string[] =>
    row.map((cell) => renderCell(cell, ctx).replace(/\|/g, "\\|"));

  const header = renderCells(rows[0]);
  const aligns = rows[0].map((cell) =>
    alignmentMarker((cell.attrs.align || "").toLowerCase()),
  );
  const separator = aligns.map((a) => ` ${a} `).join("|");

  const body = rows
    .slice(1)
    .map((row) => `| ${renderCells(row).join(" | ")} |`);
  return `| ${header.join(" | ")} |\n|${separator}|\n${body.join("\n")}`;
}

/** Flatten table rows, honoring thead/tbody/tfoot grouping. */
function collectRows(table: ElementNode): ElementNode[][] {
  const rows: ElementNode[][] = [];
  const visit = (node: ElementNode): void => {
    for (const child of node.children) {
      if (child.type === "text") continue;
      if (child.tag === "tr") rows.push(collectCells(child));
      else visit(child);
    }
  };
  visit(table);
  return rows;
}

/** Gather a row's th/td cells. */
function collectCells(tr: ElementNode): ElementNode[] {
  const cells: ElementNode[] = [];
  const visit = (node: ElementNode): void => {
    for (const child of node.children) {
      if (child.type === "text") continue;
      if (child.tag === "th" || child.tag === "td") cells.push(child);
      else visit(child);
    }
  };
  visit(tr);
  return cells;
}

/** Render a single table cell's inline content. */
function renderCell(cell: ElementNode, ctx: RenderContext): string {
  return renderInlineSeq(cell.children, { ...ctx, inTable: true });
}

/** Map an align attribute to a GFM divider marker. */
function alignmentMarker(align: string): string {
  switch (align) {
    case "left": return ":---";
    case "right": return "---:";
    case "center": return ":---:";
    default: return "---";
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert an HTML string to GitHub-flavored Markdown.
 *
 * @param html The HTML to convert.
 * @param options Conversion options.
 * @returns The Markdown output, always ending with a trailing newline.
 */
export function htmlToMarkdown(
  html: string,
  options: HtmlToMarkdownOptions = {},
): string {
  const ctx: RenderContext = {
    opt: {
      bulletListMarker: options.bulletListMarker ?? "-",
      codeFence: options.codeFence ?? "```",
      tabWidth: options.tabWidth ?? 2,
    },
    inPre: false,
    inTable: false,
    listDepth: 0,
  };

  const source = String(html ?? "");
  const stripped = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
  const tree = buildTree(tokenize(stripped));
  const output = renderBlocks(tree.children, ctx).trim();
  return output ? output + "\n" : "";
}

export default htmlToMarkdown;
