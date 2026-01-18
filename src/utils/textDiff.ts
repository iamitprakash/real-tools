/**
 * Represents a diff segment
 */
export interface DiffSegment {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

/**
 * Simple line-based diff algorithm
 * Compares two texts and returns segments with their change types
 */
export function computeDiff(text1: string, text2: string): DiffSegment[] {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');
  
  const segments: DiffSegment[] = [];
  
  let i = 0;
  let j = 0;
  
  while (i < lines1.length || j < lines2.length) {
    if (i >= lines1.length) {
      // Only text2 has lines left
      segments.push({ type: 'added', text: lines2[j] });
      j++;
    } else if (j >= lines2.length) {
      // Only text1 has lines left
      segments.push({ type: 'removed', text: lines1[i] });
      i++;
    } else if (lines1[i] === lines2[j]) {
      // Lines are identical
      segments.push({ type: 'unchanged', text: lines1[i] });
      i++;
      j++;
    } else {
      // Lines are different - check if line from text2 appears later in text1
      const nextMatchInText1 = lines1.slice(i + 1).indexOf(lines2[j]);
      const nextMatchInText2 = lines2.slice(j + 1).indexOf(lines1[i]);
      
      if (nextMatchInText1 >= 0 && (nextMatchInText2 < 0 || nextMatchInText1 < nextMatchInText2)) {
        // Line from text1 was removed
        segments.push({ type: 'removed', text: lines1[i] });
        i++;
      } else if (nextMatchInText2 >= 0 && (nextMatchInText1 < 0 || nextMatchInText2 < nextMatchInText1)) {
        // Line from text2 was added
        segments.push({ type: 'added', text: lines2[j] });
        j++;
      } else {
        // Both lines changed
        segments.push({ type: 'removed', text: lines1[i] });
        segments.push({ type: 'added', text: lines2[j] });
        i++;
        j++;
      }
    }
  }
  
  return segments;
}

/**
 * Character-level diff for inline differences
 */
export function computeInlineDiff(text1: string, text2: string): DiffSegment[] {
  const segments: DiffSegment[] = [];
  
  let i = 0;
  let j = 0;
  
  while (i < text1.length || j < text2.length) {
    if (i >= text1.length) {
      // Only text2 has characters left
      segments.push({ type: 'added', text: text2.slice(j) });
      break;
    } else if (j >= text2.length) {
      // Only text1 has characters left
      segments.push({ type: 'removed', text: text1.slice(i) });
      break;
    } else if (text1[i] === text2[j]) {
      // Characters match - find the longest common substring
      let commonLen = 0;
      while (i + commonLen < text1.length && 
             j + commonLen < text2.length && 
             text1[i + commonLen] === text2[j + commonLen]) {
        commonLen++;
      }
      
      if (commonLen > 0) {
        segments.push({ type: 'unchanged', text: text1.slice(i, i + commonLen) });
        i += commonLen;
        j += commonLen;
      }
    } else {
      // Characters differ - find the next match
      const nextMatchInText1 = text1.indexOf(text2[j], i + 1);
      const nextMatchInText2 = text2.indexOf(text1[i], j + 1);
      
      if (nextMatchInText1 >= 0 && (nextMatchInText2 < 0 || nextMatchInText1 - i < nextMatchInText2 - j)) {
        // Character from text1 was removed
        segments.push({ type: 'removed', text: text1[i] });
        i++;
      } else if (nextMatchInText2 >= 0 && (nextMatchInText1 < 0 || nextMatchInText2 - j < nextMatchInText1 - i)) {
        // Character from text2 was added
        segments.push({ type: 'added', text: text2[j] });
        j++;
      } else {
        // Both characters changed
        segments.push({ type: 'removed', text: text1[i] });
        segments.push({ type: 'added', text: text2[j] });
        i++;
        j++;
      }
    }
  }
  
  return segments;
}

/**
 * Get diff statistics
 */
export function getDiffStats(text1: string, text2: string): {
  linesAdded: number;
  linesRemoved: number;
  linesUnchanged: number;
  charactersAdded: number;
  charactersRemoved: number;
  similarity: number;
} {
  const diff = computeDiff(text1, text2);
  
  let linesAdded = 0;
  let linesRemoved = 0;
  let linesUnchanged = 0;
  let charactersAdded = 0;
  let charactersRemoved = 0;
  
  diff.forEach(segment => {
    if (segment.type === 'added') {
      linesAdded++;
      charactersAdded += segment.text.length;
    } else if (segment.type === 'removed') {
      linesRemoved++;
      charactersRemoved += segment.text.length;
    } else {
      linesUnchanged++;
    }
  });
  
  const totalChars = text1.length + text2.length;
  const unchangedChars = diff
    .filter(s => s.type === 'unchanged')
    .reduce((sum, s) => sum + s.text.length, 0);
  const similarity = totalChars > 0 ? (unchangedChars * 2) / totalChars : 1;
  
  return {
    linesAdded,
    linesRemoved,
    linesUnchanged,
    charactersAdded,
    charactersRemoved,
    similarity: Math.round(similarity * 100) / 100
  };
}
