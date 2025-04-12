import { createMemoryHistory, createRouter } from 'vue-router'

import Main from '@renderer/pages/Main.vue'
import EditTools from '@renderer/pages/EditTools.vue'
import EditLlm from '@renderer/pages//EditLlm.vue'

const routes = [
  { path: '/', component: Main },
  { path: '/tools/:name?', component: EditTools},
  { path: '/llm', component: EditLlm},
]

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})