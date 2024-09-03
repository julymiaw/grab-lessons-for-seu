// ==UserScript==
// @name        东南大学抢课助手极速版
// @namespace   http://tampermonkey.net/
// @version     3.0.0
// @description 半自动，请自行提前修改lessons列表！
// @author      july
// @license     MIT
// @match       https://newxk.urp.seu.edu.cn/xsxk/elective/grablessons?*
// @run-at      document-loaded
// @downloadURL https://update.greasyfork.org/scripts/482827/%E4%B8%9C%E5%8D%97%E5%A4%A7%E5%AD%A6%E6%8A%A2%E8%AF%BE%E5%8A%A9%E6%89%8B%E6%9E%81%E9%80%9F%E7%89%88.user.js
// @updateURL https://update.greasyfork.org/scripts/482827/%E4%B8%9C%E5%8D%97%E5%A4%A7%E5%AD%A6%E6%8A%A2%E8%AF%BE%E5%8A%A9%E6%89%8B%E6%9E%81%E9%80%9F%E7%89%88.meta.js
// ==/UserScript==

(function () {
  // 请根据自己的选课信息修改本部分！顺序可以自由更改，脚本将按照给定的顺序执行抢课！
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

  // 循环选课模式，可尝试效果，不建议使用！
  const loopMode = false;

  // 请勿修改本部分！
  let version = [3, 0, 0];
  let request = axios.create();
  let tip = grablessonsVue.$message;
  let app = document.getElementById("xsxkapp");

  // 页面信息
  const menu = document
    .getElementsByClassName("teachingClassTypeMenu")[0]
    .getElementsByClassName("el-menu-item");
  const page = document
    .getElementsByClassName("el-pager")[0]
    .getElementsByClassName("number");
  const activator = document.getElementsByClassName("course-list")[0];
  const menuPage = {
    系统推荐课程: 0,
    方案内课程: 1,
    方案外课程: 2,
    体育项目: 3,
    通选课: 4,
    全校课程查询: 5,
    已选课程: 6,
  };

  // 脚本运行时状态
  let num = 0; // 当前所处页面
  let pageNum = 0; // 当前页码索引
  let enrollDict = {}; // 当前待选列表
  let isRunning = false; // 运行状态
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
  }); // 页面监听器

  // 生成面板组件
  ((self) => {
    //生成组件
    self.init = () => {
      self.createTag();
      self.createPanel();
    };

    //生成节点
    self.createNode = ({ tagName, text, HTML, obj, ev, children }) => {
      let node = document.createElement(tagName);
      // 节点属性
      if (obj) {
        for (let key of Object.keys(obj)) {
          node.setAttribute(key, obj[key]);
        }
      }
      // 节点内容(文字)
      if (text) {
        node.innerText = text;
      }
      // 节点内容(Html)
      if (HTML) {
        node.innerHTML = HTML;
      }
      // 节点事件
      if (ev) {
        for (let key of Object.keys(ev)) {
          node.addEventListener(key, ev[key]);
        }
      }
      // 子节点
      if (children) {
        children.map((x) => node.appendChild(x));
      }
      return node;
    };

    //生成打开和关闭面板的按钮
    self.createTag = () => {
      let node = self.createNode({
        tagName: "div",
        obj: {
          class: "slideMenu",
          style: `
              position: fixed;
              top: 250px;
              left:30px;width:
              40px;z-index: 1314;
          `,
        },
        children: [
          self.createNode({
            tagName: "div",
            obj: {
              class: "centre-btn item el-icon-date",
              style: `background-color: #2b2b2b`,
            },
            ev: {
              mousedown: (e) => {
                methods.drag(e, node);
              },
            },
          }),
        ],
      });
      app.appendChild(node);
    };

    //生成面板
    self.createPanel = () => {
      app.appendChild(
        // 生成面板容器
        self.createNode({
          tagName: "div",
          obj: {
            id: "panel",
            style: `
              position: fixed;
              right: 0;
              top:0 ;
              z-index: 520;
              width: 350px;
              height: 100%;
              background-color: rgba(61,72,105,0.8);
              display: none
          `,
          },
          children: [
            // 生成标题
            self.createNode({ tagName: "hr" }),
            self.createNode({
              tagName: "h1",
              text: "东大抢课脚本(极速版)",
              obj: {
                style: "color: #c7e6e6; text-align: center",
              },
            }),
            self.createNode({ tagName: "hr" }),
            // 生成表格框
            self.createNode({
              tagName: "div",
              obj: {
                id: "list-wrap",
                style: `
                  overflow: auto;
                  margin: 20px;
                  border:1px solid white;
              `,
              },
            }),
            // 生成抢课按钮
            self.createNode({
              tagName: "button",
              obj: {
                id: "enroll-button",
                class: "el-button el-button--primary el-button--small is-round",
                style: `
                  margin: 20px;
                  position: absolute;
                  right:35%;
                  bottom:6%
              `,
              },
              text: "一键抢课",
              ev: {
                click: () => {
                  if (isRunning) {
                    tip({
                      type: "error",
                      message: "脚本已启动，请勿重复点击",
                      duration: 1000,
                    });
                    return;
                  }
                  isRunning = true;
                  num = 0;
                  pageNum = 0;
                  // 监测表格内容变化
                  observer.observe(activator, {
                    childList: true,
                    subtree: true,
                  });
                  menu[menuPage[lessons[num].category]].click();
                },
              },
            }),
            // 生成版本水印
            self.createNode({
              tagName: "div",
              obj: {
                style: `
                      margin: 20px;
                      position: absolute;
                      right:2%;
                      bottom:1%;
                      color: white;
                      float: right
                  `,
              },
              text: "ver" + version.join("."),
            }),
          ],
        })
      );
      // 生成表格内容
      self.reloadList();
    };
    //生成抢课表格
    self.reloadList = () => {
      let list_wrap = document.querySelector("#panel #list-wrap");
      list_wrap.innerHTML = "";
      if (JSON.stringify(enrollDict) === "{}") {
        list_wrap.innerHTML =
          "<h3 style='text-align: center;color:lightblue;margin: 50px'>还未选择课程</h3>";
      } else {
        list_wrap.appendChild(
          self.createNode({
            tagName: "table",
            obj: {
              width: "100%",
              border: "1",
              style: `
                background-color: rgba(0,0,0,0);
                color: lightblue
            `,
            },
            children: [
              self.createNode({
                tagName: "tr",
                obj: {
                  style: `
                    height: 30px;
                    background-color: #255e95
                `,
                },
                HTML: `
                <th style="text-align:center;width: 75%">课程</th>
                <th style="text-align:center;width: 25%">教师</th>
              `,
              }),
              ...Object.keys(enrollDict)
                .filter(
                  (key) =>
                    enrollDict[key].courseBatch ===
                    grablessonsVue.lcParam.currentBatch.code
                )
                .map((key) => {
                  return self.createNode({
                    tagName: "tr",
                    obj: {
                      style: `height: 30px`,
                    },
                    children: [
                      self.createNode({
                        tagName: "td",
                        obj: {
                          style: `text-align: center`,
                        },
                        text: enrollDict[key].courseName,
                      }),
                      self.createNode({
                        tagName: "td",
                        obj: {
                          style: `text-align: center`,
                        },
                        text: enrollDict[key].teacherName,
                      }),
                    ],
                  });
                }),
            ],
          })
        );
      }
    };
  })((window.Components = window.Components || {}));

  let methods = {
    //处理按钮拖动与点击
    drag(e, node) {
      let is_move = false;
      let x = e.pageX - node.offsetLeft;
      let y = e.pageY - node.offsetTop;
      document.onmousemove = function (e) {
        node.style.left = e.pageX - x + "px";
        node.style.top = e.pageY - y + "px";
        is_move = true;
      };
      document.onmouseup = function () {
        document.onmousemove = document.onmouseup = null;
        if (!is_move) {
          let panel = document.getElementById("panel");
          panel.style.display === "block"
            ? (panel.style.display = "none")
            : (panel.style.display = "block");
        }
        is_move = false;
      };
    },
    // 根据输入的字符串添加抢课列表
    addEnrollDict(str) {
      // 如果字符串为空，则返回
      if (!str) return;
      let currentType = grablessonsVue.teachingClassType;
      let currentCourseList = grablessonsVue.courseList;
      let codeArray = str.split(" ");
      for (let i = 0; i < codeArray.length; i++) {
        let code = codeArray[i];
        if (!code) continue;
        if (enrollDict[code]) {
          tip({
            type: "warning",
            message: "已经添加过了",
            duration: 1000,
          });
          continue;
        }
        let courseCode = code.substring(0, 8);
        let teacherCode = code.substring(8);

        let courseFlag = false;
        let teacherFlag = false;
        for (let course of currentCourseList) {
          // 检查课程是否存在
          if (course.KCH === courseCode) {
            courseFlag = true;
            // 检查教师是否存在
            if (grablessonsVue.teachingClassType !== "XGKC") {
              for (let teacher of course.tcList) {
                if (teacher.KXH === teacherCode) {
                  enrollDict[code] = {
                    courseBatch: grablessonsVue.lcParam.currentBatch.code,
                    courseCode: teacher.JXBID,
                    courseType: currentType,
                    courseName: course.KCM,
                    teacherName: teacher.SKJS,
                    secretVal: teacher.secretVal,
                  };
                  teacherFlag = true;
                }
              }
            } else {
              if (course.KXH === teacherCode) {
                enrollDict[code] = {
                  courseBatch: grablessonsVue.lcParam.currentBatch.code,
                  courseCode: course.JXBID,
                  courseType: currentType,
                  courseName: course.KCM,
                  teacherName: course.SKJS,
                  secretVal: course.secretVal,
                };
                teacherFlag = true;
              }
            }
          }
        }
        if (!courseFlag) {
          tip({
            type: "error",
            message: "没有查找到课程，请检查课程代码",
            duration: 1000,
          });
          console.log("无效的课程代码: ", courseCode);
        } else if (!teacherFlag) {
          tip({
            type: "error",
            message: "没有查找到该教师，请检查教师号",
            duration: 1000,
          });
          console.log("无效的教师号: ", teacherCode);
        } else {
          tip({
            type: "success",
            message: "添加成功",
            duration: 1000,
          });
          window.Components.reloadList();
        }
      }
    },
    //一键抢课
    enroll() {
      let key_list = Object.keys(enrollDict).filter(
        (key) =>
          enrollDict[key].courseBatch ===
          grablessonsVue.lcParam.currentBatch.code
      );
      if (!key_list.length) {
        tip({
          type: "error",
          message: "待抢课程为空",
          duration: 1000,
        });
      }
      axios.all(
        key_list.map((key) =>
          request({
            url: "/elective/clazz/add",
            method: "POST",
            headers: {
              batchId: enrollDict[key].courseBatch,
              "content-type": "application/x-www-form-urlencoded",
            },
            data: Qs.stringify({
              clazzType: enrollDict[key].courseType,
              clazzId: enrollDict[key].courseCode,
              secretVal: enrollDict[key].secretVal,
            }),
          }).then((res) => {
            let type = res.data.code === 100 ? "success" : "warning";
            tip({
              type,
              message: enrollDict[key].courseName + ":" + res.data.msg,
              duration: 1000,
            });
          })
        )
      );
    },
    // 清理抢课列表
    clearEnrollDict() {
      enrollDict = {};
      window.Components.reloadList();
    },
    // 获取当前页码
    getCurrentPage() {
      return lessons[num].pages[pageNum].page;
    },
  };

  function main() {
    const currentPageLessons = lessons[num].pages;
    if (currentPageLessons.length > 0) {
      methods.addEnrollDict(currentPageLessons[pageNum].courses);
      methods.enroll();
    }
    // 设置翻页间隔，建议不小于1000
    setTimeout(function () {
      if (pageNum === currentPageLessons.length - 1) {
        if (num < lessons.length - 1) {
          num++;
          pageNum = 0;
          methods.clearEnrollDict();
          menu[menuPage[lessons[num].category]].click();
        } else {
          num = 0;
          pageNum = 0;
          methods.clearEnrollDict();
          if (loopMode) {
            menu[menuPage[lessons[num].category]].click();
            return;
          }
          isRunning = false;
          observer.disconnect();
          tip({
            type: "success",
            message: "抢课模式已退出",
            duration: 2000,
          });
          return;
        }
      } else {
        pageNum++;
        methods.clearEnrollDict();
        page[methods.getCurrentPage() - 1].click(); // 将页码减1以访问数组中的元素
      }
    }, 1000);
  }
  // 生成面板
  window.Components.init();
})();
