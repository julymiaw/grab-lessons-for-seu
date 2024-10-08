(function () {
  //版本
  let version = [2, 0, 0];

  //请求
  let request = axios.create();

  //提示
  let tip = grablessonsVue.$message;

  let isAdding = false; // 添加状态

  //设置
  let settings = {
    auto: false,
  };

  //所选课程
  let enrollDict = {};

  //挂载的顶层组件
  let app = document.getElementById("xsxkapp");

  // 页面信息
  const menu = document
    .getElementsByClassName("teachingClassTypeMenu")[0]
    .getElementsByClassName("el-menu-item");
  const page = document
    .getElementsByClassName("el-pager")[0]
    .getElementsByClassName("number");

  //组件生成
  ((self) => {
    //生成组件
    self.mount = () => {
      self.createTag();
      self.createPanel();
      self.createMask();
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
              display: none
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
                  height: 50%
              `,
              },
            }),
            self.createNode({
              tagName: "button",
              obj: {
                id: "add-button",
                class: "el-button el-button--primary el-button--small is-round",
                style: `
                  margin: 20px;
                  position: absolute;
                  right:2%;
                  bottom:25%
                `,
              },
              text: "一键添加",
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
                  methods.startAdding();
                },
              },
            }),
            self.createNode({
              tagName: "button",
              obj: {
                id: "enroll-button",
                class: "el-button el-button--default el-button--small is-round",
                style: `
                  margin: 20px;
                  position: absolute;
                  right:2%;
                  bottom:20%
                `,
              },
              text: "一键抢课",
              ev: {
                click: () => {
                  methods.enroll();
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
                      bottom:10%;
                      color: white;
                      float: right
                  `,
              },
              text: "ver" + version.join("."),
            }),
            self.createNode({
              tagName: "div",
              obj: {
                id: "update-tip",
                style: `
                      margin: 20px;
                      position: absolute;
                      right:2%;
                      bottom:5%;
                      color: red;
                      float: right;
                      cursor: pointer;
                      display:none
                  `,
              },
              text: "有新版本，点击更新。更新后请重新进入选课页面",
              ev: {
                click: () => {
                  window.open("https://greasyfork.org/scripts/427237");
                },
              },
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
                                delete enrollDict[key];
                                methods.saveCourse();
                                tip({
                                  type: "success",
                                  message: "已删除",
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
                                  "更多操作",
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
              margin: 20px;
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

    self.showCourseDetails = (course) => {
      return self.createNode({
        tagName: "div",
        obj: {
          style: `margin:30px`,
        },
        children: [
          self.createNode({
            tagName: "table",
            obj: {
              width: "100%",
              border: "1",
              style: `
            background-color: rgba(0,0,0,0);
            color: black;
            text-align: left;
          `,
            },
            children: [
              self.createNode({
                tagName: "tr",
                HTML: `
              <th>属性</th>
              <th>值</th>
            `,
              }),
              self.createNode({
                tagName: "tr",
                HTML: `
              <td>课程名称</td>
              <td>${course.courseName}</td>
            `,
              }),
              self.createNode({
                tagName: "tr",
                HTML: `
              <td>教师名称</td>
              <td>${course.teacherName}</td>
            `,
              }),
              self.createNode({
                tagName: "tr",
                HTML: `
              <td>课程代码</td>
              <td>${course.courseCode}</td>
            `,
              }),
              self.createNode({
                tagName: "tr",
                HTML: `
              <td>课程类型</td>
              <td>${course.courseType}</td>
            `,
              }),
              self.createNode({
                tagName: "tr",
                HTML: `
              <td>批次</td>
              <td>${course.courseBatch}</td>
            `,
              }),
              self.createNode({
                tagName: "tr",
                HTML: `
              <td>Secret Value</td>
              <td>${course.secretVal}</td>
            `,
              }),
            ],
          }),
        ],
      });
    };

    //生成高级操作
    self.createAdvancedPop = () =>
      self.createNode({
        tagName: "div",
        obj: {
          style: `
            margin:50px
        `,
        },
        children: [
          self.createNode({
            tagName: "div",
            children: [
              self.createNode({
                tagName: "input",
                obj: {
                  id: "auto",
                  type: "checkbox",
                  value: "settings.auto",
                },
              }),
              self.createNode({
                tagName: "label",
                obj: {
                  for: "auto",
                },
                text: "自动抢课（开发中）",
              }),
            ],
          }),
        ],
      });
  })((window.Components = window.Components || {}));

  let methods = {
    //初始化数据
    init() {
      methods.checkVersion();
      let raw = JSON.parse(localStorage.getItem("huhu"));
      if (raw) {
        settings = raw.settings;
        if (settings.jwt === sessionStorage.token) {
          enrollDict = raw.enrollDict;
        } else if (JSON.stringify(raw.enrollDict) !== "{}") {
          tip({
            type: "warning",
            message: "登录信息发生变动，已清空抢课列表",
            duration: 1000,
          });
          enrollDict = {};
          settings.jwt = sessionStorage.token;
          methods.saveCourse();
        }
      } else {
        settings.jwt = sessionStorage.token;
      }
      isRunning = false;
      isAdding = false;
      window.Components.reloadList();
    },
    checkVersion() {
      request
        .get("https://api.seutools.com/enroll/", {
          transformRequest: [
            (data, headers) => {
              delete headers.Authorization;
              delete headers.batchId;
              return data;
            },
          ],
        })
        .then((res) => {
          if (res.data.version.split(".").map((x) => parseInt(x)) > version) {
            document.getElementById("update-tip").style.display = "block";
          }
        });
    },
    //保存数据
    saveCourse() {
      localStorage.setItem("huhu", JSON.stringify({ enrollDict, settings }));
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
    // 处理输入框事件
    enter(e) {
      let evt = window.event || e;
      if (evt.keyCode === 13) {
        let node = document.getElementById("input-box");
        let codeArray = node.value.toUpperCase().split(" ");
        let failedCodes = methods.addEnrollDict(codeArray.join(" "));
        node.value = failedCodes.join(" "); // 将失败的课程代码替换到输入框中
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
        if (!courseFlag) {
          tip({
            type: "error",
            message: "没有查找到课程，请检查课程代码",
            duration: 1000,
          });
          console.log("无效的课程代码: ", courseCode);
          failedCodes.push(code); // 添加到失败的课程代码列表
        } else if (!teacherFlag) {
          tip({
            type: "error",
            message: "没有查找到该教师，请检查教师号",
            duration: 1000,
          });
          console.log("无效的教师号: ", teacherCode);
          failedCodes.push(code); // 添加到失败的课程代码列表
        } else {
          tip({
            type: "success",
            message: "添加成功",
            duration: 1000,
          });
          window.Components.reloadList();
        }
      }
      methods.saveCourse();
      return failedCodes; // 返回失败的课程代码
    },
    // 开始添加课程
    startAdding() {
      let node = document.getElementById("input-box");
      let codeArray = node.value.toUpperCase().split(" ");
      if (!codeArray.length) {
        tip({
          type: "warning",
          message: "输入框为空，请输入课程代码",
          duration: 1000,
        });
        return;
      }

      isAdding = true;
      let currentPageIndex = 0;
      let currentTabIndex = 0;

      // 监听页面变化
      const observer = new MutationObserver(() => {
        const activePage = document.querySelector(".number.active");
        if (!activePage.classList.contains("disabled")) {
          stopPageObserver();
          let inputNode = document.getElementById("input-box");
          let codeArray = inputNode.value.toUpperCase().split(" ");
          methods.addEnrollDict(codeArray.join(" "));
          currentPageIndex++;
          setTimeout(addCourses, 500); // 设置时间间隔
        }
      });

      // 启动课程主体的监听
      const activator = document.getElementsByClassName("course-list")[0];
      observer.observe(activator, {
        childList: true,
        subtree: true,
      });

      // 启动页的监听
      function startPageObserver() {
        const pager = document.querySelector(".el-pager");
        observer.observe(pager, {
          childList: true,
          subtree: true,
        });
      }

      // 停止页的监听
      function stopPageObserver() {
        observer.disconnect();
        observer.observe(activator, {
          childList: true,
          subtree: true,
        });
      }

      const addCourses = () => {
        if (!isAdding) return;

        if (currentTabIndex >= menu.length) {
          tip({
            type: "success",
            message: "所有课程已添加完成",
            duration: 2000,
          });
          isAdding = false;
          return;
        }

        if (currentPageIndex >= page.length) {
          currentTabIndex++;
          currentPageIndex = 0;
          if (currentTabIndex < menu.length) {
            startPageObserver();
            menu[currentTabIndex].click();
          }
          return;
        }

        let currentPage = page[currentPageIndex];
        if (!currentPage.classList.contains("disabled")) {
          currentPage.click();
        } else {
          currentPageIndex++;
          addCourses();
        }
      };

      menu[currentTabIndex].click();
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
          message: "还没有输入课程",
          duration: 1000,
        });
        return;
      }

      const interval = 375; // 设置时间间隔，单位为毫秒
      let index = 0;

      const enrollCourse = () => {
        if (index >= key_list.length) {
          return;
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
          let type = res.data.code === 100 ? "success" : "warning";
          tip({
            type,
            message: enrollDict[key].courseName + ":" + res.data.msg,
            duration: 1000,
          });
          index++;
          setTimeout(enrollCourse, interval); // 在每次请求后设置时间间隔
        });
      };

      enrollCourse(); // 开始执行抢课
    },
  };
  window.Components.mount();
  methods.init();
})();
