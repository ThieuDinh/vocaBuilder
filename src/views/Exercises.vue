<template>
  <div class="exercises-page animate-fade-in">
    <h1 class="title-main">Phòng Ôn Tập</h1>

    <!-- Phase 1: Setup -->
    <div v-if="!hasStarted" class="glass-panel" style="max-width: 500px; margin: 0 auto; padding: 2.5rem; text-align: center;">
      <h2 style="margin-bottom: 1rem">Cấu hình bài tập</h2>
      
      <div v-if="loadingLessons" style="color: var(--text-muted)">Đang tải thiết lập...</div>
      <div v-else>
        <div class="input-group" style="text-align: left;">
          <label class="input-label">Chọn phạm vi ôn tập</label>
          <select v-model="selectedLessonId" class="input-control">
            <option value="">-- Toàn bộ kho từ vựng --</option>
            <option v-for="lesson in lessons" :key="lesson.id" :value="lesson.id">
              {{ lesson.name }} ({{ lesson._count ? lesson._count.words : 0 }} từ)
            </option>
          </select>
        </div>

        <div class="input-group" style="text-align: left;">
          <label class="input-label">Loại bài tập</label>
          <select v-model="selectedType" class="input-control">
            <option value="vietnamese_to_word">Đoán từ qua nghĩa Tiếng Việt</option>
            <option value="description_to_word">Đoán từ qua mô tả</option>
            <option value="matching">Nối từ Tiếng Anh - Tiếng Việt</option>
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
      
      <div v-else class="exercise-container">
        <div v-if="currentIndex < exercises.length" class="exercise-card glass-panel">
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

          <!-- Answer Feedback with Audio & Phonetics -->
          <div class="feedback" v-if="selected !== null && currentEx.type !== 'matching'">
            <div class="result-header">
              <h3 :class="isCorrect ? 'text-green' : 'text-red'">
                {{ isCorrect ? 'Chính xác! 🎉' : `Sai rồi! Đáp án là: ${currentEx.answer}` }}
              </h3>
            </div>
            
            <div class="pronunciation-box glass flex-center" v-if="currentEx">
              <span class="word-english">{{ currentEx.answer }}</span>
              <span class="pos-badge-sm" v-if="currentEx.partOfSpeech">{{ currentEx.partOfSpeech }}</span>
              <span class="phonetic" v-if="currentEx.phonetic">{{ currentEx.phonetic }}</span>
              <button v-if="currentEx.audioUrl" class="audio-btn" @click="playAudio(currentEx.audioUrl)">
                <span class="emoji">🔊</span>
              </button>
            </div>

            <button class="btn btn-primary mt-4" @click="nextExercise">Câu tiếp theo</button>
          </div>
        </div>

        <div v-else class="finish-card glass-panel">
          <div class="emoji" style="font-size: 5rem; margin-bottom: 1rem">🏆</div>
          <h2>Chúc mừng bạn đã hoàn thành bài tập!</h2>
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
const selectedLessonId = ref('')
const selectedType = ref('vietnamese_to_word') // default

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

const fetchLessons = async () => {
  try {
    const res = await api.get('/lessons')
    lessons.value = res.data
    if (route.query.lessonId) {
      selectedLessonId.value = route.query.lessonId
    }
  } catch (err) {
    console.error("Error fetching lessons", err)
  } finally {
    loadingLessons.value = false
  }
}

const startExercises = async () => {
  hasStarted.value = true
  fetchExercises()
}

const fetchExercises = async () => {
  loading.value = true
  errorMsg.value = ''
  currentIndex.value = 0
  resetState()
  
  try {
    let url = `/exercises?type=${selectedType.value}`
    if (selectedLessonId.value) {
      url += `&lessonId=${selectedLessonId.value}`
    }

    const res = await api.get(url)
    exercises.value = res.data
  } catch (err) {
    if (err.response && err.response.data && err.response.data.error) {
      errorMsg.value = err.response.data.error
    } else {
      errorMsg.value = 'Lỗi kết nối máy chủ.'
    }
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
}

const checkAnswer = (opt, answer) => {
  selected.value = opt
  isCorrect.value = (opt === answer)
  // Optionally play audio automatically on answer
  if (currentEx.value.audioUrl) {
    playAudio(currentEx.value.audioUrl)
  }
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
      // Play audio for matched word
      if (pair.audioUrl) playAudio(pair.audioUrl)
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
}

const playAudio = (url) => {
  if (!url) return
  const audio = new Audio(url)
  audio.play().catch(e => console.error("Audio play failed", e))
}

onMounted(() => {
  fetchLessons()
})
</script>

<style scoped>
.exercise-container {
  max-width: 800px;
  margin: 0 auto;
}
.state-panel {
  text-align: center;
  padding: 4rem;
  color: var(--text-muted);
}
.state-panel .emoji {
  font-size: 3rem;
}
.exercise-card, .finish-card {
  padding: 2.5rem;
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.95);
}
.finish-card {
  text-align: center;
}
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
.opt-btn {
  padding: 1.25rem;
  font-size: 1.125rem;
  text-transform: capitalize;
}
.opt-btn.correct {
  background-color: var(--secondary);
  color: white;
  border-color: var(--secondary);
}
.opt-btn.wrong {
  background-color: var(--danger);
  color: white;
  border-color: var(--danger);
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

.word-english {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary);
  text-transform: capitalize;
}

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
  transition: transform 0.2s;
}
.audio-btn:hover {
  transform: scale(1.1);
  background: #e5e7eb;
}

.pos-badge-sm {
  font-size: 0.7rem;
  background: var(--primary);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 700;
}

.text-green { color: var(--secondary); }
.text-red { color: var(--danger); }
.mt-4 { margin-top: 1rem; }

.match-columns {
  display: flex;
  gap: 2rem;
}
.match-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.match-btn {
  padding: 1rem;
  font-size: 1.125rem;
}
.match-btn.selected {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.4);
}
.match-btn.matched {
  background-color: var(--secondary);
  color: white;
  border-color: var(--secondary);
  opacity: 0.5;
  cursor: default;
}

@media (max-width: 640px) {
  .options-grid { grid-template-columns: 1fr; }
  .match-columns { flex-direction: column; }
}
</style>
