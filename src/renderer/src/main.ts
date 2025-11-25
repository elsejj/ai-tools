import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import Tooltip from "primevue/tooltip";

import App from "./App.vue";
import { useTools } from "./composables/tools";
import { useSettings } from "./composables/settings";
import { router } from "./pages/routers";
import { MyPreset } from "./mytheme";
import { ensureWindowApi } from "./tauri_api";

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(PrimeVue, {
  theme: {
    preset: MyPreset,
    options: {
      darkModeSelector: "system",
      cssLayer: {
        name: "primevue",
        order: "theme, base, primevue",
      },
    },
  },
});

app.directive("tooltip", Tooltip);

async function initialize() {
  // Initialize the database
  // await dbService.init()
  const aiTools = useTools();
  const settings = useSettings();

  await settings.load();
  await aiTools.load();
}

initialize().then(() => {
  app.use(router);
  app.use(ToastService);
  ensureWindowApi();
  app.mount("#app");
});
