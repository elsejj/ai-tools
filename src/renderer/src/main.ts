import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from "primevue/config";
import Aura from '@primeuix/themes/aura';
import ToastService from 'primevue/toastservice';



import App from './App.vue'
import { useTools } from './composables/tools'
import { useSettings } from './composables/settings'
import {router} from './pages/routers'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(PrimeVue, {
  theme: {
        preset: Aura,
        options: {
          darkModeSelector: 'system',
          cssLayer: {
            name: 'primevue',
            order: 'theme, base, primevue'
          }
        }
    }})


async function initialize() {
  // Initialize the database
  // await dbService.init()
  const aiTools = useTools()
  const settings = useSettings()

  await settings.load()
  await aiTools.load()
}

initialize().then(() => {
  app.use(router)
  app.use(ToastService);
  app.mount('#app')
})



