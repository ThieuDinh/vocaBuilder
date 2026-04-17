<template>
  <div class="lesson-detail-page animate-fade-in">
    <div class="header-section flex-between">
      <div>
        <router-link to="/" class="back-link">← Quay lại</router-link>
        <h1 class="title-main" style="text-align: left; margin: 0.5rem 0">{{ lessonName }}</h1>
        <p style="color: var(--text-muted)">{{ words.length }} từ vựng trong buổi học này.</p>
      </div>
      <div style="display: flex; gap: 1rem">
        <router-link to="/add" class="btn btn-secondary">+ Thêm từ</router-link>
        <router-link :to="`/exercises?lessonId=${route.params.id}`" class="btn btn-primary" v-if="words.length >= 4">Ôn tập bài này</router-link>
      </div>
    </div>

    <div v-if="loading" class="state-panel glass-panel">Đang tải từ vựng...</div>
    <div v-else-if="words.length === 0" class="state-panel glass-panel">
      <h2>Chưa có từ nào ở đây</h2>
      <p>Thêm từ mới và chọn buổi học này nhé!</p>
    </div>
    
    <div v-else class="words-grid">
      <div v-for="word in words" :key="word.id" class="word-card glass">
        <div class="word-content">
          <h3 class="english flex-between" style="align-items: flex-start;">
            <span>
              {{ word.english }}
              <span class="pos-badge-sm" v-if="word.partOfSpeech">{{ word.partOfSpeech }}</span>
            </span>
            <button class="delete-word-btn" @click="confirmDeleteWord(word)" title="Xóa từ vựng">✕</button>
          </h3>
          <p class="vietnamese">{{ word.vietnamese }}</p>
          <div class="description" v-if="word.description">{{ word.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'
import { useRoute } from 'vue-router'

const route = useRoute()
const words = ref([])
const lessonName = ref('Đang tải...')
const loading = ref(true)

const fetchWordAndLesson = async () => {
  try {
    const lessonRes = await api.get(`/lessons/${route.params.id}`)
    lessonName.value = lessonRes.data.name
    
    const wordsRes = await api.get(`/words?lessonId=${route.params.id}`)
    words.value = wordsRes.data
  } catch (error) {
    console.error(error)
    lessonName.value = 'Lỗi lấy dữ liệu'
  } finally {
    loading.value = false
  }
}

const confirmDeleteWord = async (word) => {
  if (window.confirm(`Bạn có chắc chắn muốn xóa từ "${word.english}"?`)) {
    try {
      await api.delete(`/words/${word.id}`);
      await fetchWordAndLesson();
    } catch (error) {
      alert("Lỗi khi xóa từ");
      console.error(error);
    }
  }
}

onMounted(() => {
  fetchWordAndLesson()
})
</script>

<style scoped>
.back-link {
  text-decoration: none;
  font-weight: 600;
  color: var(--primary);
}
.back-link:hover {
  text-decoration: underline;
}
.header-section {
  margin-bottom: 2.5rem;
}
.words-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}
.word-card {
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  background: rgba(255, 255, 255, 0.85);
}
.word-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
}
.word-image {
  height: 180px;
  background-size: cover;
  background-position: center;
  border-bottom: 1px solid #f3f4f6;
}
.word-content {
  padding: 1.5rem;
}
.english {
  font-size: 1.5rem;
  color: var(--primary);
  margin-bottom: 0.25rem;
  text-transform: capitalize;
}
.vietnamese {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.75rem;
}
.description {
  font-size: 0.875rem;
  color: var(--text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}
.pos-badge-sm {
  font-size: 0.65rem;
  background: var(--primary);
  color: white;
  padding: 1px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 700;
  vertical-align: middle;
  margin-left: 0.5rem;
}

.delete-word-btn {
  background: transparent;
  border: none;
  color: #d1d5db;
  font-size: 1.25rem;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0;
  line-height: 1;
}

.delete-word-btn:hover {
  color: var(--danger);
}
.state-panel {
  text-align: center;
  padding: 4rem;
  color: var(--text-muted);
}

@media (max-width: 640px) {
  .words-grid {
    grid-template-columns: 1fr;
  }
  .header-section > div:last-child {
    flex-wrap: wrap;
    width: 100%;
  }
  .header-section .btn {
    flex: 1;
    text-align: center;
    justify-content: center;
  }
}
</style>
