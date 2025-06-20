import { defineConfig } from "vite";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";

function generateManifest() {
  const manifest = readJsonFile("manifest.json");
  const pkg = readJsonFile("package.json");
  return {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    ...manifest,
  };
}

export default defineConfig({
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  publicDir: "../public",
  plugins: [
    webExtension({
      manifest: generateManifest,
      watchFilePaths: ["package.json", "manifest.json"],
      browser: "firefox"
    }),
  ],
});
