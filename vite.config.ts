import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

export default defineConfig({
  // Greasy Fork requires published source to remain readable.  Keep the
  // checked-in release artifact unminified as well, so reviewers can compare
  // it with src/ without a separate build step.
  build: { minify: false },
  plugins: [
    monkey({
      entry: "src/main.ts",
      userscript: {
        name: "东南大学选课助手（测试版）",
        namespace: "https://github.com/julymiaw/grab-lessons-for-seu",
        version: "4.0.0",
        description: "实验性重构版本，尚未经真实选课系统验证",
        author: "july",
        license: "MIT",
        match: ["https://newxk.urp.seu.edu.cn/xsxk/elective/grablessons*"],
        "run-at": "document-idle"
      },
      build: { fileName: "东南大学选课助手测试版.user.js" }
    })
  ]
});
