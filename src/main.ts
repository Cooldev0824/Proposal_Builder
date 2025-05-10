import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { createPinia } from "pinia";
import App from "./App.vue";

// Vuetify
import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import "@mdi/font/css/materialdesignicons.css";

// Routes
import routes from "./router";

// Global styles
import "./assets/styles/main.scss";

// Initialize selection tracking
import { initSelectionTracking } from "./utils/selectionManager";

// Load Google Fonts
const googleFontsLink = document.createElement("link");
googleFontsLink.rel = "stylesheet";
googleFontsLink.href =
  "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&family=Lato:wght@300;400;700&family=Montserrat:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Nunito:wght@300;400;600;700&family=Merriweather:wght@300;400;700&family=Playfair+Display:wght@400;500;600;700&family=Lora:wght@400;500;600;700&family=EB+Garamond:wght@400;500;600;700&family=Roboto+Mono:wght@300;400;500;700&family=Source+Code+Pro:wght@300;400;500;700&family=Fira+Code:wght@300;400;500;700&family=Bebas+Neue&family=Oswald:wght@300;400;500;600;700&family=Archivo+Black&family=Anton&family=Dancing+Script:wght@400;500;600;700&family=Pacifico&family=Caveat:wght@400;500;600;700&family=Satisfy&display=swap";
document.head.appendChild(googleFontsLink);

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    themes: {
      light: {
        colors: {
          primary: "#0C84FE",
          secondary: "#05C2C9",
          accent: "#8A8D93",
          success: "#36B37E",
          warning: "#F59E0B",
          error: "#EF4444",
          "on-surface": "#1E1E1E",
        },
      },
    },
  },
});

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const pinia = createPinia();

// Initialize selection tracking
initSelectionTracking();

createApp(App).use(router).use(vuetify).use(pinia).mount("#app");
