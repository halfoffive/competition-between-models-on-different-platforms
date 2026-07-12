import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 移除启动屏
const boot = document.getElementById('boot')
if (boot) boot.remove()

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
