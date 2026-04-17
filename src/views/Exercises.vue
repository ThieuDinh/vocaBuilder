<template>
  <div class="exercises-page animate-fade-in" :class="{ 'kahoot-theme': selectedType === 'kahoot' && hasStarted }">
    <h1 class="title-main" v-if="!hasStarted || selectedType !== 'kahoot'">Phòng Ôn Tập</h1>

    <!-- Phase 1: Setup -->
    <div v-if="!hasStarted" class="glass-panel setup-panel">
      <h2 style="margin-bottom: 1.5rem">Cấu hình bài tập</h2>
      
      <div v-if="loadingLessons" style="color: var(--text-muted)">Đang tải thiết lập...</div>
      <div v-else>
        <div class="input-group" style="text-align: left;">
          <label class="input-label">Chọn phạm vi ôn tập (Chọn nhiều)</label>
          <div class="lesson-picker">
            <label class="lesson-item-check" v-for="lesson in lessons" :key="lesson.id">
              <input type="checkbox" :value="lesson.id" v-model="selectedLessonIds">
              <span class="check-label">{{ lesson.name }} ({{ lesson._count ? lesson._count.words : 0 }} từ)</span>
            </label>
          </div>
          <p class="helper-text">{{ selectedLessonIds.length }} bài học đang được chọn</p>
        </div>

        <div class="input-group" style="text-align: left;">
          <label class="input-label">Loại bài tập</label>
          <select v-model="selectedType" class="input-control">
            <option value="kahoot">Chế độ Kahoot (Game 4 nút)</option>
            <option value="vietnamese_to_word">Đoán từ qua nghĩa Tiếng Việt</option>
            <option value="description_to_word">Đoán từ qua mô tả</option>
            <option value="matching">Nối từ Tiếng Anh - Tiếng Việt</option>
            <option value="word_typing">Nhập từ đúng (Tiếng Anh)</option>
          </select>
        </div>

        <button class="btn btn-primary" style="width: 100%" @click="startExercises">Bắt đầu ngay</button>
      </div>
    </div>

    <div v-else>
      <div v-if="loading" class="state-panel glass-panel">Đang khởi tạo bài giảng...</div>
      <div v-else-if="errorMsg" class="state-panel glass-panel">
        <div class="emoji">😕</div>
        <p>{{ errorMsg }}</p>
        <button class="btn btn-primary" style="margin-top:1rem" @click="hasStarted = false">Quay lại</button>
      </div>
      
      <div v-else class="exercise-container" :class="{ 'kahoot-container': selectedType === 'kahoot' }">
        <!-- Default & Matching UI -->
        <div v-if="selectedType !== 'kahoot'" class="exercise-card glass-panel">
          <div class="progress-bar">
            <div class="progress-inner" :style="{ width: `${(currentIndex / exercises.length) * 100}%` }"></div>
          </div>
          <p class="question-counter">Câu {{ currentIndex + 1 }} / {{ exercises.length }}</p>

          <div class="question-header">
            <h2>{{ currentEx.question }}</h2>
          </div>

          <div class="question-body">
            <!-- Type: Vietnamese to Word / Description to Word -->
            <div v-if="currentEx.type !== 'matching'" class="desc-type">
              <div class="options-grid">
                <button 
                  v-for="(opt, i) in currentEx.options" 
                  :key="i"
                  class="btn btn-secondary opt-btn"
                  :class="{ 'correct': selected === opt && opt === currentEx.answer, 'wrong': selected === opt && opt !== currentEx.answer }"
                  @click="checkAnswer(opt, currentEx.answer)"
                  :disabled="selected !== null"
                >
                  {{ opt }}
                </button>
              </div>
            </div>
            
            <!-- Type: Word Typing -->
            <div v-if="currentEx.type === 'word_typing'" class="typing-type">
              <div class="input-group">
                <input 
                  type="text" 
                  v-model="typedAnswer" 
                  class="input-control typing-input" 
                  placeholder="Gõ từ tiếng Anh tại đây..."
                  @keyup.enter="checkTypedAnswer"
                  :disabled="selected !== null"
                  ref="typingInput"
                >
              </div>
              <button 
                class="btn btn-primary mt-2" 
                style="width: 100%" 
                @click="checkTypedAnswer"
                :disabled="selected !== null || !typedAnswer.trim()"
              >
                Kiểm tra
              </button>
            </div>

            <!-- Type: Matching -->
            <div v-if="currentEx.type === 'matching'" class="match-type">
              <p style="color: var(--text-muted); margin-bottom: 1rem; text-align: center;">Chọn cặp từ đúng nghĩa với nhau</p>
              <div class="match-columns">
                <div class="match-col">
                  <button 
                    v-for="(word, i) in currentEx.leftCol" 
                    :key="i"
                    class="btn btn-secondary match-btn"
                    :class="{'selected': selectedLeft === word, 'matched': matched.includes(word)}"
                    @click="selectLeft(word)"
                    :disabled="matched.includes(word)"
                  >
                    {{ word }}
                  </button>
                </div>
                <div class="match-col">
                  <button 
                    v-for="(word, i) in currentEx.rightCol" 
                    :key="i"
                    class="btn btn-secondary match-btn"
                    :class="{'selected': selectedRight === word, 'matched': matched.includes(word)}"
                    @click="selectRight(word)"
                    :disabled="matched.includes(word)"
                  >
                    {{ word }}
                  </button>
                </div>
              </div>
              <button v-if="matched.length === (currentEx.leftCol ? currentEx.leftCol.length * 2 : 0)" class="btn btn-primary mt-4" style="width: 100%" @click="nextExercise">Câu tiếp theo</button>
            </div>
          </div>

          <!-- Answer Feedback -->
          <div class="feedback" v-if="selected !== null && currentEx.type !== 'matching'">
            <div class="result-header">
              <h3 :class="isCorrect ? 'text-green' : 'text-red'">
                {{ isCorrect ? 'Chính xác! 🎉' : `Sai rồi! Đáp án là: ${currentEx.answer}` }}
              </h3>
            </div>
            
            <!-- Pronunciation box removed per user request -->

            <button class="btn btn-primary mt-4" @click="nextExercise">Câu tiếp theo</button>
          </div>
        </div>

        <!-- Kahoot Mode UI -->
        <div v-else-if="currentIndex < exercises.length" class="kahoot-card">
          <div class="kahoot-header">
            <div class="kahoot-nav">
              <button class="kahoot-exit" @click="stopAndExit">✕</button>
              <div class="kahoot-nav-center">
                <span class="kahoot-count">{{ currentIndex + 1 }} / {{ exercises.length }}</span>
                <button class="kahoot-music-toggle" @click="toggleMusic">
                  {{ isMusicPlaying ? '🔊 Nhạc đang bật' : '🔇 Nhạc đang tắt' }}
                </button>
              </div>
              <div style="width: 40px"></div>
            </div>
            <h1 class="kahoot-question">{{ currentEx.question }}</h1>
          </div>

          <!-- Kahoot Middle: Media or Placeholder -->
          <div class="kahoot-media">
             <div class="kahoot-answer-status" v-if="selected !== null">
                <div class="status-overlay" :class="isCorrect ? 'correct' : 'wrong'">
                  <span class="status-icon">{{ isCorrect ? '✔️' : '❌' }}</span>
                  <h2>{{ isCorrect ? 'Chính xác!' : 'Rất tiếc!' }}</h2>
                  <p v-if="!isCorrect">Đáp án là: <b>{{ currentEx.answer }}</b></p>
                  
                  <!-- Pronunciation box removed per user request -->
                  
                  <button class="btn btn-kahoot-next" @click="nextExercise">Tiếp tục</button>
                </div>
             </div>
             <div class="kahoot-placeholder" v-else>
               <span class="voca-logo-emoji">📖</span>
             </div>
          </div>

          <div class="kahoot-grid">
            <button 
              v-for="(opt, i) in currentEx.options" 
              :key="i"
              class="kahoot-btn"
              :class="['red', 'blue', 'yellow', 'green'][i]"
              @click="checkAnswer(opt, currentEx.answer)"
              :disabled="selected !== null"
            >
              <span class="kahoot-shape">
                {{ ['▲', '◆', '●', '■'][i] }}
              </span>
              <span class="kahoot-text">{{ opt }}</span>
            </button>
          </div>
        </div>

        <!-- Finish Card -->
        <div v-if="currentIndex >= exercises.length" class="finish-card glass-panel">
          <div class="emoji" style="font-size: 5rem; margin-bottom: 1rem">🏆</div>
          <h2>Tuyệt vời! Bạn đã hoàn thành!</h2>
          <p style="margin-bottom: 2rem">Bạn đã ôn tập được {{ exercises.length }} câu hỏi.</p>
          <button class="btn btn-primary" @click="hasStarted = false">Làm bài khác</button>
          <router-link to="/" class="btn btn-secondary" style="margin-left: 1rem">Về trang chủ</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { useRoute } from 'vue-router'

const route = useRoute()

// Pre-config state
const hasStarted = ref(false)
const lessons = ref([])
const loadingLessons = ref(true)
const selectedLessonIds = ref([])
const selectedType = ref('kahoot')

// Exercise state
const exercises = ref([])
const loading = ref(true)
const errorMsg = ref('')
const currentIndex = ref(0)
const currentEx = computed(() => exercises.value[currentIndex.value] || {})

const selected = ref(null)
const isCorrect = ref(false)

const selectedLeft = ref(null)
const selectedRight = ref(null)
const matched = ref([])
const typedAnswer = ref('')
const typingInput = ref(null)

// Music & Sound Effects
const lobbyMusic = ref(null)
const isMusicPlaying = ref(false)

const playLobbyMusic = () => {
  if (!lobbyMusic.value) {
    // Using a more reliable link from a public sound archive
    lobbyMusic.value = new Audio('/lobby.mp3')
    lobbyMusic.value.loop = true
    lobbyMusic.value.volume = 0.4
    
    lobbyMusic.value.onplay = () => { isMusicPlaying.value = true }
    lobbyMusic.value.onpause = () => { isMusicPlaying.value = false }
  }
  
  lobbyMusic.value.play().then(() => {
    isMusicPlaying.value = true
  }).catch(e => {
    console.warn("Autoplay blocked:", e)
    isMusicPlaying.value = false
  })
}

const toggleMusic = () => {
  if (isMusicPlaying.value) {
    lobbyMusic.value.pause()
  } else {
    playLobbyMusic()
  }
}

const stopLobbyMusic = () => {
  if (lobbyMusic.value) {
    lobbyMusic.value.pause()
    lobbyMusic.value.currentTime = 0
  }
}

const playFeedbackSound = (correct) => {
  const url = correct ? '/correct.mp3' : '/wrong.mp3'
  const audio = new Audio(url)
  audio.volume = 0.5
  audio.play().catch(e => console.warn("Sound play failed", e))
}

const fetchLessons = async () => {
  try {
    const res = await api.get('/lessons')
    lessons.value = res.data
    // Handle individual lessonId from route
    if (route.query.lessonId) {
      selectedLessonIds.value = [parseInt(route.query.lessonId)]
    }
  } catch (err) {
    console.error("Error fetching lessons", err)
  } finally {
    loadingLessons.value = false
  }
}

const startExercises = async () => {
  if (selectedLessonIds.value.length === 0) {
    alert("Vui lòng chọn ít nhất một bài học!");
    return;
  }
  
  // Trigger music immediately on user click to satisfy browser policies
  if (selectedType.value === 'kahoot') {
    playLobbyMusic()
  }

  hasStarted.value = true
  fetchExercises()
}

const fetchExercises = async () => {
  loading.value = true
  errorMsg.value = ''
  currentIndex.value = 0
  resetState()
  
  try {
    const idsString = selectedLessonIds.value.join(',');
    const url = `/exercises?type=${selectedType.value}&lessonId=${idsString}`

    const res = await api.get(url)
    exercises.value = res.data
  } catch (err) {
    if (err.response && err.response.data && err.response.data.error) {
      errorMsg.value = err.response.data.error
    } else {
      errorMsg.value = 'Lỗi kết nối máy chủ hoặc chưa đủ 4 từ vựng.'
    }
    stopLobbyMusic()
  } finally {
    loading.value = false
  }
}

const resetState = () => {
  selected.value = null
  isCorrect.value = false
  selectedLeft.value = null
  selectedRight.value = null
  matched.value = []
  typedAnswer.value = ''
  
  // Focus input if typing mode
  if (selectedType.value === 'word_typing') {
    setTimeout(() => {
      if (typingInput.value) typingInput.value.focus()
    }, 100)
  }
}

const checkTypedAnswer = () => {
  if (!typedAnswer.value.trim() || selected.value !== null) return
  checkAnswer(typedAnswer.value.trim().toLowerCase(), currentEx.value.answer.toLowerCase())
}

const checkAnswer = (opt, answer) => {
  selected.value = opt
  isCorrect.value = (opt === answer)
  
  if (selectedType.value === 'kahoot' || selectedType.value === 'word_typing') {
    playFeedbackSound(isCorrect.value)
  }

  /* Automatic audio play disabled per user request
  if (currentEx.value.audioUrl && isCorrect.value) {
    // Small delay to not overlap with feedback sound
    setTimeout(() => playAudio(currentEx.value.audioUrl), 500)
  }
  */
}

const selectLeft = (word) => {
  selectedLeft.value = word
  checkMatch()
}

const selectRight = (word) => {
  selectedRight.value = word
  checkMatch()
}

const checkMatch = () => {
  if (selectedLeft.value && selectedRight.value) {
    const pair = currentEx.value.answerPairs.find(p => p.english === selectedLeft.value)
    if (pair && pair.vietnamese === selectedRight.value) {
      matched.value.push(selectedLeft.value)
      matched.value.push(selectedRight.value)
      // if (pair.audioUrl) playAudio(pair.audioUrl) // Disabled per user request
    }
    setTimeout(() => {
      selectedLeft.value = null
      selectedRight.value = null
    }, 300)
  }
}

const nextExercise = () => {
  resetState()
  currentIndex.value++
  if (currentIndex.value >= exercises.value.length) {
    stopLobbyMusic()
  }
}

const playAudio = (url) => {
  if (!url) return
  const audio = new Audio(url)
  audio.play().catch(e => console.error("Audio play failed", e))
}

const stopAndExit = () => {
  hasStarted.value = false
  stopLobbyMusic()
}

onMounted(() => {
  fetchLessons()
})
</script>

<style scoped>
.setup-panel {
  max-width: 550px;
  margin: 0 auto;
  padding: 3rem;
  text-align: center;
}

.lesson-picker {
  background: white;
  border-radius: var(--radius-md);
  padding: 1rem;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--glass-border);
  margin-bottom: 0.5rem;
}

.lesson-item-check {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.2s;
}

.lesson-item-check:hover {
  background: #f9fafb;
}

.lesson-item-check input {
  width: 18px;
  height: 18px;
  margin-right: 1rem;
}

.helper-text {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.exercise-container {
  max-width: 800px;
  margin: 0 auto;
}

.kahoot-container {
  max-width: 1000px;
}

/* Kahoot Specific Theme */
.kahoot-theme {
  background: #46178f !important;
  min-height: 100vh;
  margin: -2rem; /* bleed into App layout */
  padding: 2rem;
}

.kahoot-card {
  display: flex;
  flex-direction: column;
  height: 80vh;
  gap: 1.5rem;
}

.kahoot-header {
  text-align: center;
  color: white;
}

.kahoot-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.kahoot-exit {
  background: rgba(0,0,0,0.3);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
}

.kahoot-count {
  background: rgba(0,0,0,0.3);
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  font-weight: 700;
}

.kahoot-question {
  font-size: 2.5rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  margin-top: 1rem;
  color: white;
}

.kahoot-media {
  flex: 1;
  background: white;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.kahoot-placeholder {
  font-size: 6rem;
}

.status-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 10;
  animation: slideInDown 0.4s;
}

.status-overlay.correct { background: #66bf39; }
.status-overlay.wrong { background: #eb102f; }

.status-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.btn-kahoot-next {
  margin-top: 1.5rem;
  background: white;
  color: black;
  padding: 1rem 3rem;
  font-weight: 800;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 0 rgba(0,0,0,0.2);
}

.kahoot-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1rem;
  height: 35vh;
}

.kahoot-btn {
  border: none;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  padding: 0 2rem;
  color: white;
  font-size: 1.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.1s;
  box-shadow: 0 4px 0 rgba(0,0,0,0.2);
  text-align: left;
}

.kahoot-btn:active { transform: translateY(4px); box-shadow: none; }

.kahoot-btn.red { background: #e21b3c; }
.kahoot-btn.blue { background: #1368ce; }
.kahoot-btn.yellow { background: #d89e00; }
.kahoot-btn.green { background: #26890c; }

.kahoot-shape {
  font-size: 2.5rem;
  margin-right: 1.5rem;
  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
}

/* Original styles below */
.exercise-card, .finish-card {
  padding: 2.5rem;
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.95);
}
.finish-card { text-align: center; }
.progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 6px;
  width: 100%;
  background-color: #e5e7eb;
}
.progress-inner {
  height: 100%;
  background-color: var(--secondary);
  transition: width 0.3s ease;
}
.question-counter {
  font-size: 0.875rem;
  color: var(--primary);
  font-weight: 600;
  margin-bottom: 1rem;
}
.question-header h2 {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
  color: var(--text-color);
}
.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.typing-type {
  max-width: 500px;
  margin: 0 auto;
  text-align: center;
}
.typing-input {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  padding: 1.25rem !important;
  color: var(--primary);
  border: 2px solid var(--glass-border);
  background: white;
}
.typing-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 20px rgba(79, 70, 229, 0.15);
}
.typing-input::placeholder {
  font-size: 1rem;
  font-weight: 400;
  color: var(--text-muted);
}
.opt-btn {
  padding: 1.25rem;
  font-size: 1.125rem;
}
.feedback {
  margin-top: 2rem;
  text-align: center;
  animation: fadeIn 0.3s ease-out;
}
.pronunciation-box {
  margin: 1.5rem auto;
  padding: 1rem 2rem;
  width: fit-content;
  gap: 1rem;
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
}
.pronunciation-box.mini {
  background: rgba(255,255,255,0.2);
  color: white;
  border-color: rgba(255,255,255,0.3);
}
.word-english {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
  text-transform: capitalize;
}
.kahoot-theme .word-english { color: white; }

.phonetic {
  font-family: 'Inter', sans-serif;
  color: var(--text-muted);
  font-style: italic;
}
.audio-btn {
  background: var(--bg-color);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes slideInDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.kahoot-nav-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.kahoot-music-toggle {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 2rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
}

.kahoot-music-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
}

@media (max-width: 640px) {
  .kahoot-grid { grid-template-columns: 1fr; height: auto; padding-bottom: 2rem; }
  .kahoot-question { font-size: 1.5rem; }
  .kahoot-theme { margin: -1rem; padding: 1rem; }
  .setup-panel { padding: 1.5rem; }
}
</style>
