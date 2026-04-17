<template>
  <div class="home-page animate-fade-in">
    <div class="header-section flex-between">
      <div>
        <h1 class="title-main" style="text-align: left; margin-bottom: 0.5rem">Kho từ vựng</h1>
        <p style="color: var(--text-muted)">Quản lý từ vựng theo từng buổi học</p>
      </div>
      
      <form class="create-lesson-form flex-center" @submit.prevent="createLesson">
        <input v-model="newLessonName" type="text" placeholder="Tên bài học (VD: Bài 1)" required class="input-control" style="width: 200px; margin-right: 0.5rem; margin-bottom: 0;" />
        <button type="submit" class="btn btn-primary" :disabled="lessonLoading">Tạo buổi</button>
      </form>
    </div>

    <div v-if="loading" class="state-panel glass-panel">Đang tải danh sách bài học...</div>
    <div v-else-if="lessons.length === 0" class="state-panel glass-panel">
      <div class="emoji">📁</div>
      <h2>Chưa có buổi học nào</h2>
      <p>Hãy tự tạo buổi học đầu tiên ở mục phía trên nhé!</p>
    </div>
    
    <div v-else class="lessons-grid">
      <div v-for="lesson in lessons" :key="lesson.id" class="lesson-card glass" @click="$router.push(`/lesson/${lesson.id}`)">
        <div class="lesson-icon">📚</div>
        <div class="lesson-info">
          <h2>{{ lesson.name }}</h2>
          <p>{{ lesson._count.words }} từ vựng</p>
        </div>
        <button class="delete-btn-mini" @click.stop="confirmDeleteLesson(lesson)" title="Xóa buổi học">🗑️</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

const lessons = ref([])
const loading = ref(true)
const lessonLoading = ref(false)
const newLessonName = ref('')

const fetchLessons = async () => {
  try {
    loading.value = true;
    const res = await api.get('/lessons')
    lessons.value = res.data
  } catch (error) {
    console.error("Error fetching lessons:", error)
  } finally {
    loading.value = false
  }
}

const createLesson = async () => {
  if (!newLessonName.value.trim()) return;
  lessonLoading.value = true;
  try {
    await api.post('/lessons', { name: newLessonName.value });
    newLessonName.value = '';
    await fetchLessons();
  } catch(e) {
    console.error(e)
  } finally {
    lessonLoading.value = false;
  }
}

const confirmDeleteLesson = async (lesson) => {
  const wordCount = lesson._count.words;
  let message = `Bạn có chắc chắn muốn xóa buổi học "${lesson.name}"?`;
  if (wordCount > 0) {
    message = `Buổi học "${lesson.name}" đang có ${wordCount} từ vựng. Xóa buổi học sẽ xóa TẤT CẢ các từ này. Bạn có chắc chắn không?`;
  }
  
  if (window.confirm(message)) {
    try {
      await api.delete(`/lessons/${lesson.id}`);
      await fetchLessons();
    } catch (error) {
      alert("Lỗi khi xóa buổi học");
      console.error(error);
    }
  }
}

onMounted(() => {
  fetchLessons()
})
</script>

<style scoped>
.header-section {
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}
.lesson-card {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.85);
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
}
.lesson-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  background: white;
}
.lesson-icon {
  font-size: 2.5rem;
  background: var(--bg-color);
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
}
.lesson-info h2 {
  font-size: 1.25rem;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}
.lesson-info p {
  color: var(--text-muted);
  font-size: 0.875rem;
}
.state-panel {
  text-align: center;
  padding: 4rem;
  color: var(--text-muted);
}
.state-panel .emoji {
  font-size: 4rem;
  margin-bottom: 1rem;
}

@media (max-width: 640px) {
  .create-lesson-form {
    width: 100%;
    flex-direction: column;
  }
  .create-lesson-form .input-control {
    width: 100% !important;
    margin-right: 0 !important;
    margin-bottom: 0.5rem !important;
  }
  .create-lesson-form .btn {
    width: 100%;
  }
  .lessons-grid {
    grid-template-columns: 1fr;
  }
}

.lesson-card {
  position: relative;
}

.delete-btn-mini {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: white;
  border: 1px solid #fee2e2;
  color: #ef4444;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.lesson-card:hover .delete-btn-mini {
  opacity: 1;
}

.delete-btn-mini:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
  transform: scale(1.1);
}
</style>
