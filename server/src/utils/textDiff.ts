export interface DiffChunk {
  type: "same" | "added" | "removed";
  lines: string[];
}

/**
 * Classic LCS-based line diff. Fine for typical document-length text;
 * not optimized for huge inputs, which is an acceptable tradeoff for a
 * PDF text-comparison tool rather than a general-purpose diff engine.
 */
export function diffLines(a: string, b: string): DiffChunk[] {
  const linesA = a.split("\n");
  const linesB = b.split("\n");
  const n = linesA.length;
  const m = linesB.length;

  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = linesA[i] === linesB[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const chunks: DiffChunk[] = [];
  let i = 0;
  let j = 0;

  function pushLine(type: DiffChunk["type"], line: string) {
    const last = chunks[chunks.length - 1];
    if (last && last.type === type) last.lines.push(line);
    else chunks.push({ type, lines: [line] });
  }

  while (i < n && j < m) {
    if (linesA[i] === linesB[j]) {
      pushLine("same", linesA[i]);
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      pushLine("removed", linesA[i]);
      i++;
    } else {
      pushLine("added", linesB[j]);
      j++;
    }
  }
  while (i < n) pushLine("removed", linesA[i++]);
  while (j < m) pushLine("added", linesB[j++]);

  return chunks;
}
