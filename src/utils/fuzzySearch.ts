import Fuse from 'fuse.js';
import { getAllTerms, type AutomotiveTerm } from './automotiveDictionary';

// 퍼지 검색 옵션 설정
const fuseOptions = {
  keys: ['korean', 'data.english'],
  threshold: 0.6, // 0에 가까울수록 정확한 매치, 1에 가까울수록 느슨한 매치
  minMatchCharLength: 2,
  includeScore: true,
  shouldSort: true,
  location: 0,
  distance: 100,
};

// 검색용 데이터 구조
interface SearchableItem {
  korean: string;
  data: AutomotiveTerm;
}

// Fuse 인스턴스 생성
let fuseInstance: Fuse<SearchableItem> | null = null;

const initializeFuse = () => {
  if (!fuseInstance) {
    const searchableData = getAllTerms();
    fuseInstance = new Fuse(searchableData, fuseOptions);
  }
  return fuseInstance;
};

/**
 * 단어의 유사도를 기반으로 자동차 용어를 검색
 */
export const fuzzySearchAutomotiveTerm = (word: string): { 
  korean: string; 
  data: AutomotiveTerm; 
  score: number 
} | null => {
  const fuse = initializeFuse();
  const results = fuse.search(word);
  
  if (results.length > 0 && results[0].score !== undefined && results[0].score < 0.6) {
    return {
      korean: results[0].item.korean,
      data: results[0].item.data,
      score: results[0].score
    };
  }
  
  return null;
};

/**
 * 텍스트에서 단어를 분리하고 각 단어에 대해 퍼지 검색 수행
 */
export const findPotentialReplacements = (text: string): Array<{
  original: string;
  replacement: string;
  position: { start: number; end: number };
  score: number;
  data: AutomotiveTerm;
}> => {
  const potentialReplacements: Array<{
    original: string;
    replacement: string;
    position: { start: number; end: number };
    score: number;
    data: AutomotiveTerm;
  }> = [];

  // 한글, 영문, 숫자를 포함한 단어 패턴
  const wordPattern = /[가-힣a-zA-Z0-9]+/g;
  let match;

  while ((match = wordPattern.exec(text)) !== null) {
    const word = match[0];
    const start = match.index;
    const end = start + word.length;

    // 너무 짧은 단어는 제외
    if (word.length < 2) continue;

    const searchResult = fuzzySearchAutomotiveTerm(word);
    
    if (searchResult && searchResult.korean !== word) {
      potentialReplacements.push({
        original: word,
        replacement: searchResult.korean,
        position: { start, end },
        score: searchResult.score,
        data: searchResult.data
      });
    }
  }

  return potentialReplacements;
};

/**
 * 텍스트에서 유사한 용어를 자동으로 치환
 */
export const autoReplaceText = (text: string, threshold: number = 0.4): {
  newText: string;
  replacements: Array<{
    original: string;
    replacement: string;
    score: number;
    data: AutomotiveTerm;
  }>;
} => {
  const potentialReplacements = findPotentialReplacements(text);
  
  // 임계값 이하의 점수(더 정확한 매치)만 자동 치환
  const autoReplacements = potentialReplacements.filter(r => r.score <= threshold);
  
  // 위치 역순으로 정렬하여 뒤에서부터 치환 (인덱스 변화 방지)
  autoReplacements.sort((a, b) => b.position.start - a.position.start);
  
  let newText = text;
  const appliedReplacements: Array<{
    original: string;
    replacement: string;
    score: number;
    data: AutomotiveTerm;
  }> = [];

  autoReplacements.forEach(replacement => {
    newText = newText.substring(0, replacement.position.start) + 
              replacement.replacement + 
              newText.substring(replacement.position.end);
    
    appliedReplacements.push({
      original: replacement.original,
      replacement: replacement.replacement,
      score: replacement.score,
      data: replacement.data
    });
  });

  return {
    newText,
    replacements: appliedReplacements.reverse() // 원래 순서로 복원
  };
};

/**
 * 수동 단어 치환 (사용자가 선택한 치환)
 */
export const replaceWordInText = (
  text: string, 
  original: string, 
  replacement: string,
  replaceAll: boolean = false
): string => {
  if (replaceAll) {
    const globalRegex = new RegExp(escapeRegExp(original), 'g');
    return text.replace(globalRegex, replacement);
  } else {
    return text.replace(original, replacement);
  }
};

/**
 * 정규식 특수문자 이스케이프
 */
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * 비슷한 용어들을 그룹핑하여 제안
 */
export const getSimilarTermsSuggestions = (word: string, limit: number = 5): Array<{
  korean: string;
  data: AutomotiveTerm;
  score: number;
}> => {
  const fuse = initializeFuse();
  const results = fuse.search(word);
  
  return results
    .slice(0, limit)
    .filter(result => result.score !== undefined && result.score < 0.8)
    .map(result => ({
      korean: result.item.korean,
      data: result.item.data,
      score: result.score!
    }));
};

/**
 * 텍스트에서 단어별로 유사한 후보들을 찾아 괄호 형태로 표시
 */
export const addSuggestionsToText = (text: string): string => {
  // 한글, 영문, 숫자를 포함한 단어 패턴
  const wordPattern = /[가-힣a-zA-Z0-9]+/g;
  let result = text;
  let offset = 0;

  const matches = Array.from(text.matchAll(wordPattern));
  
  for (const match of matches) {
    const word = match[0];
    const originalStart = match.index!;
    const originalEnd = originalStart + word.length;
    
    // 너무 짧은 단어는 제외
    if (word.length < 2) continue;

    // 유사한 용어들 찾기 (원본 제외하고 가장 유사한 1개만)
    const suggestions = getSimilarTermsSuggestions(word, 2)
      .filter(suggestion => suggestion.korean !== word && suggestion.score < 0.7)
      .slice(0, 1); // 가장 유사한 1개만 선택

    if (suggestions.length > 0) {
      const bestSuggestion = suggestions[0].korean;
      const replacement = `${word}<span class="suggestion-bracket">(또는 ${bestSuggestion})</span>`;
      
      // 오프셋을 고려하여 위치 계산
      const currentStart = originalStart + offset;
      const currentEnd = originalEnd + offset;
      
      result = result.substring(0, currentStart) + replacement + result.substring(currentEnd);
      offset += replacement.length - word.length;
    }
  }

  return result;
};

/**
 * 특정 단어에 대한 후보들만 반환 (클릭 시 상세 보기용)
 */
export const getWordSuggestions = (word: string): Array<{
  korean: string;
  data: AutomotiveTerm;
  score: number;
}> => {
  return getSimilarTermsSuggestions(word, 5)
    .filter(suggestion => suggestion.score < 0.8);
};
