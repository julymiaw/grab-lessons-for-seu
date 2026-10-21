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
        node.textContent = String(text);
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
            id: "seu-panel",
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
                id: "seu-input-box",
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
                id: "seu-list-wrap",
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
                id: "seu-enroll-button",
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
                    return;
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
                id: "seu-settings-stop-button",
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
                    document.getElementById("seu-mask").style.display = "block";
                    self.updatePopup(settings.mode.enableSearch, settings);
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
      let list_wrap = document.querySelector("#seu-panel #seu-list-wrap");
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
                        text: methods.displayCourse(enrollDict[key]),
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
                                if (core.pending(course.status)) {
                                  if (!window.confirm('本课程的服务器处理结果尚未确认。删除只移除本地记录，不会取消服务器队列；重新添加后可能再次提交。请先核实官网结果，确认仍要删除本地记录吗？')) return;
                                  ledger.records.delete(core.keyOf(course));
                                }
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
                                document.getElementById("seu-mask").style.display =
                                  "block";
                                self.createPopUp(
                                  "详细信息",
                                  self.showCourseDetails(enrollDict[key]),
                                  null,
                                  40,
                                  50
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
          id: "seu-mask",
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
            document.querySelectorAll(".seu-temp").forEach((el) => {
              if (el.parentNode) el.parentNode.removeChild(el);
            });
          },
        },
      });
      app.appendChild(node);
    };

    // 生成弹出窗
    self.createPopUp = (title, node, onConfirm, width, height, onExtend) => {
      const popupNode = self.createNode({
        tagName: "div",
        obj: {
          class: "seu-temp",
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
            tagName: "div",
            obj: {
              style: `
                position: absolute;
                width: 80%;
                left: 10%;
                bottom: 10%;
                display: flex;
                justify-content: space-between;
                align-items: center;
              `,
            },
            children: [
              // 左侧按钮组
              self.createNode({
                tagName: "div",
                obj: {
                  style: "display: flex; gap: 10%;",
                },
                children: [
                  ...(onExtend
                    ? [
                        self.createNode({
                          tagName: "button",
                          obj: {
                            class:
                              "el-button el-button--primary el-button--large is-round",
                          },
                          text: "更多",
                          ev: { click: onExtend },
                        }),
                      ]
                    : []),
                  // 如果存在其他temp类元素,说明当前不是第一层弹窗
                  ...(document.querySelectorAll(".seu-temp").length > 0
                    ? [
                        self.createNode({
                          tagName: "button",
                          obj: {
                            class:
                              "el-button el-button--warning el-button--large is-round",
                          },
                          text: "返回",
                          ev: {
                            click: () => {
                              // 移除当前弹窗
                              if (popupNode.parentNode) {
                                popupNode.parentNode.removeChild(popupNode);
                              }
                            },
                          },
                        }),
                      ]
                    : []),
                ],
              }),
              // 右侧确认按钮
              self.createNode({
                tagName: "button",
                obj: {
                  class:
                    "el-button el-button--default el-button--large is-round",
                },
                text: "确定",
                ev: {
                  click: () => {
                    if (onConfirm) onConfirm();
                    if (document.querySelectorAll(".seu-temp").length > 1) {
                      if (popupNode.parentNode) {
                        popupNode.parentNode.removeChild(popupNode);
                      }
                    } else {
                      // 否则清除所有弹窗
                      document.getElementById("seu-mask").style.display = "none";
                      document.querySelectorAll(".seu-temp").forEach((el) => {
                        if (el.parentNode) el.parentNode.removeChild(el);
                      });
                    }
                  },
                },
              }),
            ],
          }),
        ],
        ev: {
          // 阻止默认的表单提交行为
          submit: (e) => e.preventDefault(),
          // 阻止回车冒泡
          keydown: (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
            }
          },
        },
      });

      app.appendChild(popupNode);
      return popupNode;
    };

    self.currentPopup = null;

    // 更新弹窗
    self.updatePopup = (enableSearch, tempSettings) => {
      // 如果存在旧弹窗，先移除
      if (self.currentPopup && self.currentPopup.parentNode) {
        self.currentPopup.parentNode.removeChild(self.currentPopup);
      }

      const mainSettings = self.showSettings(tempSettings);

      // 创建新弹窗
      self.currentPopup = self.createPopUp(
        "设置",
        mainSettings.node,
        () => {
          Object.assign(settings, mainSettings.tempSettings);
          methods.saveData();
          tip({
            type: "success",
            message: "设置已保存",
            duration: 1000,
          });
        },
        30,
        45,
        () => {
              const searchSettings = self.showSearchSettings(mainSettings.tempSettings);
              self.createPopUp(
                "更多设置",
                searchSettings.node,
                () => {
                  mainSettings.tempSettings.mode.groupSize = searchSettings.tempSettings.mode.groupSize;
                  mainSettings.tempSettings.search = searchSettings.tempSettings.search;
                  Object.assign(settings, JSON.parse(JSON.stringify(mainSettings.tempSettings)));
                  methods.saveData();
                  tip({
                    type: "success",
                    message: "设置已保存",
                    duration: 1000,
                  });
                },
                30,
                45
              );
            }
      );
    };

    // 数值输入框
    self.createNumberInput = (options) => {
      const {
        value, // 初始值
        min, // 最小值
        max, // 最大值
        step, // 步进值
        style, // 样式
        onSave, // 保存回调
        updateValue, // 值更新回调(可选)
      } = options;

      let inputElement = null;
      let currentBaseValue = value;

      // 自动保存函数
      const autoSave = () => {
        if (!inputElement) return;
        const parsed = Number(inputElement.value);
        const candidate = inputElement.value.trim() && Number.isFinite(parsed) ? Math.trunc(parsed) : currentBaseValue;
        const currentValue = Math.max(Number(inputElement.min), Math.min(Number(inputElement.max), candidate));
        inputElement.value = currentValue;
        onSave(currentValue);
        currentBaseValue = currentValue;
      };

      // 创建输入框
      inputElement = self.createNode({
        tagName: "input",
        obj: {
          class: "el-input__inner",
          type: "number",
          value: value,
          min: min,
          max: max,
          step: step,
          style:
            style ||
            "width: 60%; margin-left: 2%; margin-right: 2%; height: 30px",
        },
        ev: {
          blur: autoSave, // 失去焦点时自动保存
          wheel: (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -parseInt(step) : parseInt(step);
            const newValue = Math.max(
              parseInt(inputElement.min),
              Math.min(parseInt(inputElement.max), parseInt(e.target.value) + delta)
            );
            e.target.value = newValue;
            autoSave(); // 滚轮修改后立即保存
            if (updateValue) updateValue(newValue);
          },
          keydown: (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              autoSave(); // 按回车时自动保存
              e.target.blur(); // 失去焦点
            } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              const delta =
                e.key === "ArrowUp" ? parseInt(step) : -parseInt(step);
              const newValue = Math.max(
                parseInt(inputElement.min),
                Math.min(parseInt(inputElement.max), parseInt(e.target.value) + delta)
              );
              e.target.value = newValue;
              autoSave(); // 方向键修改后立即保存
              if (updateValue) updateValue(newValue);
            }
          },
        },
      });

      return {
        input: inputElement,
      };
    };

    // 设置
    self.showSettings = (tempSettings) => {
      tempSettings = tempSettings
        ? JSON.parse(JSON.stringify(tempSettings))
        : JSON.parse(JSON.stringify(settings));

      const intervalInput = self.createNumberInput({
        value: methods.getCurrentInterval(tempSettings),
        min: tempSettings.mode.isGrouped ? "1000" : "1",
        max: "60000",
        step: "1",
        onSave: (value) => {
          const mode = tempSettings.mode.isAsync ? "async" : "sync";
          const type = tempSettings.mode.isGrouped ? "group" : "single";
          tempSettings.interval[mode][type] = value;
        },
      });

      intervalInput.input.id = "seu-interval";
      intervalInput.input.setAttribute("aria-label", "发送间隔（毫秒）");
      const settingsNode = self.createNode({
        tagName: "div",
        obj: {
          style: "margin-left: 10%",
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
                    const newValue = methods.getCurrentInterval(tempSettings);
                    intervalInput.input.value = newValue;
                    intervalInput.input.min = tempSettings.mode.isGrouped ? "1000" : "1";
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
                    const newValue = methods.getCurrentInterval(tempSettings);
                    intervalInput.input.value = newValue;
                    intervalInput.input.min = tempSettings.mode.isGrouped ? "1000" : "1";
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
                    const newValue = methods.getCurrentInterval(tempSettings);
                    intervalInput.input.value = newValue;
                    intervalInput.input.min = tempSettings.mode.isGrouped ? "1000" : "1";
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
                    const newValue = methods.getCurrentInterval(tempSettings);
                    intervalInput.input.value = newValue;
                    intervalInput.input.min = tempSettings.mode.isGrouped ? "1000" : "1";
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
              intervalInput.input,
            ],
          }),
          // 搜索功能启用开关
          self.createNode({
            tagName: "div",
            obj: {
              style: "margin-top: 5%",
            },
            children: [
              self.createNode({
                tagName: "label",
                text: "启用搜索功能：",
                obj: {
                  style: "margin-right: 5%",
                },
              }),
              self.createNode({
                tagName: "input",
                obj: {
                  type: "checkbox",
                  id: "enable-search",
                },
                ev: {
                  change: (e) => {
                    tempSettings.mode.enableSearch = e.target.checked;
                    self.updatePopup(e.target.checked, tempSettings);
                  },
                },
              }),
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
        const enableSearchInput = settingsNode.querySelector("#enable-search");

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

        // 根据设置初始化搜索功能开关
        if (tempSettings.mode.enableSearch) {
          enableSearchInput.checked = true;
        }
      }, 0);

      return {
        node: settingsNode,
        tempSettings: tempSettings,
      };
    };

    // 搜索设置
    self.showSearchSettings = (source = settings) => {
      // 创建临时设置对象和引用变量
      const tempSettings = JSON.parse(JSON.stringify(source));

      const groupSizeInput = self.createNumberInput({
        value: tempSettings.mode.groupSize,
        min: "1", max: String(Number.MAX_SAFE_INTEGER), step: "1",
        onSave: value => { tempSettings.mode.groupSize = core.groupSize(value); },
      });
      groupSizeInput.input.id = "seu-group-size";
      const pageSizeInput = self.createNumberInput({
        value: tempSettings.search.pageSize,
        min: "10",
        max: "100",
        step: "10",
        onSave: (value) => {
          tempSettings.search.pageSize = value;
        },
      });

      const pageDelayInput = self.createNumberInput({
        value: tempSettings.search.pageDelay,
        min: "1000",
        max: "60000",
        step: "100",
        onSave: (value) => {
          tempSettings.search.pageDelay = value;
        },
      });

      const settingsNode = self.createNode({
        tagName: "div",
        obj: { style: "margin: 10%" },
        children: [
          self.createNode({
            tagName: "div",
            obj: { style: "margin-bottom: 5%" },
            children: [
              self.createNode({ tagName: "label", text: "每组课程数：", obj: { for: "seu-group-size", style: "margin-right: 10%" } }),
              groupSizeInput.input,
            ],
          }),
          // 每页数量设置
          self.createNode({
            tagName: "div",
            obj: { style: "margin-bottom: 5%" },
            children: [
              self.createNode({
                tagName: "label",
                text: "每页数量：",
                obj: { style: "margin-right: 10%" },
              }),
              pageSizeInput.input,
            ],
          }),
          // 翻页延迟设置
          self.createNode({
            tagName: "div",
            obj: { style: "margin-bottom: 5%" },
            children: [
              self.createNode({
                tagName: "label",
                text: "翻页延迟：",
                obj: { style: "margin-right: 10%" },
              }),
              pageDelayInput.input,
            ],
          }),
        ],
      });

      return {
        node: settingsNode,
        tempSettings: tempSettings,
      };
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
                    text: `${methods.displayCourse(course)} ${course.message || ""}`,
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

    // 显示公告弹窗
    self.showAnnouncement = () => {
      // 显示弹窗时立即标记为已读
      settings.announcement.hasRead = true;
      methods.saveData();

      const announcementNode = self.createNode({
        tagName: "div",
        obj: {
          style: `
            margin: 5% 10%;
            padding: 20px;
            background-color: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 10px;
          `,
        },
        children: [
          self.createNode({
            tagName: "p",
            obj: {
              style: `
                color: #333;
                line-height: 1.8;
                text-indent: 2em;
                margin-bottom: 10px;
              `,
            },
            text: "请各位同学秉持诚信原则参与选课，严禁使用脚本、代码等任何手段(无论有意或无意)干扰、破坏选课秩序；学校将对选课数据进行后台异常监测，一经查实违规行为，将直接判定选课结果无效，并根据情节轻重依规给予相应纪律处分。",
          }),
          self.createNode({
            tagName: "p",
            obj: {
              style: `
                color: #333;
                line-height: 1.8;
                text-indent: 2em;
              `,
            },
            text: "在此提醒大家，自觉抵制各类非法课程资源交易。若发现网上存在非法售卖本校课程资源、诱导同学参与违规交易等情况，请第一时间向学院或教务处提供线索。让我们携手监督、共同行动，以实际行动维护公平、诚信、有序的选课氛围，筑牢校园学术诚信防线。",
          }),
        ],
      });

      // 关闭公告弹窗的函数（需要在使用前定义）
      const closeAnnouncement = () => {
        const mask = document.getElementById("seu-mask");
        if (mask) mask.style.display = "none";
        if (popupNode && popupNode.parentNode) {
          popupNode.parentNode.removeChild(popupNode);
        }
      };

      const popupNode = self.createNode({
        tagName: "div",
        obj: {
          class: "announcement-popup",
          style: `
            position: fixed;
            left: 25%;
            top: 20%;
            width: 50%;
            max-height: 60%;
            z-index: 2021;
            background-color: white;
            border-radius: 30px;
            overflow: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
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
                color: #d9534f;
              `,
            },
            text: "特别提醒（转）",
          }),
          announcementNode,
          self.createNode({
            tagName: "div",
            obj: {
              style: `
                position: relative;
                width: 80%;
                left: 10%;
                margin: 20px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
              `,
            },
            children: [
              self.createNode({
                tagName: "div",
                obj: {
                  style: "display: flex; align-items: center;",
                },
                children: [
                  self.createNode({
                    tagName: "input",
                    obj: {
                      type: "checkbox",
                      id: "dont-show-again",
                      checked: true,
                      style: "margin-right: 8px; cursor: pointer;",
                    },
                    ev: {
                      change: (e) => {
                        settings.announcement.hasRead = e.target.checked;
                        methods.saveData();
                      },
                    },
                  }),
                  self.createNode({
                    tagName: "label",
                    text: "不再弹出",
                    obj: {
                      for: "dont-show-again",
                      style: "cursor: pointer; user-select: none;",
                    },
                  }),
                ],
              }),
              self.createNode({
                tagName: "button",
                obj: {
                  class:
                    "el-button el-button--primary el-button--large is-round",
                },
                text: "我知道了",
                ev: {
                  click: closeAnnouncement,
                },
              }),
            ],
          }),
        ],
      });

      // 显示遮罩，并设置点击事件
      const mask = document.getElementById("seu-mask");
      if (mask) {
        mask.style.display = "block";
        // 为遮罩添加一次性点击事件监听器
        const maskClickHandler = (e) => {
          if (e.target === mask) {
            closeAnnouncement();
            mask.removeEventListener("click", maskClickHandler);
          }
        };
        mask.addEventListener("click", maskClickHandler);
      }

      app.appendChild(popupNode);
    };

  })(Components);
