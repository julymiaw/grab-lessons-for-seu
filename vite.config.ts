import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

export default defineConfig({
  plugins: [
    monkey({
      entry: "src/main.ts",
      userscript: {
        name: "东南大学抢课助手",
        namespace: "https://github.com/julymiaw/grab-lessons-for-seu",
        version: "4.0.0",
        description: "东南大学选课页面的课程列表与提交助手",
        author: "july",
        license: "MIT",
        match: ["https://newxk.urp.seu.edu.cn/xsxk/elective/grablessons*"],
        "run-at": "document-idle"
      },
      build: { fileName: "grab-lessons-for-seu.user.js" }
    })
  ]
});
