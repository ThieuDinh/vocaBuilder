<template>
  <div class="add-word-page animate-fade-in flex-center">
    <div class="glass-panel form-container">
      <h2 class="title-main" style="font-size: 2rem;">Thêm từ vựng mới</h2>
      <p style="text-align: center; color: var(--text-muted); margin-bottom: 2rem;">Chọn chính xác loại từ và nghĩa để học tập tốt hơn</p>

      <div class="input-group">
        <label class="input-label">Buổi học</label>
        <select v-model="lessonId" class="input-control">
          <option v-for="lesson in lessons" :key="lesson.id" :value="lesson.id">
            {{ lesson.name }}
          </option>
        </select>
      </div>

      <div class="input-group">
        <label class="input-label">Từ vựng tiếng Anh</label>
        <div class="flex-row">
          <input 
            v-model="word" 
            type="text" 
            class="input-control" 
            placeholder="Ví dụ: well, fast..." 
            @keyup.enter="checkWord"
            required 
            autofocus
          />
          <button class="btn btn-secondary check-btn" @click="checkWord" :disabled="checking || !word">
            {{ checking ? 'Đang kiểm tra...' : 'Kiểm tra' }}
          </button>
        </div>
      </div>

      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

      <!-- Results Section -->
      <div v-if="checkedData" class="results-section animate-fade-in">
        <div class="phonetic-info" v-if="checkedData.phonetic">
          <span class="phonetic-text">{{ checkedData.phonetic }}</span>
          <button v-if="checkedData.audioUrl" class="audio-btn-sm" @click="playAudio(checkedData.audioUrl)">🔊 Listen</button>
        </div>

        <p class="label-heading">Chọn nghĩa & loại từ phù hợp:</p>
        <div class="suggestions-list">
          <div 
            v-for="(s, i) in checkedData.suggestions" 
            :key="i"
            class="suggestion-item"
            :class="{ active: selectedIndex === i }"
            @click="selectSuggestion(i)"
          >
            <span class="pos-badge">{{ s.partOfSpeech }}</span>
            <p class="def-text">{{ s.definition }}</p>
          </div>
          <div 
             class="suggestion-item"
             :class="{ active: selectedIndex === -1 }"
             @click="selectSuggestion(-1)"
          >
            <span class="pos-badge">Tự định nghĩa</span>
            <p class="def-text">Nhập nghĩa và mô tả thủ công...</p>
          </div>
        </div>

        <div v-if="selectedIndex !== null" class="final-fields animate-slide-up">
          <div class="input-group">
            <label class="input-label">Nghĩa Tiếng Việt</label>
            <input v-model="vietnamese" type="text" class="input-control" placeholder="Dịch nghĩa..." />
          </div>
          
          <div class="input-group" v-if="selectedIndex === -1">
             <label class="input-label">Loại từ (vd: noun, verb...)</label>
             <input v-model="partOfSpeech" type="text" class="input-control" placeholder="Loại từ..." />
          </div>

          <div class="input-group">
            <label class="input-label">Mô tả bằng tiếng Anh</label>
            <textarea v-model="description" class="input-control" rows="2" placeholder="Giải thích chi tiết hơn..."></textarea>
          </div>

          <button class="btn btn-primary" style="width: 100%" @click="saveWord" :disabled="saving">
            {{ saving ? 'Đang lưu...' : 'Lưu từ vựng này' }}
          </button>
        </div>
      </div>

      <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

const lessons = ref([])
const lessonId = ref('')
const word = ref('')
const vietnamese = ref('')
const partOfSpeech = ref('')
const description = ref('')
const checking = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const checkedData = ref(null)
const selectedIndex = ref(null)

const fetchLessons = async () => {
  try {
    const res = await api.get('/lessons')
    lessons.value = res.data
    if(res.data.length > 0) lessonId.value = res.data[0].id
  } catch (err) {
    console.error("Error fetching lessons", err)
  }
}

const checkWord = async () => {
  if (!word.value.trim()) return
  checking.value = true
  errorMsg.value = ''
  checkedData.value = null
  selectedIndex.value = null
  successMsg.value = ''

  try {
    const res = await api.post('/words/check', { english: word.value })
    checkedData.value = res.data
    vietnamese.value = res.data.vietnamese
  } catch (err) {
    errorMsg.value = 'Không tìm thấy từ này trong từ điển. Bạn vẫn có thể thêm thủ công.'
    checkedData.value = { 
      english: word.value, 
      vietnamese: '', 
      suggestions: [], 
      phonetic: '', 
      audioUrl: '' 
    }
  } finally {
    checking.value = false
  }
}

const selectSuggestion = (index) => {
  selectedIndex.value = index
  if (index === -1) {
    description.value = ''
    partOfSpeech.value = ''
  } else {
    const s = checkedData.value.suggestions[index]
    description.value = s.definition
    partOfSpeech.value = s.partOfSpeech
  }
}

const saveWord = async () => {
  if (!lessonId.value || !word.value) return
  saving.value = true
  errorMsg.value = ''
  
  try {
    const res = await api.post('/words', {
      english: word.value,
      vietnamese: vietnamese.value,
      partOfSpeech: partOfSpeech.value,
      phonetic: checkedData.value.phonetic,
      audioUrl: checkedData.value.audioUrl,
      description: description.value,
      lessonId: lessonId.value
    })
    successMsg.value = `Đã lưu thành công từ: ${res.data.english}`
    // Reset
    word.value = ''
    checkedData.value = null
    selectedIndex.value = null
  } catch (err) {
    errorMsg.value = 'Có lỗi xảy ra khi lưu từ vựng.'
  } finally {
    saving.value = false
  }
}

const playAudio = (url) => {
  if (!url) return
  new Audio(url).play().catch(e => console.error("Audio error", e))
}

onMounted(fetchLessons)
</script>

<style scoped>
.form-container {
  width: 100%;
  max-width: 600px;
  padding: 2.5rem;
}
.flex-row {
  display: flex;
  gap: 0.5rem;
}
.check-btn {
  white-space: nowrap;
  padding: 0 1.5rem;
}
.results-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--glass-border);
}
.phonetic-info {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.phonetic-text {
  color: var(--primary);
  font-weight: 500;
  font-size: 1.1rem;
}
.audio-btn-sm {
  background: none;
  border: 1px solid var(--primary);
  color: var(--primary);
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  font-size: 0.8rem;
}
.label-heading {
  font-weight: 600;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}
.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
.suggestion-item {
  padding: 1rem;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.5);
}
.suggestion-item:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: var(--primary);
}
.suggestion-item.active {
  background: white;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
}
.pos-badge {
  display: inline-block;
  padding: 2px 8px;
  background: var(--primary);
  color: white;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}
.def-text {
  font-size: 0.9rem;
  color: var(--text-color);
  line-height: 1.4;
}
.final-fields {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  border: 1px solid #e2e8f0;
}
.error-msg { color: var(--danger); text-align: center; margin: 1rem 0; font-size: 0.9rem; }
.success-msg { color: var(--secondary); text-align: center; margin-top: 1.5rem; font-weight: 600; }
</style>
