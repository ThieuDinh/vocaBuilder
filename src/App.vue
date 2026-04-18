<template>
  <div id="app-wrapper">
    <nav class="navbar glass">
      <div class="nav-container">
        <div class="logo">
          <router-link to="/">VocaBuilder</router-link>
        </div>
        <div class="nav-links">
          <router-link to="/" class="nav-link">Từ vựng</router-link>
          <router-link to="/add" class="nav-link">Thêm từ mới</router-link>
          <router-link to="/exercises" class="nav-link nav-btn">Ôn tập ngay !</router-link>
        </div>
      </div>
    </nav>
    <main class="container">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style>
.navbar {
  position: sticky;
  top: 1rem;
  z-index: 100;
  max-width: 1000px;
  margin: 1rem auto;
  padding: 0.5rem 2rem;
  border-radius: 2rem;
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px;
}

.logo a {
  font-family: 'Be Vietnam Pro', sans-serif;
  font-size: 1.5rem;
  font-weight: 900;
  text-decoration: none;
  background: -webkit-linear-gradient(45deg, var(--primary), var(--secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  font-weight: 500;
  color: var(--text-muted);
  transition: color 0.2s;
}

.nav-link:hover, .nav-link.router-link-active {
  color: var(--primary);
}

.nav-btn.nav-link.router-link-active {
  color: white;
}

.nav-btn {
  background-color: var(--primary);
  color: white !important;
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
}
.nav-btn:hover {
  background-color: var(--primary-hover);
  transform: translateY(-1px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 640px) {
  .navbar {
    margin: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 1rem;
  }
  .nav-container {
    flex-direction: column;
    height: auto;
    gap: 0.75rem;
  }
  .nav-links {
    width: 100%;
    justify-content: space-around;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
  .nav-btn {
    padding: 0.5rem 0.75rem;
  }
}
</style>
