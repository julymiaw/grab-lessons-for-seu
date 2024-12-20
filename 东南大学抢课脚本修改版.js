// ==UserScript==
// @name        东南大学抢课助手修改版
// @namespace   http://tampermonkey.net/
// @version     3.1.0
// @description 听说你抢不到课
// @author      july
// @license     MIT
// @match       newxk.urp.seu.edu.cn/xsxk/elective/grablessons?*
// @run-at      document-loaded
// @icon        https://s2.loli.net/2024/12/19/lngsEvZ8tfUdJzr.jpg
// ==/UserScript==

(function () {
  //版本
  let version = [3, 1, 0];

  //请求
  let request = axios.create();

  //提示
  let tip = grablessonsVue.$message;

  // 设置时间间隔
  const interval = 375; // 设置时间间隔，单位为毫秒

  let isRunning = false;
  let shouldStop = false;

  //设置(存储Token)
  let settings = {};

  //所选课程
  let enrollDict = {};

  //挂载的顶层组件
  let app = document.getElementById("xsxkapp");

  //组件生成
  ((self) => {
    //生成组件
    self.mount = () => {
      self.createTag();
      self.createPanel();
      self.createMask();
      self.addEnrollButton();
    };

    //生成节点
    self.createNode = ({ tagName, text, HTML, obj, ev, children }) => {
      let node = document.createElement(tagName);
      if (obj) {
        for (let key of Object.keys(obj)) {
          node.setAttribute(key, obj[key]);
        }
      }
      if (text) {
        node.innerText = text;
      }
      if (HTML) {
        node.innerHTML = HTML;
      }
      if (ev) {
        for (let key of Object.keys(ev)) {
          node.addEventListener(key, ev[key]);
        }
      }
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
              display: block;
          `,
          },
          children: [
            self.createNode({ tagName: "hr" }),
            self.createNode({
              tagName: "h1",
              text: "东大抢课脚本",
              obj: {
                style: "color: #c7e6e6; text-align: center",
              },
            }),
            self.createNode({ tagName: "hr" }),
            self.createNode({
              tagName: "input",
              obj: {
                id: "input-box",
                class: "el-input__inner",
                style: `
                  width: 96%;
                  margin-left: 2%;
                  height: 30px
              `,
                placeholder: "输入课程代码(不区分大小写)，按回车确定",
              },
              ev: {
                keydown: methods.enter,
              },
            }),
            self.createNode({
              tagName: "div",
              obj: {
                id: "list-wrap",
                style: `
                  overflow: auto;
                  margin: 10px;
                  border:1px solid white;
                  height: 75%
              `,
              },
            }),
            self.createNode({
              tagName: "button",
              obj: {
                id: "enroll-button",
                class: "el-button el-button--primary el-button--small is-round",
                style: `
                  margin: 20px;
                  position: absolute;
                  right:50%;
                  bottom:5%
              `,
              },
              text: "一键抢课",
              ev: {
                click: async () => {
                  if (shouldStop) {
                    tip({
                      type: "error",
                      message: "请稍候，正在终止上一个抢课进程",
                      duration: 1000,
                    });
                    return;
                  }
                  if (isRunning) {
                    shouldStop = true;
                    // 等待上一个抢课过程完全终止
                    while (isRunning) {
                      await new Promise((resolve) => setTimeout(resolve, 50));
                    }
                    // 等待一个额外的间隔后再开始新的抢课
                    await new Promise((resolve) =>
                      setTimeout(resolve, interval)
                    );
                  }
                  shouldStop = false;
                  isRunning = true;
                  methods.updateUIState();
                  methods.enroll();
                },
              },
            }),
            self.createNode({
              tagName: "button",
              obj: {
                id: "stop-button",
                class: "el-button el-button--danger el-button--small is-round",
                style: `
                  margin: 20px;
                  position: absolute;
                  right:20%;
                  bottom:5%
              `,
                disabled: !isRunning,
              },
              text: "停止抢课",
              ev: {
                click: async () => {
                  if (isRunning) {
                    shouldStop = true;
                    // 等待上一个抢课过程完全终止
                    while (isRunning) {
                      await new Promise((resolve) => setTimeout(resolve, 50));
                    }
                    // 等待一个额外的间隔
                    await new Promise((resolve) =>
                      setTimeout(resolve, interval)
                    );
                    shouldStop = false;
                    methods.updateUIState();
                  }
                },
              },
            }),
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
      self.reloadList();
    };

    //生成遮罩
    self.createMask = () => {
      let node = self.createNode({
        tagName: "div",
        obj: {
          id: "mask",
          style: `
              position: fixed;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
              z-index: 2002;
              background-color: rgba(66, 66, 66, 0.6);
              display: none
          `,
        },
        ev: {
          click: () => {
            node.style.display = "none";
            app.removeChild(document.getElementsByClassName("temp")[0]);
          },
        },
      });
      app.appendChild(node);
    };

    //生成抢课表格
    self.reloadList = () => {
      let list_wrap = document.querySelector("#panel #list-wrap");
      list_wrap.innerHTML = "";
      if (JSON.stringify(enrollDict) === "{}") {
        list_wrap.innerHTML =
          "<h3 style='text-align: center;color:lightblue;margin-top: 50%'>还未选择课程</h3>";
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
                <th style="text-align:center;width: 55%">课程</th>
                <th style="text-align:center;width: 15%">教师</th>
                <th style="text-align:center;width: 30%">操作</th>
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
                      self.createNode({
                        tagName: "td",
                        obj: {
                          style: `text-align: center`,
                        },
                        children: [
                          self.createNode({
                            tagName: "button",
                            text: "删除",
                            obj: {
                              class: "delete-button",
                              style: `
                            color: red;
                            background: transparent;
                            border: 1px solid red;
                            border-radius: 6px;
                            text-align: center;
                            cursor: pointer;
                            text-decoration: none;
                            margin-right: 2px
                          `,
                            },
                            ev: {
                              click: () => {
                                const course = enrollDict[key];
                                delete enrollDict[key];
                                methods.saveCourse();
                                tip({
                                  type: "success",
                                  message: `${course.teacherName} 的 ${course.courseName} 已删除`,
                                  duration: 1000,
                                });
                                self.reloadList();
                              },
                            },
                          }),
                          self.createNode({
                            tagName: "button",
                            text: "更多",
                            obj: {
                              style: `
                            color: orange;
                            background: transparent;
                            border: 1px solid orange;
                            border-radius: 6px;
                            text-align: center;
                            cursor: pointer;
                            text-decoration: none;
                            margin-left: 2px
                          `,
                            },
                            ev: {
                              click: () => {
                                document.getElementById("mask").style.display =
                                  "block";
                                self.createPopUp(
                                  "详细信息",
                                  self.showCourseDetails(enrollDict[key])
                                );
                              },
                            },
                          }),
                        ],
                      }),
                    ],
                  });
                }),
            ],
          })
        );
      }
    };

    //生成弹出窗
    self.createPopUp = (title, node, width, height) =>
      app.appendChild(
        self.createNode({
          tagName: "div",
          obj: {
            class: "temp",
            style: `
              position: fixed;
              left: ${width ? 50 - 0.5 * width : 30}%;
              top: ${height ? 50 - 0.5 * height : 30}%;
              width: ${width || 40}%;
              height: ${height || 40}%;
              z-index: 2021;
              background-color: white;
              border-radius: 30px;
              overflow: auto;
            `,
          },
          children: [
            self.createNode({
              tagName: "h1",
              obj: {
                style: `
                  margin: 20px 0;
                  width: 100%;
                  text-align: center;
              `,
              },
              text: title,
            }),
            node,
            self.createNode({
              tagName: "button",
              obj: {
                class: "el-button el-button--default el-button--large is-round",
                style: `
                  margin: 10px;
                  position: absolute;
                  right:10%;
                  bottom:0
              `,
              },
              text: "确定",
              ev: {
                click: () => {
                  document.getElementById("mask").style.display = "none";
                  app.removeChild(document.getElementsByClassName("temp")[0]);
                },
              },
            }),
          ],
        })
      );

    //生成课程详情信息
    self.showCourseDetails = (course) => {
      return self.createNode({
        tagName: "div",
        obj: {
          style: `margin:20px`,
        },
        children: [
          self.createNode({
            tagName: "table",
            obj: {
              width: "80%",
              border: "1",
              style: `
      background-color: rgba(0,0,0,0);
      color: black;
      margin: 0 auto; /* 居中显示 */
    `,
            },
            children: [
              self.createNode({
                tagName: "tr",
                obj: {
                  style: `
                height: 30px;
          background-color: #255e95;
          color: lightblue;
              `,
                },
                HTML: `
        <th style="text-align:center;width: 30%">属性</th>
        <th style="text-align:center;width: 50%">值</th>
      `,
              }),
              self.createNode({
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
                    text: "课程名称",
                  }),
                  self.createNode({
                    tagName: "td",
                    obj: {
                      style: `text-align: center`,
                    },
                    text: course.courseName,
                  }),
                ],
              }),
              self.createNode({
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
                    text: "教师名称",
                  }),
                  self.createNode({
                    tagName: "td",
                    obj: {
                      style: `text-align: center`,
                    },
                    text: course.teacherName,
                  }),
                ],
              }),
              self.createNode({
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
                    text: "课程代码",
                  }),
                  self.createNode({
                    tagName: "td",
                    obj: {
                      style: `text-align: center`,
                    },
                    text: course.courseCode,
                  }),
                ],
              }),
              self.createNode({
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
                    text: "课程类型",
                  }),
                  self.createNode({
                    tagName: "td",
                    obj: {
                      style: `text-align: center`,
                    },
                    text: course.courseType,
                  }),
                ],
              }),
              self.createNode({
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
                    text: "批次",
                  }),
                  self.createNode({
                    tagName: "td",
                    obj: {
                      style: `text-align: center`,
                    },
                    text: course.courseBatch,
                  }),
                ],
              }),
              self.createNode({
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
                    text: "校验码",
                  }),
                  self.createNode({
                    tagName: "td",
                    obj: {
                      style: `text-align: center; word-break: break-all;`,
                    },
                    text: course.secretVal,
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    };

    //生成抢课按钮
    self.addEnrollButton = () => {
      // 监听课程块的点击事件
      document.addEventListener("click", function (event) {
        const target = event.target;
        const trElement = target.closest("tr.el-table__row");
        if (trElement && trElement.classList.contains("expanded")) {
          setTimeout(() => {
            const expandedRow = trElement.nextElementSibling;
            const expandedCell = expandedRow.querySelector(
              "td.el-table__expanded-cell"
            );
            if (!expandedCell) {
              console.error("未找到 expandedCell");
              return;
            }

            // 获取课程编码
            const courseCode = trElement.querySelector("td span").innerText;
            // 获取课程名称
            const courseName = trElement.querySelector(
              "td:nth-child(2) span"
            ).innerText;

            // 获取 expandedCell 内的所有“选择”按钮
            const selectButtons = Array.from(
              expandedCell.querySelectorAll(
                "button.el-button--primary.el-button--mini.is-round span"
              )
            ).filter((span) => span.innerText.includes("选择"));

            selectButtons.forEach((selectButton) => {
              // 创建“添加”按钮
              const addButton = document.createElement("button");
              addButton.className =
                "el-button el-button--primary el-button--mini is-round add-course-button";
              addButton.innerHTML = "<span>添加</span>";

              // 存储课程编码到按钮属性中
              addButton.setAttribute("data-course-code", courseCode);
              addButton.setAttribute("data-course-name", courseName);

              // 设置按钮的禁用状态
              if (isRunning) {
                addButton.disabled = true;
                addButton.style.cursor = "not-allowed";
                addButton.style.opacity = "0.5";
              }

              // 在“选择”按钮后插入“添加”按钮
              selectButton.parentElement.parentElement.appendChild(addButton);

              // 添加点击事件
              addButton.addEventListener("click", function () {
                // 获取课程班编号
                const classRow = selectButton.closest(".el-card__body");
                if (!classRow) {
                  console.error("未找到 classRow");
                  return;
                }
                const sequenceInfo = classRow
                  .querySelector(".one-row span")
                  .innerText.replace("[", "");

                // 获取存储的课程编码
                const storedCourseCode =
                  addButton.getAttribute("data-course-code");

                // 拼接课程编码与课程班编号
                const courseString = storedCourseCode + sequenceInfo;

                // 使用 addSingleCourse 函数添加课程
                methods.addSingleCourse(courseString);
              });
            });
          }, 100); // 增加延迟时间以确保详情块已插入
        }
      });
    };
  })((window.Components = window.Components || {}));

  let methods = {
    //初始化数据
    init() {
      let raw = JSON.parse(localStorage.getItem("july"));
      if (raw) {
        settings = raw.settings;
        if (settings.token === sessionStorage.token) {
          enrollDict = raw.enrollDict;
        } else if (JSON.stringify(raw.enrollDict) !== "{}") {
          // 获取 raw.enrollDict 的所有课程代码（键）
          const courseCodes = Object.keys(raw.enrollDict).join(" ");
          // 将课程代码添加到输入框中
          const inputBox = document.getElementById("input-box");
          inputBox.value = courseCodes;
          // 将课程代码保存到 settings 中的一个字段
          settings.savedCourseCodes = courseCodes;

          tip({
            type: "warning",
            message: "登录信息发生变动，已清空抢课列表",
            duration: 1000,
          });
          enrollDict = {};
          settings.token = sessionStorage.token;
          methods.saveCourse();
        } else if (settings.savedCourseCodes) {
          // 如果 raw.enrollDict 为空，从 settings 中恢复课程代码
          const inputBox = document.getElementById("input-box");
          inputBox.value = settings.savedCourseCodes;
        }
      } else {
        settings.token = sessionStorage.token;
      }
      isRunning = false;
      shouldStop = false;
      methods.updateUIState();
      window.Components.reloadList();
    },
    //保存数据
    saveCourse() {
      localStorage.setItem("july", JSON.stringify({ enrollDict, settings }));
    },
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
    // 更新UI状态（禁用/启用按钮）
    updateUIState() {
      const inputBox = document.getElementById("input-box");
      const stopButton = document.getElementById("stop-button");
      const listWrap = document.getElementById("list-wrap");

      if (isRunning) {
        inputBox.disabled = true;
        inputBox.style.cursor = "not-allowed";
        inputBox.style.opacity = "0.5";
        stopButton.disabled = false;
        stopButton.style.cursor = "pointer";
        stopButton.style.opacity = "1";
        // 禁用表格中的删除键
        listWrap.querySelectorAll("button.delete-button").forEach((button) => {
          button.disabled = true;
          button.style.cursor = "not-allowed";
          button.style.opacity = "0.5";
        });
        // 禁用添加课程按钮
        document
          .querySelectorAll("button.add-course-button")
          .forEach((button) => {
            button.disabled = true;
            button.style.cursor = "not-allowed";
            button.style.opacity = "0.5";
          });
      } else {
        inputBox.disabled = false;
        inputBox.style.cursor = "auto";
        inputBox.style.opacity = "1";
        stopButton.disabled = true;
        stopButton.style.cursor = "not-allowed";
        stopButton.style.opacity = "0.5";
        // 启用表格中的删除键
        listWrap.querySelectorAll("button.delete-button").forEach((button) => {
          button.disabled = false;
          button.style.cursor = "pointer";
          button.style.opacity = "1";
        });
        // 启用添加课程按钮
        document
          .querySelectorAll("button.add-course-button")
          .forEach((button) => {
            button.disabled = false;
            button.style.cursor = "pointer";
            button.style.opacity = "1";
          });
      }
    },
    // 处理输入框事件
    enter(e) {
      if (e.key === "Enter") {
        let node = document.getElementById("input-box");
        let codeArray = node.value.toUpperCase().split(" ");
        let failedCodes = methods.addEnrollDict(codeArray.join(" "));
        node.value = failedCodes.join(" "); // 将失败的课程代码替换到输入框中
      }
    },
    // 插入课程
    insertCourse(code, currentCourseList, currentType) {
      let courseCode = code.substring(0, 8);
      let teacherCode = code.substring(8);

      let courseFlag = false,
        teacherFlag = false;
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
      return { courseFlag, teacherFlag };
    },
    // 处理课程插入逻辑
    handleCourseInsertion(code, currentCourseList, currentType) {
      let { courseFlag, teacherFlag } = methods.insertCourse(
        code,
        currentCourseList,
        currentType
      );

      if (!courseFlag) {
        return {
          success: false,
          message: "没有查找到该课程，请检查课程号",
          type: "error",
        };
      } else if (!teacherFlag) {
        console.log("无效的教师号: ", code.substring(8));
        return {
          success: false,
          message: "没有查找到该教师，请检查教师号",
          type: "error",
        };
      } else {
        const course = enrollDict[code];
        return {
          success: true,
          message: `成功添加 ${course.teacherName} 的 ${course.courseName}`,
          type: "success",
        };
      }
    },
    // 添加课程到抢课列表
    addEnrollDict(str) {
      if (!str) return [];
      let currentType = grablessonsVue.teachingClassType;
      let currentCourseList = grablessonsVue.courseList;
      let codeArray = str.split(" ");
      let failedCodes = []; // 用于存储添加失败的课程代码

      for (let i = 0; i < codeArray.length; i++) {
        let code = codeArray[i];
        if (!code) continue;
        const course = enrollDict[code];
        if (course) {
          tip({
            type: "error",
            message: `${course.teacherName} 的 ${course.courseName} 已添加`,
            duration: 1000,
          });
          continue;
        }

        let result = methods.handleCourseInsertion(
          code,
          currentCourseList,
          currentType
        );

        if (!result.success) {
          failedCodes.push(code); // 添加到失败的课程代码列表
        }
        tip({
          type: result.type,
          message: result.message,
          duration: 1000,
        });
      }
      methods.saveCourse();
      window.Components.reloadList();
      return failedCodes; // 返回失败的课程代码
    },
    // 添加单个课程到抢课列表
    addSingleCourse(code) {
      if (!code) return;
      let currentType = grablessonsVue.teachingClassType;
      let currentCourseList = grablessonsVue.courseList;
      const course = enrollDict[code];
      if (course) {
        tip({
          type: "error",
          message: `${course.teacherName} 的 ${course.courseName} 已添加`,
          duration: 1000,
        });
        return;
      }

      let result = methods.handleCourseInsertion(
        code,
        currentCourseList,
        currentType
      );

      tip({
        type: result.type,
        message: result.message,
        duration: 1000,
      });

      methods.saveCourse();
      window.Components.reloadList();
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
          type: "warning",
          message: "抢课列表为空",
          duration: 1000,
        });
        isRunning = false;
        methods.updateUIState();
        return;
      }

      let index = 0;

      const enrollCourse = () => {
        if (index >= key_list.length) {
          // 检查是否有剩余课程，如果有则重新开始
          key_list = Object.keys(enrollDict).filter(
            (key) =>
              enrollDict[key].courseBatch ===
              grablessonsVue.lcParam.currentBatch.code
          );
          if (key_list.length) {
            index = 0;
            setTimeout(enrollCourse, interval); // 在每次请求后设置时间间隔
            return;
          } else {
            isRunning = false;
            methods.updateUIState();
            return;
          }
        }

        const key = key_list[index];
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
          if (shouldStop) {
            isRunning = false;
            methods.updateUIState();
            return;
          }
          let type = res.data.code === 100 ? "success" : "warning";
          tip({
            type,
            message: enrollDict[key].courseName + ":" + res.data.msg,
            duration: 1000,
          });
          if (res.data.code === 100) {
            delete enrollDict[key]; // 移除成功的课程
            methods.saveCourse();
            window.Components.reloadList();
            key_list = Object.keys(enrollDict).filter(
              (key) =>
                enrollDict[key].courseBatch ===
                grablessonsVue.lcParam.currentBatch.code
            );
          } else {
            index++;
          }
          setTimeout(enrollCourse, interval); // 在每次请求后设置时间间隔
        });
      };

      enrollCourse(); // 开始执行抢课
    },
  };
  window.Components.mount();
  methods.init();
})();
