import automotiveDictionary from '../data/automotive-dictionary.json';

// 자동차 용어집 타입 정의
export interface AutomotiveTerm {
  english: string;
  category: string;
  description: string;
}

export interface AutomotiveDictionary {
  [category: string]: {
    [koreanTerm: string]: AutomotiveTerm;
  };
}

// 타입 캐스팅
const dictionary = automotiveDictionary as AutomotiveDictionary;

/**
 * 모든 자동차 용어를 가져오는 함수
 */
export const getAllTerms = (): { korean: string; data: AutomotiveTerm }[] => {
  const allTerms: { korean: string; data: AutomotiveTerm }[] = [];
  
  Object.values(dictionary).forEach(category => {
    Object.entries(category).forEach(([korean, data]) => {
      allTerms.push({ korean, data });
    });
  });
  
  return allTerms;
};

/**
 * 카테고리별 용어를 가져오는 함수
 */
export const getTermsByCategory = (category: string): { korean: string; data: AutomotiveTerm }[] => {
  const categoryData = dictionary[category];
  if (!categoryData) return [];
  
  return Object.entries(categoryData).map(([korean, data]) => ({
    korean,
    data
  }));
};

/**
 * 한국어 용어로 검색하는 함수
 */
export const searchKoreanTerm = (searchTerm: string): { korean: string; data: AutomotiveTerm } | null => {
  for (const category of Object.values(dictionary)) {
    for (const [korean, data] of Object.entries(category)) {
      if (korean.includes(searchTerm)) {
        return { korean, data };
      }
    }
  }
  return null;
};

/**
 * 영어 용어로 검색하는 함수
 */
export const searchEnglishTerm = (searchTerm: string): { korean: string; data: AutomotiveTerm } | null => {
  for (const category of Object.values(dictionary)) {
    for (const [korean, data] of Object.entries(category)) {
      if (data.english.toLowerCase().includes(searchTerm.toLowerCase())) {
        return { korean, data };
      }
    }
  }
  return null;
};

/**
 * 텍스트에서 자동차 관련 용어를 찾는 함수
 */
export const findAutomotiveTermsInText = (text: string): { korean: string; data: AutomotiveTerm }[] => {
  const foundTerms: { korean: string; data: AutomotiveTerm }[] = [];
  const allTerms = getAllTerms();
  
  allTerms.forEach(term => {
    if (text.includes(term.korean) || 
        text.toLowerCase().includes(term.data.english.toLowerCase())) {
      foundTerms.push(term);
    }
  });
  
  return foundTerms;
};

/**
 * 모든 카테고리 목록을 가져오는 함수
 */
export const getCategories = (): string[] => {
  return Object.keys(dictionary);
};

/**
 * 카테고리의 한국어 이름을 가져오는 함수
 */
export const getCategoryDisplayName = (category: string): string => {
  const categoryNames: { [key: string]: string } = {
    engine: '엔진',
    transmission: '변속기',
    brakes: '브레이크',
    suspension: '서스펜션',
    wheels_tires: '바퀴/타이어',
    electrical: '전기 시스템',
    cooling: '냉각 시스템',
    lubrication: '윤활 시스템',
    fuel_system: '연료 시스템',
    exhaust: '배기 시스템',
    body: '차체',
    interior: '내장',
    maintenance: '정비',
    problems: '고장/문제',
    tools: '공구'
  };
  
  return categoryNames[category] || category;
};

/**
 * 음성 인식 텍스트에서 자동차 용어를 하이라이트하는 함수
 */
export const highlightAutomotiveTerms = (text: string): string => {
  let highlightedText = text;
  const foundTerms = findAutomotiveTermsInText(text);
  
  // 중복 제거
  const uniqueTerms = foundTerms.filter((term, index, self) => 
    index === self.findIndex(t => t.korean === term.korean)
  );
  
  uniqueTerms.forEach(term => {
    const regex = new RegExp(`(${term.korean})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  });
  
  return highlightedText;
};

export default dictionary;
