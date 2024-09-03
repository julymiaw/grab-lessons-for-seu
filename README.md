# 欢迎使用东南大学抢课脚本(极速版)

## 使用说明

首先，安装[油猴插件](https://www.tampermonkey.net/)，然后通过[发布链接](https://greasyfork.org/zh-CN/scripts/474996-东南大学抢课助手)安装本插件。

安装完成后，页面上会增加一个可拖动的按钮。点击该按钮，右侧会出现脚本面板，说明安装成功。

使用前，请先编辑脚本。脚本开头有一个 [`lessons`](command:_github.copilot.openSymbolFromReferences?%5B%22lessons%22%2C%5B%7B%22uri%22%3A%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22d%3A%5C%5CUniversity%5C%5C%E6%95%99%E5%8A%A1%E5%A4%84%5C%5C%E6%8A%A2%E8%AF%BE%E5%8A%A9%E6%89%8B%5C%5CREADME.md%22%2C%22_sep%22%3A1%2C%22external%22%3A%22file%3A%2F%2F%2Fd%253A%2FUniversity%2F%25E6%2595%2599%25E5%258A%25A1%25E5%25A4%2584%2F%25E6%258A%25A2%25E8%25AF%25BE%25E5%258A%25A9%25E6%2589%258B%2FREADME.md%22%2C%22path%22%3A%22%2FD%3A%2FUniversity%2F%E6%95%99%E5%8A%A1%E5%A4%84%2F%E6%8A%A2%E8%AF%BE%E5%8A%A9%E6%89%8B%2FREADME.md%22%2C%22scheme%22%3A%22file%22%7D%2C%22pos%22%3A%7B%22line%22%3A13%2C%22character%22%3A6%7D%7D%2C%7B%22uri%22%3A%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22d%3A%5C%5CUniversity%5C%5C%E6%95%99%E5%8A%A1%E5%A4%84%5C%5C%E6%8A%A2%E8%AF%BE%E5%8A%A9%E6%89%8B%5C%5Cmain.js%22%2C%22_sep%22%3A1%2C%22external%22%3A%22file%3A%2F%2F%2Fd%253A%2FUniversity%2F%25E6%2595%2599%25E5%258A%25A1%25E5%25A4%2584%2F%25E6%258A%25A2%25E8%25AF%25BE%25E5%258A%25A9%25E6%2589%258B%2Fmain.js%22%2C%22path%22%3A%22%2FD%3A%2FUniversity%2F%E6%95%99%E5%8A%A1%E5%A4%84%2F%E6%8A%A2%E8%AF%BE%E5%8A%A9%E6%89%8B%2Fmain.js%22%2C%22scheme%22%3A%22file%22%7D%2C%22pos%22%3A%7B%22line%22%3A15%2C%22character%22%3A8%7D%7D%2C%7B%22uri%22%3A%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22d%3A%5C%5CUniversity%5C%5C%E6%95%99%E5%8A%A1%E5%A4%84%5C%5C%E6%8A%A2%E8%AF%BE%E5%8A%A9%E6%89%8B%5C%5CREADME.md%22%2C%22_sep%22%3A1%2C%22external%22%3A%22file%3A%2F%2F%2Fd%253A%2FUniversity%2F%25E6%2595%2599%25E5%258A%25A1%25E5%25A4%2584%2F%25E6%258A%25A2%25E8%25AF%25BE%25E5%258A%25A9%25E6%2589%258B%2FREADME.md%22%2C%22path%22%3A%22%2FD%3A%2FUniversity%2F%E6%95%99%E5%8A%A1%E5%A4%84%2F%E6%8A%A2%E8%AF%BE%E5%8A%A9%E6%89%8B%2FREADME.md%22%2C%22scheme%22%3A%22file%22%7D%2C%22pos%22%3A%7B%22line%22%3A13%2C%22character%22%3A6%7D%7D%5D%5D "Go to definition") 列表，通过修改其中的内容可以自定义选课信息。

例如：

```json
const lessons = [
  {
    category: "系统推荐课程",
    pages: [{ page: 2, courses: "B09N001201 B15M011046 B160410102" }],
  },
  {
    category: "体育项目",
    pages: [{ page: 1, courses: "B18M005052" }],
  },
  {
    category: "系统推荐课程",
    pages: [
      { page: 1, courses: "B09A113001 B09D001101 B09D102001 B09G001001" },
      { page: 3, courses: "B61G010001 B71S003001 B71S104001" },
    ],
  },
];
```

这段代码的功能是先抢选“系统推荐课程”的第二页，再抢选“体育项目”的第一页，最后抢选“系统推荐课程”的第一页和第三页。

也就是说，你可以自由决定抢课的顺序。当然，同一页面上课程的先后顺序可以忽略不计。

## 原理解释

本脚本通过自动翻页功能实现了抢课的自动化。以下是该功能的实现原理：

1. **页面加载监测**：脚本使用 [`MutationObserver`](command:_github.copilot.openSymbolFromReferences?%5B%22MutationObserver%22%2C%5B%7B%22uri%22%3A%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22d%3A%5C%5CUniversity%5C%5C%E6%95%99%E5%8A%A1%E5%A4%84%5C%5C%E6%8A%A2%E8%AF%BE%E5%8A%A9%E6%89%8B%5C%5Cmain.js%22%2C%22_sep%22%3A1%2C%22external%22%3A%22file%3A%2F%2F%2Fd%253A%2FUniversity%2F%25E6%2595%2599%25E5%258A%25A1%25E5%25A4%2584%2F%25E6%258A%25A2%25E8%25AF%25BE%25E5%258A%25A9%25E6%2589%258B%2Fmain.js%22%2C%22path%22%3A%22%2FD%3A%2FUniversity%2F%E6%95%99%E5%8A%A1%E5%A4%84%2F%E6%8A%A2%E8%AF%BE%E5%8A%A9%E6%89%8B%2Fmain.js%22%2C%22scheme%22%3A%22file%22%7D%2C%22pos%22%3A%7B%22line%22%3A65%2C%22character%22%3A23%7D%7D%5D%5D "Go to definition") 监听页面内容的变化。当页面内容发生变化时，[`MutationObserver`](command:_github.copilot.openSymbolFromReferences?%5B%22MutationObserver%22%2C%5B%7B%22uri%22%3A%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22d%3A%5C%5CUniversity%5C%5C%E6%95%99%E5%8A%A1%E5%A4%84%5C%5C%E6%8A%A2%E8%AF%BE%E5%8A%A9%E6%89%8B%5C%5Cmain.js%22%2C%22_sep%22%3A1%2C%22external%22%3A%22file%3A%2F%2F%2Fd%253A%2FUniversity%2F%25E6%2595%2599%25E5%258A%25A1%25E5%25A4%2584%2F%25E6%258A%25A2%25E8%25AF%25BE%25E5%258A%25A9%25E6%2589%258B%2Fmain.js%22%2C%22path%22%3A%22%2FD%3A%2FUniversity%2F%E6%95%99%E5%8A%A1%E5%A4%84%2F%E6%8A%A2%E8%AF%BE%E5%8A%A9%E6%89%8B%2Fmain.js%22%2C%22scheme%22%3A%22file%22%7D%2C%22pos%22%3A%7B%22line%22%3A65%2C%22character%22%3A23%7D%7D%5D%5D "Go to definition") 会触发回调函数。
   
2. **判断页面加载完成**：在回调函数中，脚本会检查当前页码是否等于目标页码，并且该页码不包含 `.disabled` 属性。如果满足这些条件，说明页面加载完成，脚本会调用 [`main`](command:_github.copilot.openSymbolFromReferences?%5B%22main%22%2C%5B%7B%22uri%22%3A%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22d%3A%5C%5CUniversity%5C%5C%E6%95%99%E5%8A%A1%E5%A4%84%5C%5C%E6%8A%A2%E8%AF%BE%E5%8A%A9%E6%89%8B%5C%5Cmain.js%22%2C%22_sep%22%3A1%2C%22external%22%3A%22file%3A%2F%2F%2Fd%253A%2FUniversity%2F%25E6%2595%2599%25E5%258A%25A1%25E5%25A4%2584%2F%25E6%258A%25A2%25E8%25AF%25BE%25E5%258A%25A9%25E6%2589%258B%2Fmain.js%22%2C%22path%22%3A%22%2FD%3A%2FUniversity%2F%E6%95%99%E5%8A%A1%E5%A4%84%2F%E6%8A%A2%E8%AF%BE%E5%8A%A9%E6%89%8B%2Fmain.js%22%2C%22scheme%22%3A%22file%22%7D%2C%22pos%22%3A%7B%22line%22%3A72%2C%22character%22%3A6%7D%7D%5D%5D "Go to definition") 函数执行抢课操作。

3. **自动翻页**：如果当前页码不等于目标页码且不包含 `.disabled` 属性，脚本会自动点击目标页码，触发页面翻页操作。

以下是相关代码片段：

```javascript
const observer = new MutationObserver(() => {
  const activePage = document.querySelector(".number.active");
  if (
    activePage.innerText == methods.getCurrentPage() &&
    !activePage.classList.contains("disabled")
  ) {
    console.log(lessons[num].category, "第", methods.getCurrentPage(), "页");
    main();
  } else if (!activePage.classList.contains("disabled")) {
    page[methods.getCurrentPage() - 1].click();
  }
});
```

通过这种方式，脚本能够自动翻页并在目标页面加载完成后执行抢课操作。

## 免责声明

本脚本由22级某计算机科学专业学生编写，修改自realhuhu大佬留下的[脚本](https://greasyfork.org/zh-CN/scripts/427237-东南大学抢课助手正式版)。在原版的基础上增加了自动翻页功能，删除了原有的用户交互部分。如果对现有的用户交互感到不满（现在没有用户交互），可以尝试在我的代码基础上进一步修改，希望薪火相传！

此外，本脚本可能存在一些稳定性问题，欢迎向我反馈！

最后，脚本抢课有风险。如果为了追求更快的速度而修改我提供的默认参数，可能会导致一系列问题，如弹出登录等！