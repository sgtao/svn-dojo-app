import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages（https://<user>.github.io/svn-dojo/）に置く場合は
// base をリポジトリ名に合わせる。独自ドメインやローカルのみなら "/" でOK。
export default defineConfig({
  plugins: [react()],
  base: "/svn-dojo/",
});
