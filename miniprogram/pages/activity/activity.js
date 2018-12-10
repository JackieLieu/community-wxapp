const app = getApp();
let interval = null,
  interval1 = null,
  interval2 = null;

let base = wx.cloud.database(),
  yyyBase = base.collection('yiaoyiyiao'),
  cyBase = base.collection('canyu'),
  _ = base.command;


Page({

  data: {
    bar: false,
    page: 1,
    yyy: {
      state: false, // 开始状态
      end: true, // 结束状态
      look: false, // 观看模式
      count: 0, // 摇次数
      number: 0, // 倒计时
      outDate: 0,
      time: "--:--",
      list: [],
      speed: 10,
      pm: 0
    }
  },

  onLoad: function(e) {
    console.log(e)
    e.page && this.selectPage({
      target: {
        dataset: {
          i: e.page
        }
      }
    });
  },

  onReady: function() {
    this.getAuthorize();
    wx.setNavigationBarTitle({
      title: '沈家本法律读书协会 [活动页]'
    });
    if (!app.globalData.user) this.setData({
      toast: {
        text: '请先点击授权!',
        icon: 'error'
      }
    });


    wx.onAccelerometerChange(shake);

    let lastTime = 0;
    let x, y, z, lastX, lastY = 0,
      lastZ = 0;
    let shakeSpeed = 10,
      self = this,
      count = 0;
    let yyy = self.data.yyy;

    //编写摇一摇方法
    function shake(acceleration) {
      if (!yyy.state || yyy.look || yyy.end) return;
      var nowTime = Date.now();
      if (nowTime - lastTime > 100) {
        var diffTime = nowTime - lastTime;
        lastTime = nowTime;
        x = acceleration.x;
        y = acceleration.y;
        z = acceleration.z;
        var speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;
        if (speed >= self.data.yyy.speed) {
          if (!self.data.bar) {
            self.setData({
              bar: true
            });
          }
          wx.vibrateLong(10);
          yyy.count++;
          self.setData({
            yyy: yyy
          });
        }
        lastX = x;
        lastY = y;
        lastZ = z;
      }
    }

    if (this.data.page == 1) {
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#FE41DB',
      });
    } else {
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#E43E40',
      });
    }

    // 活动 对象
    this.yyy = new yaoyiyao();
    // 参与活动 对象
    this.canyu = new canyu();

    /***
     * 参与活动 构建函数
     */
    function canyu() {
      let __SLEF = this;
      /**
       * 参与活动原型链
       */
      __SLEF.__proto__ = {

        constructor: canyu,

        init: function() {
          this.__proto__ = __SLEF;
        },

        data: {},

        // 保存数据的方法
        save: function(json, val) {
          let cy = self.data.cy || {};
          !val ? Object.keys(json).forEach(val => {
            this[val] = cy[val] = json[val];
          }) : this[json] = cy[json] = val;
          self.setData({
            cy: cy
          });
          return cy;
        },

        unData: function() {
          interval && clearInterval(interval);
          this.data = {
            list: [],
            click: "",
            pm: 0
          };
        },

        play: function() {
          let _this = this;
          if (!app.globalData.user) return _this.error = '请先点击授权';

          // 如果是已参赛者 则 显示列表 否则 参赛
          cyBase.where({
            _openid: app.globalData.user.openId
          }).get({
            success: res => {
              _this.unData();
              if (res.data.length) {
                _this.save('click', res.data[0].time);

                // 参赛列表
                interval = setInterval(() => {
                  cyBase.get({
                    success: res => {
                      _this.save('list', res.data);

                      if (!res.data.length && self.data.yyy.list.length) {
                        self.setData({
                          toast: {
                            text: "管理员已将活动重置,数据已刷新!",
                            icon: "loading",
                            hideTime: 4000
                          }
                        });
                        this.unData();
                      }
                      _this.save('list', res.data);
                    }
                  })
                }, 1000);

                // 排名
                res.data[0].time && yyyBase.where({
                  count: _.gt(res.data[0].count)
                }).count({
                  success: res => {
                    _this.save('pm', res.total + 1);
                    self.setData({
                      toast: {
                        text: "您当前排名：" + (res.total + 1) + ' , 排名仅供参考具体以列表为准!',
                        icon: "success",
                        hideTime: 5000
                      }
                    });
                  }
                });

                return;
              }

              !_this.error && wx.cloud.database().collection('activity').where({
                name: 'admin'
              }).get({
                success: data => {
                  if (data = data.data[0]) {
                    if (data.cy_state) {
                      // 重置数据
                      _this.unData();

                      // 记录ID 第一次
                      cyBase.add({
                        data: {
                          time: new Date().Format("hh:mm:ss"),
                          user: app.globalData.user
                        },
                        success: res => {
                          _this._ID = res._id;
                          console.log(res)
                        }
                      });

                    } else _this.error = '活动暂未开启!';
                  }
                }
              });
            }
          });

        }

      }

      // 监听错误
      Object.defineProperty(__SLEF, 'error', {
        set: function(text) {
          text && self.setData({
            toast: {
              text,
              icon: 'error',
              hideTime: 4000
            }
          });
        }
      });
      return new this.__proto__.init;

    }

    /***
     * 摇一摇构建函数
     */
    function yaoyiyao() {
      let __SLEF = this;

      /**
       * 摇一摇原型链
       */
      __SLEF.__proto__ = {

        constructor: yaoyiyao,

        interval: [],

        // 保存数据的方法
        save: function(json, val) {
          let yyy = self.data.yyy || {};
          !val ? Object.keys(json).forEach(val => {
            this[val] = yyy[val] = json[val];
          }) : this[json] = yyy[json] = val;
          self.setData({
            yyy: yyy
          });
          return yyy;
        },

        // 初始化数据
        unData: function() {
          this.save({
            state: false, // 开始状态
            end: true, // 结束状态
            look: false, // 观看模式
            count: 0, // 摇次数
            number: 0, // 倒计时
            outDate: 0, // 结束时间
            time: "--:--", // 倒计时(渲染)
            list: [], // 参赛列表
            _ID: "", // 参赛者ID
            error: "", // 错误信息
          });
          // 清空计时器
          this.interval.map(val => {
            clearInterval(val);
          });
        },

        // 初始化方法
        init: function() {

          // 强行继承
          this.__proto__ = __SLEF;
        },

        // 开始摇
        play: function() {
          let _this = this;

          if (!app.globalData.user) return _this.error = '请先点击授权';

          if (self.data.yyy.state && self.data.yyy.count) return _this.error = '正在进行活动!请稍后再试...';

          // 如果是已参赛者 则 显示列表 否则 参赛
          yyyBase.where({
            _openid: app.globalData.user.openId
          }).get({
            success: res => {
              ////////////////////////////////
              _this.unData();
              if (res.data.length) {
                _this.error = '你已经参与过本次活动了!请等待管理员重置...';
                // 刷新记录
                self.setData({
                  bar: true
                });
                _this.save({
                  state: true,
                  look: true,
                  count: res.data[0].count
                });

                res.data[0].count && yyyBase.where({
                  count: _.gt(res.data[0].count)
                }).count({
                  success: res => {
                    _this.save('pm', res.total + 1);
                    self.setData({
                      toast: {
                        text: "您当前排名：" + (res.total + 1) + ' , 排名仅供参考具体以列表为准!',
                        icon: "success",
                        hideTime: 5000
                      }
                    });
                  }
                });

                let code = () => {
                  yyyBase.orderBy('count', 'desc').where({
                    count: _.gt(1)
                  }).get({
                    success: res => {

                      // 活动重置判断
                      if (!res.data.length && self.data.yyy.list.length) {
                        self.setData({
                          toast: {
                            text: "管理员已将活动重置,数据已刷新!",
                            icon: "loading",
                            hideTime: 4000
                          }
                        });
                        this.unData();
                      }
                      _this.save('list', res.data);

                    }
                  });
                };
                code();
                _this.interval.push(setInterval(code, 2000));

                // 五分钟 每人 151 个请求
                setTimeout(() => {
                  clearInterval(interval2);
                }, 300 * 1000);
                ////////////////////////////////
              } else {
                ////////////////////////////////
                // 检测活动是否开放
                wx.cloud.database().collection('activity').where({
                  name: 'admin'
                }).get({
                  success: data => {
                    if (data = data.data[0]) {
                      if (data.yyy_state) {
                        let yyy = _this.save('number', 3),
                          old_count = 0,
                          interval,
                          interval1,
                          interval2;

                        let n = 0;

                        let jieliu = null,
                          jieliuState = true,
                          lookMs = null;

                        _this.interval.push(interval = setInterval(() => {
                          yyy.number--;
                          if (yyy.number <= 0) {
                            // 清除倒计时 并 开始
                            clearInterval(interval);
                            _this.save({
                              state: true,
                              end: false,
                              speed: data.yyy_lm,
                              outDate: Date.now() + data.yyy_time * 1000
                            })

                            // 记录ID 第一次
                            yyyBase.add({
                              data: {
                                count: 0,
                                user: app.globalData.user
                              },
                              success: res => {
                                _this._ID = res._id;
                              }
                            });

                            // 参赛者列表
                            _this.interval.push(interval2 = setInterval(() => {
                              // [节流算法]
                              let count = yyy.count;
                              if (count !== old_count) {
                                lookMs && (clearTimeout(lookMs), lookMs = null);
                              } else {
                                !lookMs && (lookMs = yyyBase.orderBy('count', 'desc').get({
                                  success: res => {
                                    // 活动重置判断
                                    if (!res.data.length && self.data.yyy.list.length) {
                                      self.setData({
                                        toast: {
                                          text: "管理员已将活动重置,数据已刷新!",
                                          icon: "loading",
                                          hideTime: 4000
                                        }
                                      });
                                      this.unData();
                                    }
                                    _this.save('list', res.data);
                                  }
                                }));
                              }

                            }, 2000));

                            // 开始后的倒计时
                            _this.interval.push(interval1 = setInterval(() => {
                              let date = (yyy.outDate - Date.now()) / 1000;

                              // 更新记录 [节流算法]
                              let count = yyy.count;
                              if (count !== old_count) {
                                old_count = count;
                                jieliuState = true;
                              } else if (jieliuState) {
                                yyyBase.doc(_this._ID).update({
                                  data: {
                                    count
                                  }
                                });
                                jieliuState = false;
                              }

                              // 倒计时结束
                              if (date < 0) {
                                // yyy.state = false;
                                yyy.end = true;
                                self.setData({
                                  bar: false,
                                  yyy: yyy
                                });
                                clearInterval(interval1);
                                yyyBase.doc(_this._ID).update({
                                  data: {
                                    count
                                  }
                                });

                                count && yyyBase.where({
                                  count
                                }).count({
                                  success: res => {
                                    _this.save('pm', res.total + 1);
                                    self.setData({
                                      toast: {
                                        text: "您当前排名：" + (res.total + 1) + ' , 排名仅供参考具体以列表为准!',
                                        icon: "success",
                                        hideTime: 5000
                                      }
                                    });
                                  }
                                });
                                // 十分钟后停止更新
                                setTimeout(() => {
                                  clearInterval(interval2);
                                }, 600 * 1000);
                                return;
                              }

                              _this.save('time',
                                ('00' + Math.floor(date / 60).toFixed(0)).slice(-2) + ':' +
                                ('00' + (date % 60).toFixed(0)).slice(-2)
                              );
                            }, 1000));


                          }
                          _this.save('number', yyy.number);
                        }, 1000));

                      } else _this.error = '活动暂未开始,请等待管理员按下开始按钮!!';
                    } else _this.error = '数据库丢失[ERROR: 001]';
                  }
                });
                ////////////////////////////////
              }
            }
          });

        }
      }

      // 监听错误
      Object.defineProperty(this, 'error', {
        set: function(text) {
          text && self.setData({
            toast: {
              text,
              icon: 'error',
              hideTime: 4000
            }
          });
        }
      });

      return new this.__proto__.init;
    }

  },

  // 获取授权
  getAuthorize: function() {
    app.Authorize.apply(this, [app, () => {
      if (app.globalData.user) {
        this.setData({
          user: app.globalData.user
        });
      }
    }]);
  },

  // 选择页
  selectPage: function(e) {
    if (this.data.bar) return;
    let val = e.target.dataset.i;
    val && this.setData({
      page: val
    });
  },

  // 摇一摇开始按钮
  startYYY: function() {
    this.yyy.play();
  },

  // 参与活动按钮
  startCY: function() {
    this.canyu.play();
  },

  swiperChang: function(e) {
    this.setData({
      page: e.detail.current
    });
    if (this.data.page == 1) {
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#FE41DB',
      });
    } else {
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#E43E40',
      });
    }
  }

});

Date.prototype.Format = function(fmt) { //author: meizz   
  var o = {
    "M+": this.getMonth() + 1, //月份   
    "d+": this.getDate(), //日   
    "h+": this.getHours(), //小时   
    "m+": this.getMinutes(), //分   
    "s+": this.getSeconds(), //秒   
    "q+": Math.floor((this.getMonth() + 3) / 3),
    "S": this.getMilliseconds() //毫秒   
  };
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt))
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
  return fmt;
}