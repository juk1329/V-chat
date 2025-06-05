import json
import os
import requests
from bs4 import BeautifulSoup
import openai
from dotenv import load_dotenv

load_dotenv()

class PersonaManager:
    """페르소나 데이터 관리 클래스"""
    
    def __init__(self, personas_file='data/personas.json'):
        self.personas_file = personas_file
        self.personas_data = {}
        self.current_persona = None
        # OpenAI 클라이언트 초기화
        self.openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.load_personas()
    
    def load_personas(self):
        """페르소나 데이터 로드"""
        try:
            if os.path.exists(self.personas_file):
                with open(self.personas_file, 'r', encoding='utf-8') as f:
                    self.personas_data = json.load(f)
            else:
                print(f"❌ 페르소나 데이터 파일을 찾을 수 없습니다: {self.personas_file}")
                self.personas_data = {}
        except Exception as e:
            print(f"⚠️ 페르소나 데이터 로드 오류: {str(e)}")
            self.personas_data = {}
    
    def save_personas(self):
        """페르소나 데이터 저장"""
        try:
            os.makedirs('data', exist_ok=True)
            with open(self.personas_file, 'w', encoding='utf-8') as f:
                json.dump(self.personas_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"⚠️ 페르소나 데이터 저장 오류: {str(e)}")
    
    def get_available_personas(self):
        """사용 가능한 페르소나 목록 반환"""
        return list(self.personas_data.keys())
    
    def select_persona(self, persona_name):
        """페르소나 선택"""
        if persona_name in self.personas_data:
            self.current_persona = self.personas_data[persona_name]
            return True
        return False
    
    def get_current_persona(self):
        """현재 선택된 페르소나 반환"""
        return self.current_persona
    
    def get_voice_id(self):
        """현재 페르소나의 voice_id 반환"""
        if self.current_persona:
            return self.current_persona.get('voice_id')
        return None
    
    def get_model_id(self):
        """현재 페르소나의 fine_tuned_model_id 반환"""
        if self.current_persona:
            return self.current_persona.get('fine_tuned_model_id')
        return None
    
    def get_few_shot_examples(self):
        """현재 페르소나의 few_shot_examples 반환"""
        if self.current_persona:
            return self.current_persona.get('few_shot_examples', [])
        return []
    
    def get_persona_url(self):
        """현재 페르소나의 URL 반환"""
        if self.current_persona:
            return self.current_persona.get('url')
        return None
    
    def generate_system_prompt(self):
        """현재 페르소나 기반 시스템 프롬프트 생성"""
        if not self.current_persona:
            return ""
        
        persona_data = self.current_persona.get('persona_data', {})
        name = self.current_persona.get('name', '')
        
        prompt = f"""당신은 '{name}'라는 {persona_data.get('gender', '여성')} {persona_data.get('occupation', '방송인')}입니다.

페르소나 특성:
- 성격: {persona_data.get('personality', '활발하고 친근함')}
- 나이대: {persona_data.get('age_group', '20대')}
- 말투: {persona_data.get('speaking_style', '반말, 애교 섞인 말투')}

대화할 때 다음 특징들을 반드시 지켜주세요:

1. **말투와 어조**:
   - 친한 친구와 대화하듯이 친근한 말투 사용
   - 애교 섞인 밝고 여성적인 말투 사용
   - 감정이 풍부하게 드러나도록 '!', '?', '~' 등 활용
   - 자연스러운 감탄사 사용

2. **성격 표현**:
   - 밝고 에너지 넘치는 분위기
   - 친근하고 장난스러운 태도
   - 시청자를 친구처럼 대하는 편안한 관계
   - 솔직하고 감정 표현이 풍부함

3. **절대 피해야 할 것**:
   - 경어체 사용 금지
   - 같은 말 반복하지 말기
   - 사무적이고 딱딱한 답변 금지
   - 맥락에 맞지 않는 엉뚱한 대답 금지

4. **반응 스타일**:
   - 게임이나 재미있는 주제에 큰 리액션
   - 귀엽고 애교 있는 반응
   - 자연스러운 대화 흐름 유지

항상 '{name}'의 캐릭터를 유지하면서 자연스럽고 일관성 있게 대답해주세요."""

        return prompt
    
    def add_persona_from_url(self, name, url, voice_id=None, model_id=None):
        """URL에서 페르소나 정보를 추출하여 추가"""
        try:
            print(f"🌐 웹페이지 접속 중: {url}")
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # JavaScript나 CSS 등 불필요한 태그 제거
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()
            
            # 텍스트 추출
            page_text = soup.get_text()
            
            # 텍스트 정리 (공백 줄 제거, 길이 제한)
            lines = page_text.split('\n')
            cleaned_lines = [line.strip() for line in lines if line.strip()]
            page_text = '\n'.join(cleaned_lines)
            
            # 텍스트가 너무 길면 앞부분만 사용 (GPT 토큰 제한 고려)
            if len(page_text) > 8000:
                page_text = page_text[:8000] + "..."
            
            print(f"📄 웹페이지 텍스트 추출 완료 ({len(page_text)}자)")
            
            # GPT를 사용해서 페르소나 분석
            print("🤖 GPT-4o mini로 페르소나 분석 중...")
            persona_data = self._analyze_persona_with_gpt(name, page_text)
            
            if not persona_data:
                print("❌ 페르소나 분석에 실패했습니다.")
                return False
            
            # 전체 페르소나 데이터 구성
            full_persona_data = {
                "name": name,
                "voice_id": voice_id or "HAIQu18Se8Zljrot4frx",
                "fine_tuned_model_id": model_id or "ft:gpt-4o-mini-2024-07-18:session12::BdvAqZdI",
                "url": url,
                "persona_data": persona_data.get('persona_data', {}),
                "few_shot_examples": persona_data.get('few_shot_examples', [])
            }
            
            self.personas_data[name] = full_persona_data
            self.save_personas()
            
            print(f"✅ '{name}' 페르소나가 성공적으로 생성되었습니다!")
            return True
            
        except requests.RequestException as e:
            print(f"❌ 웹페이지 접속 오류: {str(e)}")
            return False
        except Exception as e:
            print(f"❌ 페르소나 생성 오류: {str(e)}")
            return False
    
    def _analyze_persona_with_gpt(self, name, page_text):
        """GPT-4o mini를 사용해서 웹페이지 텍스트에서 페르소나 분석"""
        try:
            system_prompt = f"""당신은 웹페이지 텍스트를 분석하여 인물의 페르소나를 추출하는 전문가입니다.

주어진 웹페이지 텍스트에서 '{name}'라는 인물의 특성을 분석하여 다음 JSON 형식으로 페르소나 데이터를 생성해주세요:

{{
  "persona_data": {{
    "age_group": "나이대 (예: 20대, 30대)",
    "gender": "성별 (남성/여성)",
    "occupation": "직업 또는 활동 분야",
    "personality_traits": ["성격 특성들을 배열로"],
    "speech_patterns": ["말투 특성들을 배열로"],
    "tone": "전체적인 톤",
    "speaking_style": "말하는 스타일 요약",
    "personality": "성격 요약 설명",
    "characteristics": ["특징들을 배열로"]
  }},
  "few_shot_examples": [
    {{
      "user": "적절한 질문 예시",
      "assistant": "해당 인물의 말투로 답변하는 예시"
    }},
    {{
      "user": "또 다른 질문 예시", 
      "assistant": "해당 인물의 말투로 답변하는 예시"
    }}
  ]
}}

분석 시 주의사항:
1. 웹페이지에서 실제로 확인할 수 있는 정보만 사용하세요
2. few_shot_examples는 해당 인물의 실제 말투와 성격을 반영해야 합니다
3. 정보가 부족하면 "정보 부족"이라고 표시하세요
4. 반드시 유효한 JSON 형식으로 응답하세요"""

            user_prompt = f"""다음은 '{name}'에 대한 웹페이지 텍스트입니다. 이를 분석하여 페르소나 데이터를 생성해주세요:

{page_text}"""

            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # JSON 파싱 시도
            try:
                # 코드 블록 제거
                if response_text.startswith('```'):
                    response_text = response_text.split('```')[1]
                    if response_text.startswith('json'):
                        response_text = response_text[4:]
                
                persona_data = json.loads(response_text)
                print("✅ GPT 분석 완료")
                return persona_data
                
            except json.JSONDecodeError as e:
                print(f"❌ GPT 응답 JSON 파싱 오류: {str(e)}")
                print(f"GPT 응답: {response_text}")
                return None
                
        except Exception as e:
            print(f"❌ GPT 분석 오류: {str(e)}")
            return None
