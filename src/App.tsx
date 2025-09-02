import { useState, useEffect, useRef } from 'react'
import './App.css'
import type { SpeechRecognition, SpeechRecognitionEvent, SpeechRecognitionErrorEvent } from './types/speech'
import { 
  findAutomotiveTermsInText, 
  highlightAutomotiveTerms,
  getCategories,
  getCategoryDisplayName,
  getTermsByCategory,
  type AutomotiveTerm
} from './utils/automotiveDictionary'
import {
  findPotentialReplacements,
  replaceWordInText,
} from './utils/fuzzySearch'

// PWA 관련 타입 정의
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

function App() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [foundTerms, setFoundTerms] = useState<Array<{ korean: string; data: AutomotiveTerm }>>([])
  const [showDictionary, setShowDictionary] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [potentialReplacements, setPotentialReplacements] = useState<Array<{
    original: string;
    replacement: string;
    position: { start: number; end: number };
    score: number;
    data: AutomotiveTerm;
  }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  
  // PWA 설치 핸들러
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  // PWA 설치 관련 useEffect
  useEffect(() => {
    // PWA 설치 가능 여부 체크
    const checkPWAInstallability = () => {
      // 이미 설치된 앱인지 확인
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallButton(false);
        return;
      }
      
      // beforeinstallprompt 이벤트 리스너
      const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallButton(true);
      };
      
      // appinstalled 이벤트 리스너
      const handleAppInstalled = () => {
        setShowInstallButton(false);
      };
      
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
      
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    };
    
    checkPWAInstallability();
  }, []);

  useEffect(() => {
    // Web Speech API 지원 여부 확인
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (SpeechRecognition) {
      setIsSupported(true)
      
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'ko-KR' // 한국어 설정
      
      recognition.onstart = () => {
        setIsListening(true)
      }
      
      recognition.onend = () => {
        setIsListening(false)
      }
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''
        let finalText = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          
          if (event.results[i].isFinal) {
            finalText += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        setTranscript(interimTranscript)
        
        if (finalText) {
          setFinalTranscript(prev => {
            const newText = prev + finalText + ' ';
            
            // 수동 교정을 위한 제안 찾기
            const suggestions = findPotentialReplacements(newText);
            setPotentialReplacements(suggestions);
            
            // 자동차 관련 용어 찾기
            const terms = findAutomotiveTermsInText(newText);
            setFoundTerms(terms);
            
            return newText;
          });
        }
      }
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }
      
      recognitionRef.current = recognition
    } else {
      setIsSupported(false)
    }
  }, []) // 의존성 배열을 빈 배열로 변경하여 컴포넌트 마운트시에만 실행

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const clearTranscript = () => {
    setTranscript('')
    setFinalTranscript('')
    setPotentialReplacements([])
    setFoundTerms([])
  }

  const copyToClipboard = () => {
    // 인라인 제안이 있는 경우 원본 텍스트만 복사
    const textToCopy = finalTranscript + transcript
    navigator.clipboard.writeText(textToCopy).then(() => {
      alert('텍스트가 클립보드에 복사되었습니다!')
    })
  }

  const applyReplacement = (original: string, replacement: string, replaceAll: boolean = false) => {
    const newText = replaceWordInText(finalTranscript, original, replacement, replaceAll);
    setFinalTranscript(newText);
    
    // 적용된 교정을 목록에서 제거
    setPotentialReplacements(prev => 
      prev.filter(r => r.original !== original)
    );
    
    // 자동차 관련 용어 다시 찾기
    const terms = findAutomotiveTermsInText(newText);
    setFoundTerms(terms);
  }

  const dismissSuggestion = (original: string) => {
    setPotentialReplacements(prev => 
      prev.filter(r => r.original !== original)
    );
  }

  if (!isSupported) {
    return (
      <div className="app-container">
        <h1>음성 인식 받아쓰기</h1>
        <div className="error-message">
          <p>죄송합니다. 이 브라우저는 Web Speech API를 지원하지 않습니다.</p>
          <p>Chrome, Edge, Safari 등의 최신 브라우저를 사용해주세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <h1>🎙️ 음성 인식 받아쓰기</h1>
      
      <div className="controls">
        <button 
          onClick={startListening} 
          disabled={isListening}
          className={`control-btn start-btn ${isListening ? 'disabled' : ''}`}
        >
          {isListening ? '듣는 중...' : '🎙️ 녹음 시작'}
        </button>
        
        <button 
          onClick={stopListening} 
          disabled={!isListening}
          className={`control-btn stop-btn ${!isListening ? 'disabled' : ''}`}
        >
          ⏹️ 녹음 중지
        </button>
        
        <button 
          onClick={clearTranscript}
          className="control-btn clear-btn"
        >
          🗑️ 텍스트 지우기
        </button>
        
        <button 
          onClick={copyToClipboard}
          className="control-btn copy-btn"
          disabled={!finalTranscript && !transcript}
        >
          📋 복사하기
        </button>
        
        <button 
          onClick={() => setShowDictionary(!showDictionary)}
          className="control-btn dictionary-btn"
        >
          📚 자동차 용어집
        </button>
        
        <button 
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="control-btn suggestions-btn"
          disabled={potentialReplacements.length === 0}
        >
          🔍 교정 제안 ({potentialReplacements.length})
        </button>
        
        {showInstallButton && (
          <button 
            id="install-button"
            className="control-btn install-btn"
            title="앱으로 설치하기"
            onClick={handleInstallClick}
          >
            📱 앱 설치
          </button>
        )}
      </div>

      <div className="status">
        {isListening && (
          <div className="listening-indicator">
            <div className="pulse"></div>
            <span>음성을 듣고 있습니다...</span>
          </div>
        )}
      </div>

      <div className="transcript-container">
        <h3>받아쓴 텍스트:</h3>
        <div className="transcript-box">
          <span 
            className="final-transcript"
            dangerouslySetInnerHTML={{ 
              __html: highlightAutomotiveTerms(finalTranscript) 
            }}
          />
          <span className="interim-transcript">{transcript}</span>
          {!finalTranscript && !transcript && (
            <span className="placeholder">
              위의 "녹음 시작" 버튼을 클릭하고 말씀해보세요.
            </span>
          )}
        </div>
        
        {foundTerms.length > 0 && (
          <div className="found-terms">
            <h4>🔍 발견된 자동차 용어:</h4>
            <div className="terms-list">
              {foundTerms.map((term, index) => (
                <div key={index} className="term-item">
                  <span className="term-korean">{term.korean}</span>
                  <span className="term-english">({term.data.english})</span>
                  <span className="term-description">{term.data.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showSuggestions && potentialReplacements.length > 0 && (
        <div className="suggestions-container">
          <h3>🔧 교정 제안</h3>
          <div className="suggestions-list">
            {potentialReplacements.map((suggestion, index) => (
              <div key={index} className="suggestion-item">
                <div className="suggestion-header">
                  <span className="original-word">"{suggestion.original}"</span>
                  <span className="arrow">→</span>
                  <span className="suggested-word">"{suggestion.replacement}"</span>
                  <span className="confidence">정확도: {Math.round((1 - suggestion.score) * 100)}%</span>
                </div>
                <div className="suggestion-description">
                  {suggestion.data.description}
                </div>
                <div className="suggestion-actions">
                  <button 
                    onClick={() => applyReplacement(suggestion.original, suggestion.replacement, false)}
                    className="apply-btn apply-once"
                  >
                    한 번만 적용
                  </button>
                  <button 
                    onClick={() => applyReplacement(suggestion.original, suggestion.replacement, true)}
                    className="apply-btn apply-all"
                  >
                    모두 적용
                  </button>
                  <button 
                    onClick={() => dismissSuggestion(suggestion.original)}
                    className="dismiss-btn"
                  >
                    무시
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showDictionary && (
        <div className="dictionary-container">
          <h3>📚 자동차 용어집</h3>
          <div className="category-selector">
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="all">전체 카테고리</option>
              {getCategories().map(category => (
                <option key={category} value={category}>
                  {getCategoryDisplayName(category)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="dictionary-content">
            {selectedCategory === 'all' ? (
              getCategories().map(category => (
                <div key={category} className="category-section">
                  <h4>{getCategoryDisplayName(category)}</h4>
                  <div className="terms-grid">
                    {getTermsByCategory(category).map((term, index) => (
                      <div key={index} className="dictionary-term">
                        <div className="term-header">
                          <span className="term-korean">{term.korean}</span>
                          <span className="term-english">({term.data.english})</span>
                        </div>
                        <div className="term-description">{term.data.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="category-section">
                <h4>{getCategoryDisplayName(selectedCategory)}</h4>
                <div className="terms-grid">
                  {getTermsByCategory(selectedCategory).map((term, index) => (
                    <div key={index} className="dictionary-term">
                      <div className="term-header">
                        <span className="term-korean">{term.korean}</span>
                        <span className="term-english">({term.data.english})</span>
                      </div>
                      <div className="term-description">{term.data.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="info">
        <p>💡 팁: 한국어로 말씀하시면 자동으로 텍스트로 변환됩니다.</p>
        <p>🔒 개인정보 보호: 음성 데이터는 브라우저에서만 처리되며 외부로 전송되지 않습니다.</p>
      </div>
    </div>
  )
}

export default App
