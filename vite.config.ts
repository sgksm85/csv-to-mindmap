import path from "path";
import fs from "fs";
import dns from "dns";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

dns.setDefaultResultOrder("verbatim");

const allHtmlEntries = fs
  .readdirSync(".")
  .filter((file) => path.extname(file) === ".html")
  .reduce((acc: Record<string, string>, file) => {
    acc[path.basename(file, ".html")] = path.resolve(__dirname, file);
    return acc;
  }, {});

export default defineConfig({
  base: "/", // これを追加
  build: {
    rollupOptions: {
      input: allHtmlEntries,
    },
    outDir: "dist", // これを追加
  },
  plugins: [react()],
  server: {
    port: 3000,
  },
});