import { ReactNode } from "react";
import TextUtilityTool from "./TextUtilityTool";
import DynamicOptionsForm from "./DynamicOptionsForm";
import {
  convertCase,
  findAndReplace,
  removeDuplicateLines,
  removeExtraSpaces,
  reverseText,
  slugify,
  generateLoremIpsum,
  diffText,
  formatJson,
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  decodeJwt,
  hashText,
  generateUuid,
  hexToRgb,
  rgbToHsl,
  csvToJson,
  jsonToCsv,
  unixToDate,
  dateToUnix,
  dateDifference,
  markdownToHtml,
  htmlToText,
} from "@/lib/textTools";

const UTILITY_SLUGS = new Set([
  "case-converter",
  "find-and-replace",
  "remove-duplicate-lines",
  "remove-extra-spaces",
  "text-reverser",
  "slug-generator",
  "lorem-ipsum-generator",
  "text-diff-checker",
  "json-formatter",
  "base64-tool",
  "url-encoder",
  "jwt-decoder",
  "hash-generator",
  "uuid-generator",
  "color-converter",
  "csv-to-json",
  "json-to-csv",
  "timestamp-converter",
  "date-difference-calculator",
  "markdown-to-html",
  "html-to-text",
]);

export function isUtilityTool(slug: string): boolean {
  return UTILITY_SLUGS.has(slug);
}

export function renderUtilityTool(slug: string): ReactNode {
  switch (slug) {
    case "case-converter":
      return (
        <TextUtilityTool
          defaultOptions={{ mode: "upper" }}
          renderOptions={(o, s) => (
            <DynamicOptionsForm
              options={o}
              setOptions={s}
              fields={[{ key: "mode", type: "select", label: "Convert to", choices: [
                { value: "upper", label: "UPPERCASE" },
                { value: "lower", label: "lowercase" },
                { value: "title", label: "Title Case" },
                { value: "sentence", label: "Sentence case" },
              ] }]}
            />
          )}
          run={(input, o) => convertCase(input, (o.mode as "upper" | "lower" | "title" | "sentence") ?? "upper")}
        />
      );

    case "find-and-replace":
      return (
        <TextUtilityTool
          renderOptions={(o, s) => (
            <DynamicOptionsForm
              options={o}
              setOptions={s}
              fields={[
                { key: "find", type: "text", label: "Find" },
                { key: "replace", type: "text", label: "Replace with" },
                { key: "caseSensitive", type: "select", label: "Case sensitive?", choices: [{ value: "no", label: "No" }, { value: "yes", label: "Yes" }] },
              ]}
            />
          )}
          run={(input, o) => findAndReplace(input, (o.find as string) ?? "", (o.replace as string) ?? "", o.caseSensitive === "yes")}
        />
      );

    case "remove-duplicate-lines":
      return <TextUtilityTool run={(input) => removeDuplicateLines(input)} />;

    case "remove-extra-spaces":
      return <TextUtilityTool run={(input) => removeExtraSpaces(input)} />;

    case "text-reverser":
      return (
        <TextUtilityTool
          defaultOptions={{ mode: "characters" }}
          renderOptions={(o, s) => (
            <DynamicOptionsForm
              options={o}
              setOptions={s}
              fields={[{ key: "mode", type: "select", label: "Reverse by", choices: [
                { value: "characters", label: "Characters" },
                { value: "words", label: "Words" },
                { value: "lines", label: "Lines" },
              ] }]}
            />
          )}
          run={(input, o) => reverseText(input, (o.mode as "characters" | "words" | "lines") ?? "characters")}
        />
      );

    case "slug-generator":
      return <TextUtilityTool run={(input) => slugify(input)} inputLabel="Text" outputLabel="Slug" />;

    case "lorem-ipsum-generator":
      return (
        <TextUtilityTool
          noInput
          defaultOptions={{ paragraphs: 3, wordsPerParagraph: 40 }}
          renderOptions={(o, s) => (
            <DynamicOptionsForm
              options={o}
              setOptions={s}
              fields={[
                { key: "paragraphs", type: "number", label: "Paragraphs", min: 1, max: 20 },
                { key: "wordsPerParagraph", type: "number", label: "Words per paragraph", min: 5, max: 200 },
              ]}
            />
          )}
          run={(_input, o) => generateLoremIpsum((o.paragraphs as number) ?? 3, (o.wordsPerParagraph as number) ?? 40)}
          actionLabel="Generate"
        />
      );

    case "text-diff-checker":
      return (
        <TextUtilityTool
          inputLabel="Original text"
          renderOptions={(o, s) => (
            <DynamicOptionsForm options={o} setOptions={s} fields={[{ key: "textB", type: "textarea", label: "Changed text", rows: 8 }]} />
          )}
          run={(input, o) => {
            const chunks = diffText(input, (o.textB as string) ?? "");
            return chunks.map((c) => c.lines.map((l) => `${c.type === "added" ? "+ " : c.type === "removed" ? "- " : "  "}${l}`).join("\n")).join("\n");
          }}
          actionLabel="Compare"
        />
      );

    case "json-formatter":
      return (
        <TextUtilityTool
          inputLabel="JSON"
          inputPlaceholder='{"example": true}'
          defaultOptions={{ minify: "no" }}
          renderOptions={(o, s) => (
            <DynamicOptionsForm options={o} setOptions={s} fields={[{ key: "minify", type: "select", label: "Minify?", choices: [{ value: "no", label: "No — pretty print" }, { value: "yes", label: "Yes — minify" }] }]} />
          )}
          run={(input, o) => formatJson(input, o.minify === "yes")}
        />
      );

    case "base64-tool":
      return (
        <TextUtilityTool
          defaultOptions={{ mode: "encode" }}
          renderOptions={(o, s) => (
            <DynamicOptionsForm options={o} setOptions={s} fields={[{ key: "mode", type: "select", label: "Action", choices: [{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }] }]} />
          )}
          run={(input, o) => (o.mode === "decode" ? base64Decode(input) : base64Encode(input))}
        />
      );

    case "url-encoder":
      return (
        <TextUtilityTool
          defaultOptions={{ mode: "encode" }}
          renderOptions={(o, s) => (
            <DynamicOptionsForm options={o} setOptions={s} fields={[{ key: "mode", type: "select", label: "Action", choices: [{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }] }]} />
          )}
          run={(input, o) => (o.mode === "decode" ? urlDecode(input) : urlEncode(input))}
        />
      );

    case "jwt-decoder":
      return (
        <TextUtilityTool
          inputLabel="JWT"
          inputPlaceholder="eyJhbGciOi..."
          run={(input) => JSON.stringify(decodeJwt(input), null, 2)}
        />
      );

    case "hash-generator":
      return (
        <TextUtilityTool
          defaultOptions={{ algorithm: "SHA-256" }}
          renderOptions={(o, s) => (
            <DynamicOptionsForm options={o} setOptions={s} fields={[{ key: "algorithm", type: "select", label: "Algorithm", choices: [
              { value: "SHA-1", label: "SHA-1" },
              { value: "SHA-256", label: "SHA-256" },
              { value: "SHA-384", label: "SHA-384" },
              { value: "SHA-512", label: "SHA-512" },
            ] }]}
            />
          )}
          run={(input, o) => hashText(input, (o.algorithm as "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512") ?? "SHA-256")}
        />
      );

    case "uuid-generator":
      return (
        <TextUtilityTool
          noInput
          defaultOptions={{ count: 5 }}
          renderOptions={(o, s) => (
            <DynamicOptionsForm options={o} setOptions={s} fields={[{ key: "count", type: "number", label: "How many?", min: 1, max: 100 }]} />
          )}
          run={(_input, o) => generateUuid((o.count as number) ?? 5)}
          actionLabel="Generate"
        />
      );

    case "color-converter":
      return (
        <TextUtilityTool
          inputLabel="Hex color"
          inputPlaceholder="#1857e0"
          rows={1}
          run={(input) => {
            const { r, g, b } = hexToRgb(input.trim());
            const { h, s, l } = rgbToHsl(r, g, b);
            return `RGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${h}, ${s}%, ${l}%)`;
          }}
        />
      );

    case "csv-to-json":
      return <TextUtilityTool inputLabel="CSV" inputPlaceholder={"name,age\nAlice,30\nBob,25"} run={(input) => csvToJson(input)} />;

    case "json-to-csv":
      return <TextUtilityTool inputLabel="JSON array" inputPlaceholder='[{"name":"Alice","age":30}]' run={(input) => jsonToCsv(input)} />;

    case "timestamp-converter":
      return (
        <TextUtilityTool
          defaultOptions={{ mode: "toDate" }}
          renderOptions={(o, s) => (
            <DynamicOptionsForm options={o} setOptions={s} fields={[{ key: "mode", type: "select", label: "Direction", choices: [
              { value: "toDate", label: "Unix timestamp → date" },
              { value: "toUnix", label: "Date → Unix timestamp" },
            ] }]}
            />
          )}
          inputLabel="Input"
          inputPlaceholder="1700000000 or 2024-01-01T00:00:00Z"
          rows={2}
          run={(input, o) => (o.mode === "toUnix" ? String(dateToUnix(input.trim())) : unixToDate(Number(input.trim())))}
        />
      );

    case "date-difference-calculator":
      return (
        <TextUtilityTool
          noInput
          renderOptions={(o, s) => (
            <DynamicOptionsForm options={o} setOptions={s} fields={[
              { key: "dateA", type: "text", label: "First date (e.g. 2024-01-01)" },
              { key: "dateB", type: "text", label: "Second date" },
            ]} />
          )}
          run={(_input, o) => {
            const { days, weeks, months } = dateDifference((o.dateA as string) ?? "", (o.dateB as string) ?? "");
            return `${days} days\n${weeks} weeks\n${months} months`;
          }}
          actionLabel="Calculate"
        />
      );

    case "markdown-to-html":
      return <TextUtilityTool inputLabel="Markdown" inputPlaceholder={"# Heading\n\nSome **bold** text."} run={(input) => markdownToHtml(input)} />;

    case "html-to-text":
      return <TextUtilityTool inputLabel="HTML" inputPlaceholder="<p>Hello <strong>world</strong></p>" run={(input) => htmlToText(input)} />;

    default:
      return null;
  }
}
