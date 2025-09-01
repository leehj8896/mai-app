# 🎙️ 음성 인식 받아쓰기 - 자동차 정비 전용

Web Speech API를 활용한 자동차 정비 전문 음성 인식 받아쓰기 애플리케이션입니다.

## ✨ 주요 기능

- 🎙️ **실시간 음성 인식**: Web Speech API를 사용한 한국어 음성을 텍스트로 변환
- 🔧 **자동차 용어 특화**: 300+ 자동차 부품/정비 용어 데이터베이스
- 🤖 **스마트 자동 교정**: Fuse.js 퍼지 검색으로 유사한 자동차 용어 자동 치환
- 📚 **통합 용어집**: 카테고리별 자동차 용어집 제공
- 💡 **용어 하이라이트**: 자동차 관련 용어 자동 강조 표시
- 📋 **클립보드 복사**: 받아쓴 텍스트 원클릭 복사

## 🚀 라이브 데모

GitHub Pages에서 앱을 체험해보세요: [https://leehj8896.github.io/mai-app/](https://leehj8896.github.io/mai-app/)

## 🛠️ 기술 스택

- **Frontend**: React 19 + TypeScript
- **빌드 도구**: Vite
- **음성 인식**: Web Speech API
- **퍼지 검색**: Fuse.js
- **스타일링**: CSS3 (Gradient, Animation)
- **배포**: GitHub Pages + GitHub Actions

## 📦 로컬 개발 환경 설정

### 사전 요구사항
- Node.js 18+ 
- npm 또는 yarn

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/leehj8896/mai-app.git
cd mai-app

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

개발 서버가 실행되면 http://localhost:5173에서 앱을 확인할 수 있습니다.

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 🌐 GitHub Pages 배포

이 프로젝트는 GitHub Actions를 통해 자동으로 GitHub Pages에 배포됩니다.

### 자동 배포 설정

1. **GitHub Repository 설정**
   - Repository → Settings → Pages
   - Source: "GitHub Actions" 선택

2. **자동 배포 트리거**
   - `main` 브랜치에 push할 때마다 자동 배포
   - 수동 배포도 GitHub Actions 탭에서 가능

### 배포 워크플로우

`.github/workflows/pages.yml` 파일이 다음 작업을 자동으로 수행합니다:

1. Node.js 18 환경 설정
2. 의존성 설치 (`npm ci`)
3. TypeScript 컴파일 및 Vite 빌드
4. SPA 라우팅을 위한 404.html 복사
5. GitHub Pages에 배포

### SPA 라우팅 지원

GitHub Pages에서 SPA 라우팅이 제대로 작동하도록:
- `public/404.html`이 자동으로 `dist/404.html`로 복사됩니다
- URL 리다이렉션 스크립트가 포함되어 있습니다

## 🎯 사용 방법

1. **음성 인식 시작**: "🎙️ 녹음 시작" 버튼 클릭
2. **브라우저 권한**: 마이크 접근 권한 허용
3. **음성 입력**: 한국어로 자동차 관련 내용 말하기
4. **자동 교정**: 유사한 자동차 용어로 자동 치환
5. **수동 교정**: "교정 제안" 버튼으로 추가 검토
6. **용어집 확인**: "자동차 용어집" 버튼으로 전문 용어 학습

## 🔧 개발 가이드

### 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
├── data/               # 자동차 용어집 JSON 데이터
├── types/              # TypeScript 타입 정의
├── utils/              # 유틸리티 함수
│   ├── automotiveDictionary.ts  # 용어집 관련 함수
│   └── fuzzySearch.ts          # 퍼지 검색 기능
├── App.tsx            # 메인 애플리케이션
├── App.css            # 스타일시트
└── main.tsx           # 엔트리 포인트
```

### 자동차 용어집 확장

`src/data/automotive-dictionary.json` 파일에 새로운 용어를 추가할 수 있습니다:

```json
{
  "category_name": {
    "한국어_용어": {
      "english": "영어명",
      "category": "카테고리",
      "description": "용어 설명"
    }
  }
}
```

## 🌟 브라우저 지원

- ✅ Chrome (권장)
- ✅ Edge
- ✅ Safari
- ❌ Firefox (Web Speech API 제한적 지원)

## 📄 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트에 대한 문의사항이나 제안사항이 있으시면 GitHub Issues를 이용해주세요.
