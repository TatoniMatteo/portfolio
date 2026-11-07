import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig({
    build: {outDir: 'target/dist'},
    cacheDir: 'target/.vite',
    plugins: [
        react(),
        svgr(),
    ],
});
