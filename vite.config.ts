import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // server: {
  //   port: 80, // Set port to 80
  //   host: true, // Set to true to listen on 0.0.0.0 (for external access)
  // },
});
