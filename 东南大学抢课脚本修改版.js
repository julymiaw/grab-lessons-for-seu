// ==UserScript==
// @name        东南大学抢课助手修改版
// @namespace   http://tampermonkey.net/
// @version     3.2.0
// @description 听说你抢不到课
// @author      july
// @license     MIT
// @match       newxk.urp.seu.edu.cn/xsxk/elective/grablessons?*
// @run-at      document-loaded
// @icon        https://s2.loli.net/2024/12/19/lngsEvZ8tfUdJzr.jpg
// ==/UserScript==

(function () {
  // 版本
  let version = [3, 2, 0];

  // 请求
  let request = axios.create();

  // 提示
  let tip = grablessonsVue.$message;

  let isRunning = false;
  let shouldStop = false;

  // 所选课程
  let enrollDict = {};

  // 设置
  let settings = {};
  let tempSettings = null;

  // 定义默认设置
  const defaultSettings = {
    token: "",
    savedCourseCodes: "",
    mode: {
      isAsync: false,
      isCyclic: true,
      cycleCount: -1, // -1表示无限循环
    },
    interval: {
      sync: {
        single: 300, // 同步单次间隔
        group: 1000, // 同步分组间隔
      },
      async: {
        single: 350, // 异步单次间隔
        group: 1000, // 异步分组间隔
      },
    },
  };

  // 挂载的顶层组件
  let app = document.getElementById("xsxkapp");

  // 组件生成
  ((self) => {
    // 生成组件
    self.mount = () => {
      self.createTag();
      self.createPanel();
      self.createMask();
      self.addEnrollButton();
    };

    // 生成节点
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

    // 生成打开和关闭面板的按钮
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

    // 生成面板
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
                    await methods.stopEnrolling();
                  }
                  isRunning = true;
                  methods.updateUIState();
                  methods.enroll();
                },
              },
            }),
            self.createNode({
              tagName: "button",
              obj: {
                id: "settings-stop-button",
                class: `el-button el-button--${
                  isRunning ? "danger" : "info"
                } el-button--small is-round`,
                style: `
                  margin: 20px;
                  position: absolute;
                  right:20%;
                  bottom:5%
                `,
              },
              text: isRunning ? "停止抢课" : "更多设置",
              ev: {
                click: async () => {
                  if (isRunning) {
                    await methods.stopEnrolling();
                  } else {
                    document.getElementById("mask").style.display = "block";
                    self.createPopUp(
                      "更多设置",
                      self.showSettings(),
                      () => {
                        if (tempSettings) {
                          Object.assign(settings, tempSettings);
                          methods.saveData();
                          tip({
                            type: "success",
                            message: "设置已保存",
                            duration: 1000,
                          });
                          tempSettings = null; // 清理临时设置
                        }
                      },
                      30,
                      40
                    );
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

    // 生成抢课表格
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
                                methods.saveData();
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

    // 生成遮罩
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

    // 生成弹出窗
    self.createPopUp = (title, node, onConfirm, width, height) =>
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
                  position: absolute;
                  right:10%;
                  bottom:10%
                `,
              },
              text: "确定",
              ev: {
                click: () => {
                  if (onConfirm) onConfirm();
                  document.getElementById("mask").style.display = "none";
                  app.removeChild(document.getElementsByClassName("temp")[0]);
                },
              },
            }),
          ],
        })
      );

    self.showSettings = () => {
      // 创建临时设置对象
      tempSettings = JSON.parse(JSON.stringify(settings));
      let intervalInput = null;
      let saveButton = null;

      const updateSaveButton = () => {
        if (!intervalInput || !saveButton) return;

        const currentValue = parseInt(intervalInput.value);
        const expectedValue = methods.getCurrentInterval(tempSettings);
        const isDifferent = currentValue !== expectedValue;

        saveButton.style.opacity = isDifferent ? "1" : "0.5";
        saveButton.style.cursor = isDifferent ? "pointer" : "not-allowed";
        saveButton.disabled = !isDifferent;
      };

      const createIntervalInput = () => {
        intervalInput = self.createNode({
          tagName: "input",
          obj: {
            class: "el-input__inner",
            type: "number",
            value: methods.getCurrentInterval(tempSettings),
            min: tempSettings.mode.isGrouped ? "1000" : "100",
            max: tempSettings.mode.isGrouped ? "2000" : "1000",
            step: "25",
            style: `
                  width: 40%;
                  margin-left: 2%;
                  margin-right: 2%;
                  height: 30px
                `,
          },
          ev: {
            input: updateSaveButton,
            wheel: (e) => {
              e.preventDefault();
              const delta = e.deltaY > 0 ? -25 : 25;
              const newValue = Math.max(
                parseInt(e.target.min),
                Math.min(
                  parseInt(e.target.max),
                  parseInt(e.target.value) + delta
                )
              );
              e.target.value = newValue;
              updateSaveButton();
            },
          },
        });
        return intervalInput;
      };

      const createSaveButton = () => {
        saveButton = self.createNode({
          tagName: "button",
          obj: {
            class: "el-button el-button--primary el-button--small",
            style: "opacity: 0.5; cursor: not-allowed",
            disabled: true,
          },
          text: "应用",
          ev: {
            click: () => {
              const mode = tempSettings.mode.isAsync ? "async" : "sync";
              const type = tempSettings.mode.isGrouped ? "group" : "single";
              tempSettings.interval[mode][type] = parseInt(intervalInput.value);
              saveButton.style.opacity = "0.5";
              saveButton.style.cursor = "not-allowed";
              saveButton.disabled = true;
            },
          },
        });
        return saveButton;
      };

      const settingsNode = self.createNode({
        tagName: "div",
        obj: {
          style: "margin: 10%",
        },
        children: [
          // 抢课方式选择
          self.createNode({
            tagName: "div",
            obj: {
              style: "margin-bottom: 5%",
            },
            children: [
              self.createNode({
                tagName: "label",
                text: "抢课方式：",
                obj: {
                  style: "margin-right: 10%",
                },
              }),
              self.createNode({
                tagName: "input",
                obj: {
                  type: "radio",
                  name: "cycle-mode",
                  id: "single-cycle",
                },
                ev: {
                  change: (e) => {
                    tempSettings.mode.isCyclic = !e.target.checked;
                  },
                },
              }),
              self.createNode({
                tagName: "label",
                text: " 单次抢课",
                obj: {
                  for: "single-cycle",
                  style: "margin-right: 10%",
                },
              }),
              self.createNode({
                tagName: "input",
                obj: {
                  type: "radio",
                  name: "cycle-mode",
                  id: "multi-cycle",
                },
                ev: {
                  change: (e) => {
                    tempSettings.mode.isCyclic = e.target.checked;
                  },
                },
              }),
              self.createNode({
                tagName: "label",
                text: " 循环抢课",
                obj: {
                  for: "multi-cycle",
                },
              }),
            ],
          }),
          // 发送模式选择
          self.createNode({
            tagName: "div",
            obj: {
              style: "margin-bottom: 5%",
            },
            children: [
              self.createNode({
                tagName: "label",
                text: "发送模式：",
                obj: {
                  style: "margin-right: 10%",
                },
              }),
              self.createNode({
                tagName: "input",
                obj: {
                  type: "radio",
                  name: "send-mode",
                  id: "sync-mode",
                },
                ev: {
                  change: (e) => {
                    tempSettings.mode.isAsync = !e.target.checked;
                    intervalInput.value =
                      methods.getCurrentInterval(tempSettings);
                    updateSaveButton();
                  },
                },
              }),
              self.createNode({
                tagName: "label",
                text: " 同步模式",
                obj: {
                  for: "sync-mode",
                  style: "margin-right: 10%",
                },
              }),
              self.createNode({
                tagName: "input",
                obj: {
                  type: "radio",
                  name: "send-mode",
                  id: "async-mode",
                },
                ev: {
                  change: (e) => {
                    tempSettings.mode.isAsync = e.target.checked;
                    intervalInput.value =
                      methods.getCurrentInterval(tempSettings);
                    updateSaveButton();
                  },
                },
              }),
              self.createNode({
                tagName: "label",
                text: " 异步模式",
                obj: {
                  for: "async-mode",
                },
              }),
            ],
          }),
          // 发送方式选择
          self.createNode({
            tagName: "div",
            obj: {
              style: "margin-bottom: 5%",
            },
            children: [
              self.createNode({
                tagName: "label",
                text: "发送方式：",
                obj: {
                  style: "margin-right: 10%",
                },
              }),
              self.createNode({
                tagName: "input",
                obj: {
                  type: "radio",
                  name: "group-mode",
                  id: "single-send",
                },
                ev: {
                  change: (e) => {
                    tempSettings.mode.isGrouped = !e.target.checked;
                    intervalInput.value =
                      methods.getCurrentInterval(tempSettings);
                    updateSaveButton();
                  },
                },
              }),
              self.createNode({
                tagName: "label",
                text: " 单个发送",
                obj: {
                  for: "single-send",
                  style: "margin-right: 10%",
                },
              }),
              self.createNode({
                tagName: "input",
                obj: {
                  type: "radio",
                  name: "group-mode",
                  id: "group-send",
                },
                ev: {
                  change: (e) => {
                    tempSettings.mode.isGrouped = e.target.checked;
                    intervalInput.value =
                      methods.getCurrentInterval(tempSettings);
                    updateSaveButton();
                  },
                },
              }),
              self.createNode({
                tagName: "label",
                text: " 分组发送",
                obj: {
                  for: "group-send",
                },
              }),
            ],
          }),
          // 时间间隔设置
          self.createNode({
            tagName: "div",
            obj: {
              style: "display: flex; align-items: center",
            },
            children: [
              self.createNode({
                tagName: "label",
                text: "时间间隔(ms)：",
                obj: {
                  style: "margin-right: 10px",
                },
              }),
              createIntervalInput(),
              createSaveButton(),
            ],
          }),
        ],
      });

      // 创建完成后进行初始化
      setTimeout(() => {
        // 获取所有需要初始化的单选按钮
        const singleCycleInput = settingsNode.querySelector("#single-cycle");
        const multiCycleInput = settingsNode.querySelector("#multi-cycle");
        const syncModeInput = settingsNode.querySelector("#sync-mode");
        const asyncModeInput = settingsNode.querySelector("#async-mode");
        const singleSendInput = settingsNode.querySelector("#single-send");
        const groupSendInput = settingsNode.querySelector("#group-send");

        // 根据设置初始化抢课方式
        if (tempSettings.mode.isCyclic) {
          multiCycleInput.checked = true;
        } else {
          singleCycleInput.checked = true;
        }

        // 根据设置初始化发送模式
        if (tempSettings.mode.isAsync) {
          asyncModeInput.checked = true;
        } else {
          syncModeInput.checked = true;
        }

        // 根据设置初始化发送方式
        if (tempSettings.mode.isGrouped) {
          groupSendInput.checked = true;
        } else {
          singleSendInput.checked = true;
        }
      }, 0);

      return settingsNode;
    };

    // 生成课程详情信息
    self.showCourseDetails = (course) => {
      return self.createNode({
        tagName: "div",
        obj: {
          style: `margin:5%`,
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
            margin: 0 auto;
          `,
            },
            children: [
              // 表头
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
              <th style="text-align:center;width: 70%">值</th>
            `,
              }),
              // 课程号和课程名
              self.createNode({
                tagName: "tr",
                obj: {
                  style: `height: 30px`,
                },
                children: [
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: "课程信息",
                  }),
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: `${course.courseName}`,
                  }),
                ],
              }),
              // 学院和教师
              self.createNode({
                tagName: "tr",
                obj: {
                  style: `height: 30px`,
                },
                children: [
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: "开课单位/教师",
                  }),
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: `${course.department} ${course.teacherName}`,
                  }),
                ],
              }),
              // 授课地点
              self.createNode({
                tagName: "tr",
                obj: {
                  style: `height: 30px`,
                },
                children: [
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: "授课地点",
                  }),
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: course.location || "待定",
                  }),
                ],
              }),
              // 课程性质和类别
              self.createNode({
                tagName: "tr",
                obj: {
                  style: `height: 30px`,
                },
                children: [
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: "课程属性",
                  }),
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: `${course.courseNature} ${course.courseCategory}`,
                  }),
                ],
              }),
              // 选课人数
              self.createNode({
                tagName: "tr",
                obj: {
                  style: `height: 30px`,
                },
                children: [
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: "选课人数",
                  }),
                  self.createNode({
                    tagName: "td",
                    obj: { style: `text-align: center` },
                    text: `${course.selectedCount}/${course.totalCapacity}`,
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
    // 初始化函数
    async init() {
      // 初始化设置为默认值的深拷贝
      settings = JSON.parse(JSON.stringify(defaultSettings));

      let raw = JSON.parse(localStorage.getItem("july"));
      if (raw) {
        // 循环检查 sessionStorage.token 直到其不为 undefined
        while (typeof sessionStorage.token === "undefined") {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // 递归合并设置
        const mergeSettings = (target, source) => {
          Object.keys(target).forEach((key) => {
            if (source[key] !== undefined) {
              if (
                typeof target[key] === "object" &&
                !Array.isArray(target[key])
              ) {
                mergeSettings(target[key], source[key]);
              } else {
                target[key] = source[key];
              }
            }
          });
        };

        if (raw.settings) {
          mergeSettings(settings, raw.settings);
        }

        // 检查token匹配
        if (settings.token === sessionStorage.token) {
          enrollDict = raw.enrollDict;
        } else if (raw.enrollDict && JSON.stringify(raw.enrollDict) !== "{}") {
          const courseCodes = Object.keys(raw.enrollDict).join(" ");
          const inputBox = document.getElementById("input-box");
          inputBox.value = courseCodes;
          settings.savedCourseCodes = courseCodes;

          tip({
            type: "warning",
            message: "登录信息发生变动，已清空抢课列表",
            duration: 1000,
          });

          enrollDict = {};
        }
      }

      // 更新token
      settings.token = sessionStorage.token;

      // 初始化状态
      isRunning = false;
      shouldStop = false;

      // 更新UI
      methods.updateUIState();
      window.Components.reloadList();

      // 保存清理后的数据
      methods.saveData();
    },
    // 保存数据到本地存储
    saveData() {
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
      const settingsStopButton = document.getElementById(
        "settings-stop-button"
      );
      const listWrap = document.getElementById("list-wrap");

      if (isRunning) {
        // 禁用输入和编辑功能
        inputBox.disabled = true;
        inputBox.style.cursor = "not-allowed";
        inputBox.style.opacity = "0.5";

        // 更新设置/停止按钮为停止状态
        settingsStopButton.className =
          "el-button el-button--danger el-button--small is-round";
        settingsStopButton.textContent = "停止抢课";
        settingsStopButton.style.cursor = "pointer";
        settingsStopButton.style.opacity = "1";

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
        // 启用输入和编辑功能
        inputBox.disabled = false;
        inputBox.style.cursor = "auto";
        inputBox.style.opacity = "1";

        // 更新设置/停止按钮为设置状态
        settingsStopButton.className =
          "el-button el-button--info el-button--small is-round";
        settingsStopButton.textContent = "扩展设置";
        settingsStopButton.style.cursor = "pointer";
        settingsStopButton.style.opacity = "1";

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

      const createCourseInfo = (course, teacher) => ({
        // 选课信息
        courseBatch: grablessonsVue.lcParam.currentBatch.code,
        classID: teacher.JXBID,
        courseType: currentType,
        secretVal: teacher.secretVal,

        // 更多信息
        courseName: course.KCM,
        teacherName: teacher.SKJS,
        department: teacher.KKDW, // 开课单位(学院)
        location: teacher.YPSJDD, // 授课地点
        selectedCount: teacher.numberOfSelected, // 已选人数
        totalCapacity: teacher.classCapacity, // 总容量
        courseNature: teacher.KCXZ, // 课程性质
        courseCategory: teacher.KCLB, // 课程类别
      });

      for (let course of currentCourseList) {
        // 检查课程是否存在
        if (course.KCH === courseCode) {
          courseFlag = true;
          // 检查教师是否存在
          if (grablessonsVue.teachingClassType !== "XGKC") {
            for (let teacher of course.tcList) {
              if (teacher.KXH === teacherCode) {
                enrollDict[code] = createCourseInfo(course, teacher);
                teacherFlag = true;
              }
            }
          } else {
            if (course.KXH === teacherCode) {
              enrollDict[code] = createCourseInfo(course, course);
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
      methods.saveData();
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

      methods.saveData();
      window.Components.reloadList();
    },
    // 获取当前应用的间隔时间
    getCurrentInterval(settingsObj) {
      const mode = settingsObj.mode.isAsync ? "async" : "sync";
      const type = settingsObj.mode.isGrouped ? "group" : "single";
      return settingsObj.interval[mode][type];
    },
    // 一键抢课
    async enroll() {
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

      // 发送单个抢课请求并处理响应
      const sendEnrollRequest = async (key) => {
        const course = enrollDict[key];
        const enrollResponse = await request({
          url: "/elective/clazz/add",
          method: "POST",
          headers: {
            batchId: course.courseBatch,
            "content-type": "application/x-www-form-urlencoded",
          },
          data: Qs.stringify({
            clazzType: course.courseType,
            clazzId: course.classID,
            secretVal: course.secretVal,
          }),
        });

        let type = enrollResponse.data.code === 200 ? "success" : "warning";
        tip({
          type,
          message:
            enrollResponse.data.code === 200
              ? `已成功添加 ${course.teacherName} 的 ${course.courseName} 到选课队列`
              : `${course.teacherName} 的 ${course.courseName}: ${enrollResponse.data.msg}`,
          duration: 1000,
        });

        if (enrollResponse.data.code === 200) {
          delete enrollDict[key];
          methods.saveData();
          window.Components.reloadList();
          return true;
        } else if (enrollResponse.data.code === 301) {
          const confirmResponse = await request({
            url: "/elective/clazz/add",
            method: "POST",
            headers: {
              batchId: course.courseBatch,
              "content-type": "application/x-www-form-urlencoded",
            },
            data: Qs.stringify({
              clazzType: course.courseType,
              clazzId: course.courseCode,
              secretVal: course.secretVal,
              isConfirm: 1,
            }),
          });

          if (confirmResponse.data.code === 200) {
            tip({
              type: "success",
              message: `已成功添加 ${course.teacherName} 的 ${course.courseName} 到选课队列`,
              duration: 1000,
            });
            delete enrollDict[key];
            methods.saveData();
            window.Components.reloadList();
            return true;
          }
        }
        return false;
      };

      const doEnroll = async () => {
        if (shouldStop) {
          isRunning = false;
          methods.updateUIState();
          return;
        }

        if (index >= key_list.length) {
          if (settings.mode.isCyclic && Object.keys(enrollDict).length) {
            key_list = Object.keys(enrollDict).filter(
              (key) =>
                enrollDict[key].courseBatch ===
                grablessonsVue.lcParam.currentBatch.code
            );
            if (key_list.length) {
              index = 0;
            } else {
              isRunning = false;
              methods.updateUIState();
              return;
            }
          } else {
            isRunning = false;
            methods.updateUIState();
            return;
          }
        }

        if (settings.mode.isGrouped) {
          // 分组发送模式：每组3个请求
          const groupKeys = key_list.slice(index, index + 3);
          index += 3;

          if (settings.mode.isAsync) {
            // 异步模式：同时发送所有请求
            groupKeys.forEach((key) => sendEnrollRequest(key));
          } else {
            // 同步模式：等待所有请求完成
            await Promise.all(groupKeys.map((key) => sendEnrollRequest(key)));
          }
        } else {
          // 单个发送模式
          const key = key_list[index++];
          if (!settings.mode.isAsync) {
            await sendEnrollRequest(key);
          } else {
            sendEnrollRequest(key);
          }
        }

        // 等待间隔后发起下一次请求
        await new Promise((resolve) =>
          setTimeout(resolve, methods.getCurrentInterval(settings))
        );
        doEnroll();
      };

      // 开始执行
      doEnroll();
    },
    // 停止抢课
    async stopEnrolling() {
      shouldStop = true;
      while (isRunning) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      await new Promise((resolve) =>
        setTimeout(resolve, methods.getCurrentInterval(settings))
      );
      shouldStop = false;
      methods.updateUIState();
    },
    // 搜索课程
    async searchCourse() {
      // 构建请求参数
      const params = {
        teachingClassType: grablessonsVue.teachingClassType,
        pageNumber: 1,
        pageSize: grablessonsVue.pubParam.pageSize,
        orderBy: "",
      };

      // 添加校区参数
      if (grablessonsVue.teachingClassType !== "ALLKC") {
        params.campus = grablessonsVue.currentCampus.code;
      }

      try {
        const response = await request.post("/elective/clazz/list", params);
        const { data } = response;

        if (data && data.code === 200) {
          const courseList = data.data.rows;
          return courseList;
        }
      } catch (error) {
        console.error("搜索课程失败:", error);
        tip({
          type: "error",
          message: "搜索课程失败",
          duration: 1000,
        });
      }

      return [];
    },
  };
  window.Components.mount();
  methods.init();
})();
