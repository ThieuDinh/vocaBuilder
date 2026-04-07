import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import AddWord from './views/AddWord.vue'
import Exercises from './views/Exercises.vue'
import LessonDetail from './views/LessonDetail.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/lesson/:id', name: 'LessonDetail', component: LessonDetail },
  { path: '/add', name: 'AddWord', component: AddWord },
  { path: '/exercises', name: 'Exercises', component: Exercises }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
