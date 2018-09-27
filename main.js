// ==UserScript==
// @name         wsmud_tim
// @namespace    http://tampermonkey.net/
// @version      0.4
// @date         01/09/2018
// @modified     5/09/2018
// @description  武神传说 MUD (Tim Li)
// @author       tim
// @match        http://game.wsmud.com/*
// @run-at       document-start
// @require      https://cdn.bootcss.com/jquery/3.3.1/jquery.min.js
// @require      https://cdn.bootcss.com/jquery-contextmenu/3.0.0-beta.2/jquery.contextMenu.min.js
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==
// 2018年9月11日 增加反击功能和自动练功
// 2018年9月5日 武道塔增加等技能CD的功能
;(function() {
  'use strict'
  Array.prototype.baoremove = function(dx) {
    if (isNaN(dx) || dx > this.length) {
      return false
    }
    this.splice(dx, 1)
  }

  if (WebSocket) {
    console.log('插件可正常运行')
    var _ws = WebSocket,
      ws,
      ws_on_message
    unsafeWindow.WebSocket = function(uri) {
      ws = new _ws(uri)
    }
    unsafeWindow.WebSocket.prototype = {
      CONNECTING: _ws.CONNECTING,
      OPEN: _ws.OPEN,
      CLOSING: _ws.CLOSING,
      CLOSED: _ws.CLOSED,
      get url() {
        return ws.url
      },
      get protocol() {
        return ws.protocol
      },
      get readyState() {
        return ws.readyState
      },
      get bufferedAmount() {
        return ws.bufferedAmount
      },
      get extensions() {
        return ws.extensions
      },
      get binaryType() {
        return ws.binaryType
      },
      set binaryType(t) {
        ws.binaryType = t
      },
      get onopen() {
        return ws.onopen
      },
      set onopen(fn) {
        ws.onopen = fn
      },
      get onmessage() {
        return ws.onmessage
      },
      set onmessage(fn) {
        ws_on_message = fn
        ws.onmessage = WG.receive_message
      },
      get onclose() {
        return ws.onclose
      },
      set onclose(fn) {
        ws.onclose = fn
      },
      get onerror() {
        return ws.onerror
      },
      set onerror(fn) {
        ws.onerror = fn
      },
      send: function(text) {
        ws.send(text)
      },
      close: function() {
        ws.close()
      }
    }
  } else {
    console.log(
      "插件不可运行"
    )
  }
  var roomItemSelectIndex = -1
  var timer = 0
  var cnt = 0
  var zb_npc
  var zb_place
  var next = 0
  var roomData = []
  var needfind = {
    '武当派-林间小径': ['go south'],
    '峨眉派-走廊': [
      'go north',
      'go south;go south',
      'go north;go east;go east'
    ],
    '丐帮-暗道': ['go east', 'go east;go east', 'go east'],
    '逍遥派-林间小道': [
      'go west;go north',
      'go south;go south',
      'go north;go west'
    ],
    '少林派-竹林': ['go north'],
    '逍遥派-地下石室': ['go up'],
    '逍遥派-木屋': ['go south;go south;go south;go south']
  }

  var store_list = [
    "<hic>红宝石</hic>",
    "<hic>黄宝石</hic>",
    "<hic>蓝宝石</hic>",
    "<hic>绿宝石</hic>",
    "<hiy>精致的红宝石</hiy>",
    "<hiy>精致的黄宝石</hiy>",
    "<hiy>精致的蓝宝石</hiy>",
    "<hiy>精致的绿宝石</hiy>",
    "<hiz>完美的黄宝石</hiz>",
    "<hiz>完美的黄宝石</hiz>",
    "<hiz>完美的蓝宝石</hiz>",
    "<hiz>完美的绿宝石</hiz>",
    "<wht>基本内功秘籍</wht>",
    "<wht>基本轻功秘籍</wht>",
    "<wht>基本招架秘籍</wht>",
    "<wht>基本剑法秘籍</wht>",
    "<wht>基本刀法秘籍</wht>",
    "<wht>基本拳脚秘籍</wht>",
    "<wht>基本暗器秘籍</wht>",
    "<wht>基本棍法秘籍</wht>",
    "<wht>基本鞭法秘籍</wht>",
    "<wht>基本杖法秘籍</wht>",
    "<wht>动物皮毛</wht>",
    "进阶残页",
  ];

  var goods = {
    //扬州城-醉仙楼-店小二
    米饭: {
      id: null,
      sales: '店小二',
      place: '扬州城-醉仙楼'
    },
    包子: {
      id: null,
      sales: '店小二',
      place: '扬州城-醉仙楼'
    },
    鸡腿: {
      id: null,
      sales: '店小二',
      place: '扬州城-醉仙楼'
    },
    面条: {
      id: null,
      sales: '店小二',
      place: '扬州城-醉仙楼'
    },
    扬州炒饭: {
      id: null,
      sales: '店小二',
      place: '扬州城-醉仙楼'
    },
    米酒: {
      id: null,
      sales: '店小二',
      place: '扬州城-醉仙楼'
    },
    花雕酒: {
      id: null,
      sales: '店小二',
      place: '扬州城-醉仙楼'
    },
    女儿红: {
      id: null,
      sales: '店小二',
      place: '扬州城-醉仙楼'
    },
    醉仙酿: {
      id: null,
      sales: '店小二',
      place: '扬州城-醉仙楼'
    },
    神仙醉: {
      id: null,
      sales: '店小二',
      place: '扬州城-醉仙楼'
    },
    //扬州城-杂货铺
    布衣: {
      id: null,
      sales: '杂货铺老板 杨永福',
      place: '扬州城-杂货铺'
    },
    钢刀: {
      id: null,
      sales: '杂货铺老板 杨永福',
      place: '扬州城-杂货铺'
    },
    木棍: {
      id: null,
      sales: '杂货铺老板 杨永福',
      place: '扬州城-杂货铺'
    },
    英雄巾: {
      id: null,
      sales: '杂货铺老板 杨永福',
      place: '扬州城-杂货铺'
    },
    布鞋: {
      id: null,
      sales: '杂货铺老板 杨永福',
      place: '扬州城-杂货铺'
    },
    铁戒指: {
      id: null,
      sales: '杂货铺老板 杨永福',
      place: '扬州城-杂货铺'
    },
    簪子: {
      id: null,
      sales: '杂货铺老板 杨永福',
      place: '扬州城-杂货铺'
    },
    长鞭: {
      id: null,
      sales: '杂货铺老板 杨永福',
      place: '扬州城-杂货铺'
    },
    钓鱼竿: {
      id: null,
      sales: '杂货铺老板 杨永福',
      place: '扬州城-杂货铺'
    },
    鱼饵: {
      id: null,
      sales: '杂货铺老板 杨永福',
      place: '扬州城-杂货铺'
    },

    //扬州城-打铁铺
    铁剑: {
      id: null,
      sales: '铁匠铺老板 铁匠',
      place: '扬州城-打铁铺'
    },
    钢刀: {
      id: null,
      sales: '铁匠铺老板 铁匠',
      place: '扬州城-打铁铺'
    },
    铁棍: {
      id: null,
      sales: '铁匠铺老板 铁匠',
      place: '扬州城-打铁铺'
    },
    铁杖: {
      id: null,
      sales: '铁匠铺老板 铁匠',
      place: '扬州城-打铁铺'
    },
    铁镐: {
      id: null,
      sales: '铁匠铺老板 铁匠',
      place: '扬州城-打铁铺'
    },

    //扬州城-药铺
    金创药: {
      id: null,
      sales: '药铺老板 平一指',
      place: '扬州城-药铺'
    },
    引气丹: {
      id: null,
      sales: '药铺老板 平一指',
      place: '扬州城-药铺'
    },
    养精丹: {
      id: null,
      sales: '药铺老板 平一指',
      place: '扬州城-药铺'
    }
  }
  var equip = {
    铁镐: 0
  }
  var npcs = {
    店小二: 0
  }
  var place = {
    住房: 'jh fam 0 start;go west;go west;go north;go enter',
    '豪宅-练功房': 'jh fam 0 start;go west;go west;go north;go enter;go west',
    仓库: 'jh fam 0 start;go north;go west;store',
    '扬州城-醉仙楼': 'jh fam 0 start;go north;go north;go east',
    '扬州城-杂货铺': 'jh fam 0 start;go east;go south',
    '扬州城-打铁铺': 'jh fam 0 start;go east;go east;go south',
    '扬州城-药铺': 'jh fam 0 start;go east;go east;go north',
    '扬州城-衙门正厅': 'jh fam 0 start;go west;go north;go north',
    '扬州城-矿山': 'jh fam 0 start;go west;go west;go west;go west',
    '扬州城-喜宴': 'jh fam 0 start;go north;go north;go east;go up',
    '扬州城-擂台': 'jh fam 0 start;go west;go south',
    '扬州城-当铺': 'jh fam 0 start;go south;go east',
    '扬州城-帮派': 'jh fam 0 start;go south;go south;go east',
    '武当派-广场': 'jh fam 1 start;',
    '武当派-三清殿': 'jh fam 1 start;go north',
    '武当派-石阶': 'jh fam 1 start;go west',
    '武当派-练功房': 'jh fam 1 start;go west;go west',
    '武当派-太子岩': 'jh fam 1 start;go west;go northup',
    '武当派-桃园小路': 'jh fam 1 start;go west;go northup;go north',
    '武当派-舍身崖': 'jh fam 1 start;go west;go northup;go north;go east',
    '武当派-南岩峰': 'jh fam 1 start;go west;go northup;go north;go west',
    '武当派-乌鸦岭':
      'jh fam 1 start;go west;go northup;go north;go west;go northup',
    '武当派-五老峰':
      'jh fam 1 start;go west;go northup;go north;go west;go northup;go northup',
    '武当派-虎头岩':
      'jh fam 1 start;go west;go northup;go north;go west;go northup;go northup;go northup',
    '武当派-朝天宫':
      'jh fam 1 start;go west;go northup;go north;go west;go northup;go northup;go northup;go north',
    '武当派-三天门':
      'jh fam 1 start;go west;go northup;go north;go west;go northup;go northup;go northup;go north;go north',
    '武当派-紫金城':
      'jh fam 1 start;go west;go northup;go north;go west;go northup;go northup;go northup;go north;go north;go north',
    '武当派-林间小径':
      'jh fam 1 start;go west;go northup;go north;go west;go northup;go northup;go northup;go north;go north;go north;go north;go north',
    '武当派-后山小院':
      'jh fam 1 start;go west;go northup;go north;go west;go northup;go northup;go northup;go north;go north;go north;go north;go north;go north',
    '少林派-广场': 'jh fam 2 start;',
    '少林派-山门殿': 'jh fam 2 start;go north',
    '少林派-东侧殿': 'jh fam 2 start;go north;go east',
    '少林派-西侧殿': 'jh fam 2 start;go north;go west',
    '少林派-天王殿': 'jh fam 2 start;go north;go north',
    '少林派-大雄宝殿': 'jh fam 2 start;go north;go north;go northup',
    '少林派-钟楼': 'jh fam 2 start;go north;go north;go northeast',
    '少林派-鼓楼': 'jh fam 2 start;go north;go north;go northwest',
    '少林派-后殿': 'jh fam 2 start;go north;go north;go northwest;go northeast',
    '少林派-练武场':
      'jh fam 2 start;go north;go north;go northwest;go northeast;go north',
    '少林派-罗汉堂':
      'jh fam 2 start;go north;go north;go northwest;go northeast;go north;go east',
    '少林派-般若堂':
      'jh fam 2 start;go north;go north;go northwest;go northeast;go north;go west',
    '少林派-方丈楼':
      'jh fam 2 start;go north;go north;go northwest;go northeast;go north;go north',
    '少林派-戒律院':
      'jh fam 2 start;go north;go north;go northwest;go northeast;go north;go north;go east',
    '少林派-达摩院':
      'jh fam 2 start;go north;go north;go northwest;go northeast;go north;go north;go west',
    '少林派-竹林':
      'jh fam 2 start;go north;go north;go northwest;go northeast;go north;go north;go north;go north',
    '少林派-藏经阁':
      'jh fam 2 start;go north;go north;go northwest;go northeast;go north;go north;go north;go west',
    '少林派-达摩洞':
      'jh fam 2 start;go north;go north;go northwest;go northeast;go north;go north;go north;go north;go north',
    '华山派-镇岳宫': 'jh fam 3 start;',
    '华山派-苍龙岭': 'jh fam 3 start;go eastup',
    '华山派-舍身崖': 'jh fam 3 start;go eastup;go southup',
    '华山派-峭壁': 'jh fam 3 start;go eastup;go southup;jumpdown',
    '华山派-山谷': 'jh fam 3 start;go eastup;go southup;jumpdown;go southup',
    '华山派-山间平地':
      'jh fam 3 start;go eastup;go southup;jumpdown;go southup;go south',
    '华山派-林间小屋':
      'jh fam 3 start;go eastup;go southup;jumpdown;go southup;go south;go east',
    '华山派-玉女峰': 'jh fam 3 start;go westup',
    '华山派-玉女祠': 'jh fam 3 start;go westup;go west',
    '华山派-练武场': 'jh fam 3 start;go westup;go north',
    '华山派-练功房': 'jh fam 3 start;go westup;go north;go east',
    '华山派-客厅': 'jh fam 3 start;go westup;go north;go north',
    '华山派-偏厅': 'jh fam 3 start;go westup;go north;go north;go east',
    '华山派-寝室': 'jh fam 3 start;go westup;go north;go north;go north',
    '华山派-玉女峰山路': 'jh fam 3 start;go westup;go south',
    '华山派-玉女峰小径': 'jh fam 3 start;go westup;go south;go southup',
    '华山派-思过崖': 'jh fam 3 start;go westup;go south;go southup;go southup',
    '华山派-山洞':
      'jh fam 3 start;go westup;go south;go southup;go southup;break bi;go enter',
    '华山派-长空栈道':
      'jh fam 3 start;go westup;go south;go southup;go southup;break bi;go enter;go westup',
    '华山派-落雁峰':
      'jh fam 3 start;go westup;go south;go southup;go southup;break bi;go enter;go westup;go westup',
    '峨眉派-金顶': 'jh fam 4 start',
    '峨眉派-庙门': 'jh fam 4 start;go west',
    '峨眉派-广场': 'jh fam 4 start;go west;go south',
    '峨眉派-走廊': 'jh fam 4 start;go west;go south;go west',
    '峨眉派-休息室': 'jh fam 4 start;go west;go south;go east;go south',
    '峨眉派-厨房': 'jh fam 4 start;go west;go south;go east;go east',
    '峨眉派-练功房': 'jh fam 4 start;go west;go south;go west;go west',
    '峨眉派-小屋': 'jh fam 4 start;go west;go south;go west;go north;go north',
    '峨眉派-清修洞':
      'jh fam 4 start;go west;go south;go west;go south;go south',
    '峨眉派-大殿': 'jh fam 4 start;go west;go south;go south',
    '峨眉派-睹光台': 'jh fam 4 start;go northup',
    '峨眉派-华藏庵': 'jh fam 4 start;go northup;go east',
    '逍遥派-青草坪': 'jh fam 5 start',
    '逍遥派-林间小道': 'jh fam 5 start;go east',
    '逍遥派-练功房': 'jh fam 5 start;go east;go north',
    '逍遥派-木板路': 'jh fam 5 start;go east;go south',
    '逍遥派-工匠屋': 'jh fam 5 start;go east;go south;go south',
    '逍遥派-休息室': 'jh fam 5 start;go west;go south',
    '逍遥派-木屋': 'jh fam 5 start;go north;go north',
    '逍遥派-地下石室': 'jh fam 5 start;go down;go down',
    '丐帮-树洞内部': 'jh fam 6 start',
    '丐帮-树洞下': 'jh fam 6 start;go down',
    '丐帮-暗道': 'jh fam 6 start;go down;go east',
    '丐帮-破庙密室': 'jh fam 6 start;go down;go east;go east;go east',
    '丐帮-土地庙': 'jh fam 6 start;go down;go east;go east;go east;go up',
    '丐帮-林间小屋':
      'jh fam 6 start;go down;go east;go east;go east;go east;go east;go up',
    '襄阳城-广场': 'jh fam 7 start',
    武道塔: 'jh fam 8 start'
  }

  var drop_list = [];
  var fenjie_list = [];
  
  var role
  var family = null
  var wudao_pfm = '1'
  var ks_pfm = '2000'
  var automarry = null
  var autoKsBoss = null
  var autoIdle = 1
  var lianxiId = ''
  var showHP = null
  var eqlist = {
    1: [],
    2: [],
    3: []
  }
  var autoeq = 999
  //快捷键功能
  var KEY = {
    keys: [],
    roomItemSelectIndex: -1,
    init: function() {
      //添加快捷键说明
      $('span[command=stopstate] span:eq(0)').html('S')
      $('span[command=showcombat] span:eq(0)').html('A')
      $('span[command=showtool] span:eq(0)').html('C')
      $('span[command=pack] span:eq(0)').html('B')
      $('span[command=tasks] span:eq(0)').html('L')
      $('span[command=score] span:eq(0)').html('O')
      $('span[command=jh] span:eq(0)').html('J')
      $('span[command=skills] span:eq(0)').html('K')
      $('span[command=message] span:eq(0)').html('U')
      $('span[command=shop] span:eq(0)').html('P')
      $('span[command=stats] span:eq(0)').html('I')
      $('span[command=setting] span:eq(0)').html(',')

      $(document).on('keydown', this.e)

      this.add(27, function() {
        KEY.dialog_close()
      })
      this.add(192, function() {
        $('.map-icon').click()
      })
      this.add(32, function() {
        KEY.dialog_confirm()
      })
      this.add(83, function() {
        KEY.do_command('stopstate')
      })
      this.add(13, function() {
        KEY.do_command('showchat')
      })
      this.add(65, function() {
        KEY.do_command('showcombat')
      })
      this.add(67, function() {
        KEY.do_command('showtool')
      })
      this.add(66, function() {
        KEY.do_command('pack')
      })
      this.add(76, function() {
        KEY.do_command('tasks')
      })
      this.add(79, function() {
        KEY.do_command('score')
      })
      this.add(74, function() {
        KEY.do_command('jh')
      })
      this.add(75, function() {
        KEY.do_command('skills')
      })
      this.add(73, function() {
        KEY.do_command('stats')
      })
      this.add(85, function() {
        KEY.do_command('message')
      })
      this.add(80, function() {
        KEY.do_command('shop')
      })
      this.add(188, function() {
        KEY.do_command('setting')
      })

      this.add(81, function() {
        WG.sm_button()
      })
      this.add(87, function() {
        WG.go_yamen_task()
      })
      this.add(69, function() {
        WG.kill_all()
      })
      this.add(82, function() {
        WG.get_all()
      })
      this.add(84, function() {
        WG.sell_all()
      })
      this.add(89, function() {
        WG.zdwk()
      })

      this.add(9, function() {
        KEY.onRoomItemSelect()
        return false
      })

      //方向
      this.add(102, function() {
        WG.Send('go east')
        KEY.onChangeRoom()
      })
      this.add(39, function() {
        WG.Send('go east')
        KEY.onChangeRoom()
      })
      this.add(100, function() {
        WG.Send('go west')
        KEY.onChangeRoom()
      })
      this.add(37, function() {
        WG.Send('go west')
        KEY.onChangeRoom()
      })
      this.add(98, function() {
        WG.Send('go south')
        KEY.onChangeRoom()
      })
      this.add(40, function() {
        WG.Send('go south')
        KEY.onChangeRoom()
      })
      this.add(104, function() {
        WG.Send('go go north')
        KEY.onChangeRoom()
      })
      this.add(38, function() {
        WG.Send('go north')
        KEY.onChangeRoom()
      })
      this.add(99, function() {
        WG.Send('go southeast')
        KEY.onChangeRoom()
      })
      this.add(97, function() {
        WG.Send('go southwest')
        KEY.onChangeRoom()
      })
      this.add(105, function() {
        WG.Send('go northeast')
        KEY.onChangeRoom()
      })
      this.add(103, function() {
        WG.Send('go northwest')
        KEY.onChangeRoom()
      })

      this.add(49, function() {
        KEY.combat_commands(0)
      })
      this.add(50, function() {
        KEY.combat_commands(1)
      })
      this.add(51, function() {
        KEY.combat_commands(2)
      })
      this.add(52, function() {
        KEY.combat_commands(3)
      })
      this.add(53, function() {
        KEY.combat_commands(4)
      })
      this.add(54, function() {
        KEY.combat_commands(5)
      })

      //alt
      this.add(49 + 512, function() {
        KEY.onRoomItemAction(0)
      })
      this.add(50 + 512, function() {
        KEY.onRoomItemAction(1)
      })
      this.add(51 + 512, function() {
        KEY.onRoomItemAction(2)
      })
      this.add(52 + 512, function() {
        KEY.onRoomItemAction(3)
      })
      this.add(53 + 512, function() {
        KEY.onRoomItemAction(4)
      })
      this.add(54 + 512, function() {
        KEY.onRoomItemAction(5)
      })
      //ctrl
      this.add(49 + 1024, function() {
        KEY.room_commands(0)
      })
      this.add(50 + 1024, function() {
        KEY.room_commands(1)
      })
      this.add(51 + 1024, function() {
        KEY.room_commands(2)
      })
      this.add(52 + 1024, function() {
        KEY.room_commands(3)
      })
      this.add(53 + 1024, function() {
        KEY.room_commands(4)
      })
      this.add(54 + 1024, function() {
        KEY.room_commands(5)
      })
    },
    add: function(k, c) {
      var tmp = {
        key: k,
        callback: c
      }
      this.keys.push(tmp)
    },
    e: function(event) {
      if ($('.channel-box').is(':visible')) {
        KEY.chatModeKeyEvent(event)
        return
      }

      if (
        $('.dialog-confirm').is(':visible') &&
        ((event.keyCode >= 48 && event.keyCode <= 57) ||
          (event.keyCode >= 96 && event.keyCode <= 105))
      )
        return

      var kk =
        (event.ctrlKey || event.metaKey ? 1024 : 0) +
        (event.altKey ? 512 : 0) +
        event.keyCode
      for (var k of KEY.keys) {
        if (k.key == kk) return k.callback()
      }
    },
    dialog_close: function() {
      $('.dialog-close').click()
    },
    dialog_confirm: function() {
      $('.dialog-btn.btn-ok').click()
    },
    do_command: function(name) {
      $('span[command=' + name + ']').click()
    },
    room_commands: function(index) {
      $('div.combat-panel div.room-commands span:eq(' + index + ')').click()
    },
    combat_commands: function(index) {
      $(
        'div.combat-panel div.combat-commands span.pfm-item:eq(' + index + ')'
      ).click()
    },
    chatModeKeyEvent: function(event) {
      if (event.keyCode == 27) {
        KEY.dialog_close()
      } else if (event.keyCode == 13) {
        if ($('.sender-box').val().length) $('.sender-btn').click()
        else KEY.dialog_close()
      }
    },
    onChangeRoom: function() {
      KEY.roomItemSelectIndex = -1
    },
    onRoomItemSelect: function() {
      if (KEY.roomItemSelectIndex != -1) {
        $('.room_items div.room-item:eq(' + KEY.roomItemSelectIndex + ')').css(
          'background',
          '#000'
        )
      }
      KEY.roomItemSelectIndex =
        (KEY.roomItemSelectIndex + 1) % $('.room_items div.room-item').length
      var curItem = $(
        '.room_items div.room-item:eq(' + KEY.roomItemSelectIndex + ')'
      )
      curItem.css('background', '#444')
      curItem.click()
    },
    onRoomItemAction: function(index) {
      //NPC下方按键
      $('.room_items .item-commands span:eq(' + index + ')').click()
    }
  }

  function messageClear() {
    $('.WG_log pre').html('')
  }
  var log_line = 0

  function messageAppend(m, t = 0) {
    100 < log_line && ((log_line = 0), $('.WG_log pre').empty())
    var ap = m + '\n'
    if (t == 1) {
      ap = '<hiy>' + ap + '</hiy>'
    }
    if (t == 2) {
      ap = '<hig>' + ap + '</hig>'
    }
    if (t == 3) {
      ap = '<hiw>' + ap + '</hiw>'
    }
    $('.WG_log pre').append(ap)
    log_line++
    $('.WG_log')[0].scrollTop = 99999
  }
  var sm_array = {
    武当: {
      place: '武当派-三清殿',
      npc: '武当派第二代弟子 武当首侠 宋远桥'
    },
    华山: {
      place: '华山派-客厅',
      npc: '华山派掌门 君子剑 岳不群'
    },
    少林: {
      place: '少林派-天王殿',
      npc: '少林寺第三十九代弟子 道觉禅师'
    },
    逍遥: {
      place: '逍遥派-青草坪',
      npc: '聪辩老人 苏星河'
    },
    丐帮: {
      place: '丐帮-树洞下',
      npc: '丐帮七袋弟子 左全'
    },
    峨眉: {
      place: '峨眉派-大殿',
      npc: '峨嵋派第四代弟子 静心'
    }
  }
  var WG = {
    sm_state: -1,
    sm_item: null,
    fj_state: -1,
    is_combat: false,
    init: function() {
      $('li[command=SelectRole]').on('click', function() {
        WG.login()
      })
    },
    inArray: function (val, arr) {
      for (let i = 0; i < arr.length; i++) {
        let item = arr[i];
        if (item[0] == "<") {
          if (item == val) return true;

        }
        else {
          if (val.indexOf(item) >= 0) return true;
        }
      }
      return false;
    },
    login: function() {
      role = $('.role-list .select')
        .text()
        .split(/[\s\n]/)
        .pop()
      $('.bottom-bar').append(
        "<span class='item-commands' style='display:none'><span WG='WG' cmd=''></span></span>"
      ) //命令行模块
      var html = `
        <div class='WG_log'><pre></pre></div>
        <div>
        <span class='zdy-item sm_button'>师门(Q)</span>
        <span class='zdy-item go_yamen_task'>追捕(W)</span>
        <span class='zdy-item kill_all'>击杀(E))</span>
        <span class='zdy-item get_all'>拾取(R)</span>
        <span class='zdy-item sell_all'>清包(T)</span>
        <span class='zdy-item zdwk'>挖矿(Y)</span>
        <span class='zdy-item auto_fj'>反击</span>
        <span class='zdy-item go_liangong'>练功</span>
        </div>
        `
      $('.content-message').after(html)
      var css = `.zdy-item{
        display: inline-block;border: solid 1px gray;color: gray;background-color: black;
        text-align: center;cursor: pointer;border-radius: 0.25em;min-width: 2.5em;margin-right: 0.4em;
        margin-left: 0.4em;position: relative;padding-left: 0.4em;padding-right: 0.4em;line-height: 2em;}
        .WG_log{flex: 1;overflow-y: auto;border: 1px solid #404000;max-height: 15em;width: calc(100% - 40px);}
        .WG_log > pre{margin: 0px; white-space: pre-line;}
        `
      GM_addStyle(css)
      goods = GM_getValue('goods', goods)
      npcs = GM_getValue('npcs', npcs)
      equip = GM_getValue(role + '_equip', equip)
      family = GM_getValue(role + '_family', family)
      automarry = GM_getValue(role + '_automarry', automarry)
      autoKsBoss = GM_getValue(role + '_autoKsBoss', autoKsBoss)
      autoIdle = GM_getValue(role + '_autoIdle', autoIdle)
      lianxiId = GM_getValue(role + '_lianxiId', lianxiId)
      showHP = GM_getValue(role + '_showHP', showHP)
      ks_pfm = GM_getValue(role + '_ks_pfm', ks_pfm)
      eqlist = GM_getValue(role + '_eqlist', eqlist)
      autoeq = GM_getValue(role + '_auto_eq', autoeq)
      if (family == null) {
        family = $('.role-list .select')
          .text()
          .substr(0, 2)
      }
      wudao_pfm = GM_getValue(role + '_wudao_pfm', wudao_pfm)
      $('.go_liangong').on('click', WG.go_liangong)
      $('.auto_fj').on('click', WG.auto_fj)
      $('.sm_button').on('click', WG.sm_button)
      $('.go_yamen_task').on('click', WG.go_yamen_task)
      $('.kill_all').on('click', WG.kill_all)
      $('.get_all').on('click', WG.get_all)
      $('.sell_all').on('click', WG.sell_all)
      $('.zdwk').on('click', WG.zdwk)
      setTimeout(() => {
        var logintext = ''
        if (WebSocket) {
          if (npcs['店小二'] == 0) {
            logintext = `
              <hiy>欢迎${role},插件已加载！第一次使用,请在设置中,初始化ID,并且设置一下是否自动婚宴,自动传送boss
              插件版本: ${GM_info.script.version}
              </hiy>`
          } else {
            logintext = `
                      <hiy>欢迎${role},插件已加载！
                      插件版本: ${GM_info.script.version}
                      </hiy>`
          }
        } else {
          logintext = `
            <hiy>欢迎${role},插件已加载！第一次使用,请在设置中,初始化ID,当前浏览器不支持自动喜宴自动boss,请使用火狐浏览器
            插件版本: ${GM_info.script.version}
            </hiy>`
        }
        messageAppend(logintext)
        KEY.do_command('showtool')
        KEY.do_command('pack')
        KEY.do_command('pack')
        KEY.do_command('showcombat')
      }, 1000)
    },
    updete_goods_id: function() {
      var lists = $('.dialog-list > .obj-list:first')
      var id
      var name
      if (lists.length) {
        messageAppend('检测到商品清单')
        for (var a of lists.children()) {
          a = $(a)
          id = a.attr('obj')
          name = $(a.children()[0]).html()
          goods[name].id = id
          messageAppend(name + ':' + id)
        }
        GM_setValue('goods', goods)
        return true
      } else {
        messageAppend('未检测到商品清单')
        return false
      }
    },
    updete_npc_id: function() {
      var lists = $('.room_items .room-item')

      for (var npc of lists) {
        if (npc.lastElementChild.lastElementChild == null) {
          npcs[npc.lastElementChild.innerText] = $(npc).attr('itemid')
          messageAppend(
            npc.lastElementChild.innerText + ' 的ID:' + $(npc).attr('itemid')
          )
        }
      }
      GM_setValue('npcs', npcs)
    },
    updete_id_all: function() {
      var t = []
      Object.keys(goods).forEach(function(key) {
        if (t[goods[key].place] == undefined)
          t[goods[key].place] = goods[key].sales
      })

      var keys = Object.keys(t)
      var i = 0
      var state = 0
      var place, sales
      //获取
      var timer = setInterval(() => {
        switch (state) {
          case 0:
            if (i >= keys.length) {
              messageAppend('初始化完成')
              WG.go('武当派-广场')
              clearInterval(timer)
              return
            }
            place = keys[i]
            sales = t[place]
            WG.go(place)
            state = 1
            break
          case 1:
            WG.updete_npc_id()
            var id = npcs[sales]
            WG.Send('list ' + id)
            state = 2
            break
          case 2:
            if (WG.updete_goods_id()) {
              state = 0
              i++
            } else state = 1
            break
        }
      }, 1000)
    },
    Send: function(cmd) {
      if (cmd) {
        cmd = cmd instanceof Array ? cmd : cmd.split(';');
        for (var c of cmd) {
          $("span[WG='WG']")
            .attr('cmd', c)
            .click()
        }
      }
    },
    go: function(p) {
      if (needfind[p] == undefined) {
        if (WG.at(p)) {
          return
        }
      }
      if (place[p] != undefined) {
        WG.Send(place[p])
      }
    },
    at: function(p) {
      var w = $('.room-name').html()
      return w.indexOf(p) == -1 ? false : true
    },
    sm: function() {
      switch (WG.sm_state) {
        case 0:
          //前往师门接收任务
          WG.go(sm_array[family].place)
          WG.sm_state = 1
          setTimeout(WG.sm, 700)
          break
        case 1:
          //接受任务
          var lists = $('.room_items .room-item')
          var id = null
          for (var npc of lists) {
            if (npc.lastElementChild.lastElementChild == null) {
              if (npc.lastElementChild.innerText == sm_array[family].npc)
                id = $(npc).attr('itemid')
            }
          }
          // console.log(id)
          if (id != undefined) {
            WG.Send('task sm ' + id)
            WG.Send('task sm ' + id)
            WG.sm_state = 2
          } else {
            WG.updete_npc_id()
          }
          setTimeout(WG.sm, 300)
          break
        case 2:
          //获取师门任务物品
          var item = $("span[cmd$='giveup']:last")
            .parent()
            .prev()
          if (item.length == 0) {
            WG.sm_state = 0
            setTimeout(WG.sm, 1000)
            return
          }
          item = item.html()
          //(逗比写法)
          //能上交直接上交
          if (
            $("span[cmd$='giveup']:last")
              .prev()
              .children()
              .html() == item
          ) {
            $("span[cmd$='giveup']:last")
              .prev()
              .click()
            messageAppend('自动上交' + item)
            WG.sm_state = 0
            setTimeout(WG.sm, 100)
            return
          }
          if (
            $("span[cmd$='giveup']:last")
              .prev()
              .prev()
              .children()
              .html() == item
          ) {
            $("span[cmd$='giveup']:last")
              .prev()
              .prev()
              .click()
            messageAppend('自动上交' + item)
            WG.sm_state = 0
            setTimeout(WG.sm, 100)
            return
          }
          if (
            $("span[cmd$='giveup']:last")
              .prev()
              .prev()
              .prev()
              .children()
              .html() == item
          ) {
            $("span[cmd$='giveup']:last")
              .prev()
              .prev()
              .prev()
              .click()
            messageAppend('自动上交' + item)
            WG.sm_state = 0
            setTimeout(WG.sm, 100)
            return
          }
          if (
            $("span[cmd$='giveup']:last")
              .prev()
              .prev()
              .prev()
              .prev()
              .children()
              .html() == item
          ) {
            $("span[cmd$='giveup']:last")
              .prev()
              .prev()
              .prev()
              .prev()
              .click()
            messageAppend('自动上交' + item)
            WG.sm_state = 0
            setTimeout(WG.sm, 100)
            return
          }
          if (
            $("span[cmd$='giveup']:last")
              .prev()
              .prev()
              .prev()
              .prev()
              .prev()
              .children()
              .html() == item
          ) {
            $("span[cmd$='giveup']:last")
              .prev()
              .prev()
              .prev()
              .prev()
              .prev()
              .click()
            messageAppend('自动上交' + item)
            WG.sm_state = 0
            setTimeout(WG.sm, 100)
            return
          }
          if (
            $("span[cmd$='giveup']:last")
              .prev()
              .prev()
              .prev()
              .prev()
              .prev()
              .prev()
              .children()
              .html() == item
          ) {
            $("span[cmd$='giveup']:last")
              .prev()
              .prev()
              .prev()
              .prev()
              .prev()
              .prev()
              .click()
            messageAppend('自动上交' + item)
            WG.sm_state = 0
            setTimeout(WG.sm, 100)
            return
          }
          //不能上交自动购买
          WG.sm_item = goods[item]
          if (WG.sm_item != undefined) {
            WG.go(WG.sm_item.place)
            messageAppend('自动购买' + item)
            WG.sm_state = 3
            setTimeout(WG.sm, 1000)
          } else {
            messageAppend('无法购买' + item)
            WG.sm_state = -1
            $('.sm_button').text('师门(Q)')
          }
          break
        case 3:
          WG.go(WG.sm_item.place)
          if (WG.buy(WG.sm_item)) {
            WG.sm_state = 0
          }
          setTimeout(WG.sm, 1000)
          break
        default:
          break
      }
    },
    go_liangong: function () {
      messageAppend('当前不在练功状态')
      WG.Send('stopstate')
      WG.go('豪宅-练功房')

      Helper.eqhelper(2)

      WG.Send('lianxi ' + lianxiId)
      messageAppend('开始练习' + lianxiId)
      WG.timer_close()
      return
    },
    auto_fj: function () {
      if (WG.fj_state >= 0) {
        WG.fj_state = -1
        WG.timer_close()
        $('.auto_fj').text('反击')
        console.log("停止反击")
      } else {
        WG.fj_state = 0
        var autoPfmArrary = Helper.getAutoPfm()
        console.log("获取自动出招顺序")
        console.dir(autoPfmArrary)
        $('.auto_fj').text('停止')
        timer = setInterval(function () { 
          // 只有战斗状态有效
          if (WG.is_combat) { 
            autoPfmArrary.forEach(element => {
              $(".pfm-item[pid='"+element+"']:has(.shadow:hidden)").click()
            });
          }
        }, 200)
      }
    },
    sm_button: function() {
      if (WG.sm_state >= 0) {
        WG.sm_state = -1
        $('.sm_button').text('师门(Q)')
      } else {
        WG.sm_state = 0
        $('.sm_button').text('停止(Q)')
        setTimeout(WG.sm, 200)
      }
    },
    buy: function(good) {
      var tmp = npcs[good.sales]
      if (tmp == undefined) {
        WG.updete_npc_id()
        return false
      }
      WG.Send('list ' + tmp)
      WG.Send('buy 1 ' + good.id + ' from ' + tmp)
      return true
    },
    Give: function(items) {
      var tmp = npcs['店小二']
      if (tmp == undefined) {
        WG.updete_npc_id()
        return false
      }
      WG.Send('give ' + tmp + ' ' + items)
      return true
    },
    eq: function(e) {
      WG.Send('eq ' + equip[e])
    },
    ask: function(npc, i) {
      npc = npcs[npc]
      if (npc != undefined) WG.Send('ask' + i + ' ' + npc)
      else WG.updete_npc_id()
    },

    go_yamen_task: function () {
      WG.go('扬州城-衙门正厅')
      WG.ask('扬州知府 程药发', 1)

      window.setTimeout(WG.check_yamen_task, 1000)
    },
    check_yamen_task: function() {
      messageAppend('查找任务中')
      var task = $('.task-desc:last').text()
      if (task.length == 0) {
        KEY.do_command('tasks')
        window.setTimeout(WG.check_yamen_task, 1000)
        return
      }
      try {
        zb_npc = task.match('犯：([^%]+)，据')[1]
        zb_place = task.match('在([^%]+)出')[1]
        messageAppend('追捕任务：' + zb_npc + '   地点：' + zb_place)
        KEY.do_command('score')
        WG.go(zb_place)
        window.setTimeout(WG.check_zb_npc, 1000)
      } catch (error) {
        messageAppend('查找衙门追捕失败')
        window.setTimeout(WG.check_yamen_task, 1000)
      }
    },
    check_zb_npc: function() {
      var lists = $('.room_items .room-item')
      for (var npc of lists) {
        if (npc.innerText.indexOf(zb_npc) != -1) {
          WG.Send('kill ' + $(npc).attr('itemid'))
          messageAppend('找到' + zb_npc + '，自动击杀！！！')
          return
        }
      }
      window.setTimeout(WG.check_zb_npc, 1000)
    },

    kill_all: function() {
      var lists = $('.room_items .room-item')
      for (var npc of lists) {
        WG.Send('kill ' + $(npc).attr('itemid'))
      }
    },

    get_all: function() {
      var lists = $('.room_items .room-item')
      for (var npc of lists) {
        WG.Send('get all from ' + $(npc).attr('itemid'))
      }
    },
    packup_listener:null,
    sell_all: function () {
      if (WG.packup_listener) {
        messageAppend("<hio>包裹整理</hio>运行中");
        return;
      }
      let stores = [];
      WG.packup_listener = WG.add_hook(["dialog", "text"], (data) => {
        if (data.type == "dialog" && data.dialog == "list") {
          if (data.stores == undefined) {
            return;
          }
          stores = [];
          //去重
          for (let i = 0; i < data.stores.length; i++) {
            let s = null;
            for (let j = 0; j < stores.length; j++) {
              if (stores[j].name == data.stores[i].name) {
                s = stores[j]; break;
              }
            }
            if (s != null) {
              s.count += data.stores[i].count;
            }
            else {
              stores.push(data.stores[i]);
            }
          }

        } else if (data.type == "dialog" && data.dialog == "pack") {
          let cmds = [];
          for (var i = 0; i < data.items.length; i++) {
            //仓库
            if (WG.inArray(data.items[i].name, store_list)) {
              if (data.items[i].can_eq) {
                //装备物品，不能叠加，计算总数
                let store = null;
                for (let j = 0; j < stores.length; j++) {
                  if (stores[j].name == data.items[i].name) {
                    store = stores[j]; break;
                  }
                }
                if (store != null) {
                  if (store.count < 4) {
                    store.count += data.items[i].count;
                    cmds.push("store " + data.items[i].count + " " + data.items[i].id);
                    messageAppend("<hio>包裹整理</hio>" + data.items[i].name + "储存到仓库");
                  }
                  else {
                    messageAppend("<hio>包裹整理</hio>" + data.items[i].name + "超过设置的储存上限");
                  }
                }
                else {
                  stores.push(data.items[i]);
                  cmds.push("store " + data.items[i].count + " " + data.items[i].id);
                  messageAppend("<hio>包裹整理</hio>" + data.items[i].name + "储存到仓库");
                }
              }
              else {
                cmds.push("store " + data.items[i].count + " " + data.items[i].id);
                messageAppend("<hio>包裹整理</hio>" + data.items[i].name + "储存到仓库");
              }
            }
            //丢弃
            if (WG.inArray(data.items[i].name, drop_list)) {
              cmds.push("drop " + data.items[i].count + " " + data.items[i].id);
              messageAppend("<hio>包裹整理</hio>" + data.items[i].name + "丢弃");

            }
            //分解
            if (WG.inArray(data.items[i].name, fenjie_list)) {
              cmds.push("fenjie " + data.items[i].id);
              messageAppend("<hio>包裹整理</hio>" + data.items[i].name + "分解");

            }
          }
          if (cmds.length > 0) {
            WG.Send(cmds);
          }
          WG.go("扬州城-杂货铺");
          WG.Send("sell all");
          WG.Send("look3 1");
        }
        else if (data.type == 'text' && data.msg == '没有这个玩家。') {
          messageAppend("<hio>包裹整理</hio>完成");
          WG.remove_hook(WG.packup_listener);
          WG.packup_listener = undefined;
        }
      });

      messageAppend("<hio>包裹整理</hio>开始");
      WG.go("仓库");
      WG.Send("store;pack");
    },
    zdwk: function() {
      var t = $('.room_items .room-item:first .item-name').text()
      t = t.indexOf('<挖矿')

      if (t == -1) {
        messageAppend('当前不在挖矿状态')
        if (timer == 0) {
          // console.log(timer)
          WG.go('扬州城-矿山')
          WG.eq('铁镐')
          WG.Send('wa')
          timer = setInterval(WG.zdwk, 2000)
        }
      } else {
        WG.timer_close()
      }

      if (WG.at('扬州城-矿山') && t == -1) {
        //不能挖矿，自动买铁镐
        WG.go('扬州城-打铁铺')
        WG.buy(goods['铁镐'])
        //买完等待下一次检查
        messageAppend('自动买铁镐')
        return
      }
      if (WG.at('扬州城-打铁铺')) {
        var lists = $('.dialog-list > .obj-list:eq(1)')
        var id
        var name
        if (lists.length) {
          messageAppend('查找铁镐ID')
          for (var a of lists.children()) {
            a = $(a)
            id = a.attr('obj')
            name = $(a.children()[0]).html()
            if (name == '铁镐') {
              equip['铁镐'] = id

              WG.eq('铁镐')
            }
          }
          GM_setValue(role + '_equip', equip)
          WG.go('扬州城-矿山')
          WG.Send('wa')
        }
        return
      }
    },
    timer_close: function() {
      if (timer) {
        clearInterval(timer)
        timer = 0
      }
    },
    is_strong: false,
    wudao_count: 0,
    wudao_auto: function() {
      //创建定时器
      if (timer == 0) {
        timer = setInterval(WG.wudao_auto, 2000)
      }
      if (!WG.at('武道塔')) {
        //进入武道塔
        WG.go('武道塔')
        WG.ask('守门人', 1)
        WG.Send('go enter')
      } else {
        //武道塔内处理
        if (WG.is_strong) {
          messageAppend('自动武道塔Boss太强了，等待技能CD...')
        } else { 
          messageAppend('自动武道塔...')
        }
        
        var w = $('.room_items .room-item:last')
        var t = w.text()
        if (t.indexOf('守护者') != -1) {
          var hp = $('.room-item .item-status:first .hp .progress-bar').width()
          var mp = $('.room-item .item-status:first .mp .progress-bar').width()
          var isBusy = $('[command=stopstate]').is(':visible')
          var isPfm = $(
            'div.combat-panel div.combat-commands span.pfm-item .shadow'
          ).is(':visible')
          var autoeq = GM_getValue(role + '_auto_eq', autoeq)

          // 挑战失败
          if (hp < 10) {
            Helper.eqhelper(autoeq)
            messageAppend('挑战失败，自动治疗')
            WG.is_strong = true
            $('[cmd=liaoshang]').click()
            return
          }
          // MP不足
          if (mp < 10) {
            messageAppend('MP不足，自动打坐')
            $('[cmd=dazuo]').click()
            return
          }
          // 停止打坐
          if (!isPfm && WG.is_strong) {
            WG.Send('stopstate')
          }
          // 发起挑战
          if (!WG.is_strong || (!isBusy && !isPfm && WG.is_strong)) {
            WG.Send('kill ' + w.attr('itemid'))
            WG.wudao_autopfm()
          }
        } else {
          WG.Send('go up')
        }
        return
      }
    },
    wudao_autopfm: function() {
      var pfm = wudao_pfm.split(',')
      for (var p of pfm) {
        if (
          $(
            'div.combat-panel div.combat-commands span.pfm-item:eq(' +
              p +
              ') span'
          ).css('left') == '0px'
        )
          $(
            'div.combat-panel div.combat-commands span.pfm-item:eq(' + p + ') '
          ).click()
      }
    },
    xue_auto: function() {
      var t = $('.room_items .room-item:first .item-name').text()
      t =
        t.indexOf('<打坐') != -1 ||
        t.indexOf('<学习') != -1 ||
        t.indexOf('<练习') != -1
      //创建定时器
      if (timer == 0) {
        if (t == false) {
          messageAppend('当前不在打坐或学技能')
          return
        }
        timer = setInterval(WG.xue_auto, 1000)
      }
      if (t == false) {
        //学习状态中止，自动去挖矿
        WG.timer_close()
        WG.zdwk()
      } else {
        messageAppend('自动打坐学技能')
      }
    },
    fbnum: 0,
    needGrove: 0,
    oncegrove: function() {
      this.fbnum += 1
      messageAppend('第' + this.fbnum + '次')
      WG.Send('cr yz/lw/shangu;cr over')
      if (this.needGrove == this.fbnum) {
        messageAppend('<hiy>' + this.fbnum + '次副本小树林秒进秒退已完成</hiy>')
        this.timer_close()
        this.needGrove = 0
        this.fbnum = 0
      }
    },
    grove_ask_info: function() {
      return prompt('请输入需要秒进秒退的副本次数', '')
    },
    grove_auto: function() {
      if (timer == 0) {
        this.needGrove = this.grove_ask_info()
        if (this.needGrove) {
          //如果返回的有内容
          if (parseFloat(this.needGrove).toString() == 'NaN') {
            messageAppend('请输入数字')
            return
          }
          messageAppend('开始秒进秒退小树林' + this.needGrove + '次')

          timer = setInterval(() => {
            this.oncegrove()
          }, 1000)
        }
      }
    },
    showhideborad: function() {
      if ($('.WG_log').css('display') == 'none') {
        $('.WG_log').show()
      } else {
        $('.WG_log').hide()
      }
    },
    calc: function() {
      messageClear()
      var html = `
        <div>
        <div style="width:50%;float:left">
        <span>潜能计算器</span>
        <input type="number" id="c" placeholder="初始等级" style="width:50%" class="mui-input-speech"><br/>
        <input type="number" id="m" placeholder="目标等级" style="width:50%"><br/>
        <select id="se" style="width:50%">
        <option value='0'>选择技能颜色</option>
        <option value='1' style="color: #c0c0c0;">白色</option>
        <option value='2' style="color:#00ff00;">绿色</option>
        <option value='3' style="color:#00ffff;">蓝色</option>
        <option value='4' style="color:#ffff00;">黄色</option>
        <option value='5' style="color:#912cee;">紫色</option>
        <option value='6' style="color: #ffa600;">橙色</option>
        </select><br/>
        <input type="button" value="计算" style="width:50%"  id="qnjs"><br/>
        </div>
        <div style="width:50%;float:left">
        <span>开花计算器</span>
        <input type="number" id="nl" placeholder="当前内力" style="width:50%" class="mui-input-speech"><br/>
        <input type="number" id="xg" placeholder="先天根骨" style="width:50%"><br/>
        <input type="number" id="hg" placeholder="后天根骨" style="width:50%"><br/>
        <input type="button" value="计算" id = "kaihua" style="width:50%" <br/>
        <label>人花分值：5000  地花分值：6500  天花分值：8000</label>
        </div>
        </div>`
      messageAppend(html)
      $('#qnjs').on('click', function() {
        messageAppend(
          '需要潜能:' +
            Helper.dian(
              Number($('#c').val()),
              Number($('#m').val()),
              Number($('#se').val())
            )
        )
      })
      $('#kaihua').on('click', function() {
        messageAppend(
          '你的分值:' +
            Helper.gen(
              Number($('#nl').val()),
              Number($('#xg').val()),
              Number($('#hg').val())
            )
        )
      })
    },
    setting: function() {
      messageClear()
      var a = `<div style='text-align:right;width:280px'>
          <span>
          <label for="family">门派选择：</label><select style='width:80px' id="family">
          <option value="武当">武当</option>
          <option value="华山">华山</option>
          <option value="少林">少林</option>
          <option value="峨眉">峨眉</option>
          <option value="逍遥">逍遥</option>
          <option value="丐帮">丐帮</option>
          </select>
          </span>
          <span><label for="wudao_pfm">武道自动攻击： </label><input style='width:80px' type="text" id="wudao_pfm" name="wudao_pfm" value="">
          </span>
          <span><label for="marry_kiss">自动喜宴： </label><select style='width:80px' id = "marry_kiss">
          <option value="已停止">已停止</option>
          <option value="已开启">已开启</option>
          </select>
          </span>
          <span><label for="ks_Boss">自动传到boss： </label><select  style='width:80px' id = "ks_Boss">
          <option value="已停止">已停止</option>
          <option value="已开启">已开启</option>
          </select>
          </span>
          <span><label for="auto_idle">空闲时： </label><select  style='width:80px' id = "auto_idle">
          <option value="1">挖矿</option>
          <option value="2">练功</option>
          </select>
          </span>
          <span><label for="lianxi_id">技能ID： </label><input style='width:80px' type="text" id="lianxi_id" name="lianxi_id" value="">
          </span>
          <span><label for="show_hp">全局显血： </label><select style='width:80px' id = "show_hp">
          <option value="已停止">已停止</option>
          <option value="已开启">已开启</option>
          </select>
          </span>
          <span><label for="auto_eq">BOSS击杀时自动换装： </label><select style='width:80px' id = "auto_eq">
          <option value="999">已停止</option>
          <option value="1">套装1</option>
          <option value="2">套装2</option>
          <option value="3">套装3</option>
          </select>
          </span>
          <span><label for="ks_pfm">叫杀延时(ms)： </label><input style='width:80px' type="text" id="ks_pfm" name="ks_pfm" value=""></span>
          <div class="item-commands"><span class="updete_id_all">初始化ID</span></div>
          </div>
          `
      messageAppend(a)
      $('#family').val(family)
      $('#family').change(function() {
        family = $('#family').val()
        GM_setValue(role + '_family', family)
      })
      $('#wudao_pfm').val(wudao_pfm)
      $('#wudao_pfm').focusout(function() {
        wudao_pfm = $('#wudao_pfm').val()
        GM_setValue(role + '_wudao_pfm', wudao_pfm)
      })
      $('#ks_pfm').val(ks_pfm)
      $('#ks_pfm').focusout(function() {
        ks_pfm = $('#ks_pfm').val()
        GM_setValue(role + '_ks_pfm', ks_pfm)
      })
      $('#marry_kiss').val(automarry)
      $('#marry_kiss').change(function() {
        automarry = $('#marry_kiss').val()
        GM_setValue(role + '_automarry', automarry)
      })
      $('#ks_Boss').val(autoKsBoss)
      $('#ks_Boss').change(function() {
        autoKsBoss = $('#ks_Boss').val()
        GM_setValue(role + '_autoKsBoss', autoKsBoss)
      })
      $('#auto_idle').val(autoIdle)
      $('#auto_idle').change(function() {
        autoIdle = $('#auto_idle').val()
        GM_setValue(role + '_autoIdle', autoIdle)
      })
      // lianxi_id
      $('#lianxi_id').val(lianxiId)
      $('#lianxi_id').change(function() {
        lianxiId = $('#lianxi_id').val()
        GM_setValue(role + '_lianxiId', lianxiId)
      })
      $('#show_hp').val(showHP)
      $('#show_hp').change(function() {
        showHP = $('#show_hp').val()
        GM_setValue(role + '_showHP', showHP)
        Helper.showallhp()
      })
      $('#auto_eq').val(autoeq)
      $('#auto_eq').change(function() {
        autoeq = $('#auto_eq').val()
        GM_setValue(role + '_auto_eq', autoeq)
      })
      $('.updete_id_all').on('click', WG.updete_id_all)
    },
    hooks: [],
    hook_index: 0,
    add_hook: function(types, fn) {
      var hook = {
        index: WG.hook_index++,
        types: types,
        fn: fn
      }
      WG.hooks.push(hook)
      return hook.index
    },
    remove_hook: function(hookindex) {
      var that = this
      console.log('remove_hook')
      for (var i = 0; i < that.hooks.length; i++) {
        if (that.hooks[i].index == hookindex) {
          that.hooks.baoremove(i)
        }
      }
    },
    run_hook: function(type, data) {
      //console.log(data);
      for (var i = 0; i < this.hooks.length; i++) {
        // if (this.hooks[i] !== undefined && this.hooks[i].type == type) {
        //     this.hooks[i].fn(data);
        // }
        var listener = this.hooks[i]
        if (
          listener.types == data.type ||
          (listener.types instanceof Array &&
            $.inArray(data.type, listener.types) >= 0)
        ) {
          listener.fn(data)
        }
      }
    },
    receive_message: function(msg) {
      ws_on_message.apply(this, arguments)
      if (!msg || !msg.data) return
      var data
      if (msg.data[0] == '{' || msg.data[0] == '[') {
        var func = new Function('return ' + msg.data + ';')
        data = func()
      } else {
        data = {
          type: 'text',
          msg: msg.data
        }
      }
      //console.log(msg.data)
      WG.run_hook(data.type, data)
    }
  }

  var Helper = {
    formatCurrencyTenThou: function(num) {
      num = num.toString().replace(/\$|\,/g, '')
      if (isNaN(num)) num = '0'
      var sign = num == (num = Math.abs(num))
      num = Math.floor(num * 10 + 0.50000000001) //cents = num%10;
      num = Math.floor(num / 10).toString()
      for (var i = 0; i < Math.floor((num.length - (1 + i)) / 3); i++) {
        num =
          num.substring(0, num.length - (4 * i + 3)) +
          ',' +
          num.substring(num.length - (4 * i + 3))
      }
      return (sign ? '' : '-') + num
    },

    gen: function(nl, xg, hg) {
      var jg = nl / 100 + xg * hg / 10
      var sd = this.formatCurrencyTenThou(jg)
      return sd
    },

    dian: function(c, m, se) {
      var j = c + m
      var jj = m - c
      var jjc = jj / 2
      var z = j * jjc * se * 5
      var sd = this.formatCurrencyTenThou(z)
      return sd
    },

    //找boss,boss不在,-1,
    findboss: function(data, bossname, callback) {
      for (let i = 0; i < data.items.length; i++) {
        if (data.items[i] != 0) {
          if (data.items[i].name.indexOf(bossname) >= 0) {
            callback(data.items[i].id)
          }
        }
      }
      callback(-1)
    },
    ksboss: '',
    marryhy: '',
    kksBoss: function(data) {
      var boss_place = (boss_place = data.content.match('出现在([^%]+)一带。'))
      var boss_name = data.content.match('听说([^%]+)出现在')
      if (boss_name == null || boss_place == null) {
        return
      }
      boss_name = data.content.match('听说([^%]+)出现在')[1]
      boss_place = data.content.match('出现在([^%]+)一带。')[1]
      var autoKsBoss = GM_getValue(role + '_autoKsBoss', autoKsBoss)
      var autoIdle = GM_getValue(role + '_autoIdle', autoIdle)
      var ks_pfm = GM_getValue(role + '_ks_pfm', ks_pfm)
      var autoeq = GM_getValue(role + '_auto_eq', autoeq)
      console.log('boss')
      console.log(boss_place)
      messageAppend('自动前往BOSS地点')
      WG.Send('stopstate')
      WG.go(boss_place)
      this.ksboss = WG.add_hook(['items', 'itemadd', 'die'], function(data) {
        if (data.type == 'items') {
          if (!WG.at(boss_place)) {
            return
          }
          // 查找boss
          Helper.findboss(data, boss_name, function(bid) {
            if (bid != -1) {
              // 第一次就找到
              next = 999
              Helper.eqhelper(autoeq)
              setTimeout(() => {
                WG.Send('kill ' + bid)
                //WG.Send("select " + bid);
                next = 0
              }, Number(ks_pfm))
            } else {
              if (next == 999) {
                console.log('found')
                return
              }
              // 在周围区域查找
              let lj = needfind[boss_place]
              if (needfind[boss_place] != undefined && next < lj.length) {
                setTimeout(() => {
                  console.log(lj[next])
                  WG.Send(lj[next])
                  next++
                }, 1000)
              } else {
                console.log('not found')
              }
            }
          })
          // end 查找boss
        }
        // 检测boss刷新
        if (data.type == 'itemadd') {
          if (data.name.indexOf(boss_name) >= 0) {
            next = 0
            WG.get_all()
            console.log(this.index)
            WG.remove_hook(this.index)
          }
        }
        // 死亡后自动复活
        if (data.type == 'die') {
          next = 0
          console.log('已死亡，复活')
          WG.Send('relive')
          console.log(this.index)
          WG.remove_hook(this.index)
        }
      })
      console.log(this.ksboss)
      if (autoIdle == 1) {
        // 一分钟后去挖矿
        setTimeout(() => {
          WG.Send('relive')
          WG.remove_hook(this.ksboss)
          WG.zdwk()
          next = 0
        }, 60000)
      }
      if (autoIdle == 2) { 
        // 一分钟后去练功
        setTimeout(() => {
          WG.Send('relive')
          WG.remove_hook(this.ksboss)
          WG.go_liangong()
          next = 0
        }, 60000)
      }
      
    },

    xiyan: function() {
      WG.Send('stopstate')
      WG.go('扬州城-喜宴')
      this.marryhy = WG.add_hook(['items', 'cmds', 'text', 'msg'], function(
        data
      ) {
        if (data.type == 'items') {
          for (let idx = 0; idx < data.items.length; idx++) {
            if (data.items[idx] != 0) {
              if (data.items[idx].name.indexOf('>婚宴礼桌<') >= 0) {
                console.log('拾取')
                WG.Send('get all from ' + data.items[idx].id)
                console.log('xy' + this.index)
                WG.remove_hook(this.index)

                break
              }
            }
          }
        } else if (data.type == 'text') {
          if (data.msg == '你要给谁东西？') {
            console.log('没人')
            WG.remove_hook(this.index)
          }
          if (
            /^店小二拦住你说道：怎么又是你，每次都跑这么快，等下再进去。$/.test(
              data.msg
            )
          ) {
            console.log('cd')
            messageAppend('<hiy>你太勤快了, 1秒后回去挖矿</hiy>')
            console.log('xy' + this.index)
            WG.remove_hook(this.index)
          }
          if (
            /^店小二拦住你说道：这位(.+)，不好意思，婚宴宾客已经太多了。$/.test(
              data.msg
            )
          ) {
            console.log('客满')
            messageAppend('<hiy>你来太晚了, 1秒后回去挖矿</hiy>')
          }
        } else if (data.type == 'cmds') {
          for (let idx = 0; idx < data.items.length; idx++) {
            if (data.items[idx].name == '1金贺礼') {
              WG.Send(data.items[idx].cmd + ';go up')
              console.log('交钱')
              break
            }
          }
        }
      })

      var autoIdle = GM_getValue(role + '_autoIdle', autoIdle)
      if (autoIdle == 1) { 
        setTimeout(() => {
          console.log('挖矿')
          WG.remove_hook(this.marryhy)
          WG.zdwk()
          next = 0
        }, 30000)
      }
      if (autoIdle == 2) { 
        setTimeout(() => {
          console.log('练功')
          WG.remove_hook(this.marryhy)
          WG.go_liangong()
          next = 0
        }, 30000)
      }
    },
    showhp(id) {
      let re = ''
      for (let i = 0; i < roomData.length; i++) {
        if (roomData[i] != 0) {
          if (roomData[i].id == id) {
            re = '角色名:' + roomData[i].name + '\n'
            re += '血量:' + roomData[i].hp + '/' + roomData[i].max_hp + '\n'
            re += '蓝量:' + roomData[i].mp + '/' + roomData[i].max_mp
            return re
          }
        }
      }
      return ''
    },
    saveRoomstate(data) {
      roomData = data.items
    },
    showallhp() {
      var myshow = GM_getValue(role + '_showHP', showHP)
      if (myshow == '已开启') {
        roomData.forEach(function(v, k) {
          if (v != 0) {
            if (v.hp) {
              $('.plushp[itemid=' + v.id + ']').remove()
              $('[itemid=' + v.id + ']').after(
                "<label class='plushp' " +
                  "itemid='" +
                  v.id +
                  "'style='margin-left:30px;    margin-top: -16px; '>血量:" +
                  v.hp +
                  '/' +
                  v.max_hp +
                  '</label>'
              )
            }
          }
        })
      } else if (myshow == '已停止') {
        $('.plushp').remove()
      }
    },
    eqx: null,
    eqhelper(type) {
      if (type == 0 || type > eqlist.length) {
        return
      }
      if (eqlist == null || eqlist[type] == '') {
        messageAppend('套装未保存,保存当前装备作为套装' + type + '!', 1)
        this.eqx = WG.add_hook('dialog', data => {
          if (data.dialog == 'pack' && data.eqs != undefined) {
            eqlist[type] = data.eqs
            GM_setValue(role + '_eqlist', eqlist)
            messageAppend('套装' + type + '保存成功!', 1)
            WG.remove_hook(this.eqx)
          }
        })
        WG.Send('pack')
      } else {
        eqlist = GM_getValue(role + '_eqlist', eqlist)
        for (let i = 1; i < eqlist[type].length; i++) {
          if (eqlist[type][i] != null) {
            WG.Send('eq ' + eqlist[type][i].id)
          }
        }
        if (eqlist[type][0] != null) {
          WG.Send('eq ' + eqlist[type][0].id)
        }
        messageAppend('套装装备成功' + type + '!', 1)
      }
    },
    eqhelperdel: function(type) {
      eqlist = GM_getValue(role + '_eqlist', eqlist)
      eqlist[type] = []
      GM_setValue(role + '_eqlist', eqlist)
      messageAppend('清除套装' + type + '设置成功!', 1)
    },
    // 获取自动出招
    getAutoPfm () { 
      $("[command=setting]").click()
      $(".dialog-footer [for=custom]").click()
      var autoPfmArrary = $("#auto_pfm").val().split(",")
      KEY.dialog_close()
      return autoPfmArrary
    }
  }
  $(document).ready(function() {
    $('head').append(
      '<link href="https://s1.pstatp.com/cdn/expire-1-y/jquery-contextmenu/2.6.3/jquery.contextMenu.min.css" rel="stylesheet">'
    )
    KEY.init()
    WG.init()
    WG.add_hook('items', function (data) {
      Helper.saveRoomstate(data)
      Helper.showallhp()

      for (var npc of data.items) {
        // console.log(npc.name)
        if (npc.name && (npc.name.indexOf('蒙古兵') > 0 ||
          npc.name.indexOf('十夫长') > 0 ||
          npc.name.indexOf('百夫长') > 0)) {
          WG.Send('kill ' + npc.id)
          console.log('襄阳自动击杀 ' + npc.name)
        }
      }
    })
    WG.add_hook('sc', function(data) {
      if ('hp' in data) {
        roomData.forEach(function(v, k) {
          if (v.id == data.id) {
            v.hp = data.hp
          }
        })
        Helper.showallhp()
      }
    })
    WG.add_hook('itemadd', function (data) {
      roomData.push(data)
      Helper.showallhp()

      // console.log(data.name)
      if (data.name && (data.name.indexOf('蒙古兵') > 0 ||
        data.name.indexOf('十夫长') > 0 || 
        data.name.indexOf('百夫长') > 0)) {
        WG.Send('kill ' + data.id)
        console.log('襄阳自动击杀 ' + data.name)
      }
    })
    WG.add_hook('itemremove', function(data) {
      roomData.forEach(function(v, k) {
        if (v.id == data.id) {
          $('.plushp[itemid=' + v.id + ']').remove()
          roomData.splice(k, 1)
        }
      })
      Helper.showallhp()
    })
    WG.add_hook('item', function(data) {
      if (data.id != null) {
        messageAppend(Helper.showhp(data.id))
      }
    })
    WG.add_hook('state', function(data) {
      // console.dir(data)
    })
    WG.add_hook('dialog', function(data) {
      //console.dir(data);
      if (
        data.dialog == 'pack' &&
        data.items != undefined &&
        data.items.length >= 0
      ) {
        //equip =
        for (var i = 0; i < data.items.length; i++) {
          if (data.items[i].name.indexOf('铁镐') >= 0) {
            equip['铁镐'] = data.items[i].id
            messageAppend('铁镐ID:' + data.items[i].id)
          }
        }
        for (var j = 0; j < data.eqs.length; j++) {
          if (data.eqs[j] != null && data.eqs[j].name.indexOf('铁镐') >= 0) {
            equip['铁镐'] = data.eqs[j].id
            messageAppend('铁镐ID:' + data.eqs[j].id)
          }
        }
      }
    })
    WG.add_hook('msg', function(data) {
      if (data.ch == 'sys') {
        var automarry = GM_getValue(role + '_automarry', automarry)
        if (data.content.indexOf('，婚礼将在一分钟后开始。') >= 0) {
          console.dir(data)
          if (automarry == '已开启') {
            console.log('xiyan')
            messageAppend('自动前往婚宴地点')
            Helper.xiyan()
          } else if (automarry == '已停止') {
            var b =
              '<div class="item-commands"><span  id = \'onekeyjh\'>参加喜宴</span></div>'
            messageClear()
            messageAppend('<hiy>点击参加喜宴</hiy>')
            messageAppend(b)
            $('#onekeyjh').on('click', function() {
              Helper.xiyan()
            })
          }
        }
      }
      if (data.ch == 'rumor') {
        if (
          data.content.indexOf('听说') >= 0 &&
          data.content.indexOf('出现在') >= 0 &&
          data.content.indexOf('一带。') >= 0
        ) {
          console.dir(data)
          if (autoKsBoss == '已开启') {
            Helper.kksBoss(data)
          } else if (autoKsBoss == '已停止') {
            var c =
              '<div class="item-commands"><span id = \'onekeyKsboss\'>传送到boss</span></div>'
            messageClear()
            messageAppend('boss已出现')
            messageAppend(c)
            $('#onekeyKsboss').on('click', function() {
              Helper.kksBoss(data)
            })
          }
        }
      }
    })
    // 进入战斗触发
    WG.add_hook('combat', function (data) { 
      // console.log("进入和或离开战斗")
      // console.dir(data)
      if (data.start)
        WG.is_combat = true
      else
        WG.is_combat = false
    })

    $.contextMenu({
      selector: '.container',
      items: {
        关闭自动: {
          name: '关闭自动',
          visible: function(key, opt) {
            return timer != 0
          },
          callback: function(key, opt) {
            WG.timer_close()
          }
        },
        自动: {
          name: '自动',
          visible: function(key, opt) {
            return timer == 0
          },
          items: {
            自动打坐学习: {
              name: '自动打坐学习',
              callback: function(key, opt) {
                WG.xue_auto()
              }
            },
            自动武道: {
              name: '自动武道',
              callback: function (key, opt) {
                WG.is_strong = false
                WG.wudao_count = 0
                WG.wudao_auto()
              }
            },
            自动小树林: {
              name: '自动小树林',
              callback: function(key, opt) {
                WG.grove_auto()
              }
            }
          }
        },
        换装设置: {
          name: '换装设置',
          items: {
            xx0: {
              name: '套装1设定或装备',
              callback: function(key, opt) {
                Helper.eqhelper(1)
              }
            },

            xx1: {
              name: '清除套装1设置',
              callback: function(key, opt) {
                Helper.eqhelperdel(1)
              }
            },
            yy0: {
              name: '套装2设定或装备',
              callback: function(key, opt) {
                Helper.eqhelper(2)
              }
            },
            yy1: {
              name: '清除套装2设置',
              callback: function(key, opt) {
                Helper.eqhelperdel(2)
              }
            },
            zz0: {
              name: '套装3设定或装备',
              callback: function(key, opt) {
                Helper.eqhelper(3)
              }
            },
            zz1: {
              name: '清除套装3设置',
              callback: function(key, opt) {
                Helper.eqhelperdel(3)
              }
            }
          }
        },
        手动喜宴: {
          name: '手动喜宴',
          callback: function(key, opt) {
            Helper.xiyan()
          }
        },
        快捷传送: {
          name: '常用地点',
          items: {
            mp0: {
              name: '豪宅',
              callback: function(key, opt) {
                WG.go('住房')
              }
            },
            mp1: {
              name: '当铺',
              callback: function(key, opt) {
                WG.go('扬州城-当铺')
              }
            },
            mp2: {
              name: '擂台',
              callback: function(key, opt) {
                WG.go('扬州城-擂台')
              }
            },
            mp3: {
              name: '帮派',
              callback: function(key, opt) {
                WG.go('扬州城-帮派')
              }
            },
            mp4: {
              name: '武道',
              callback: function(key, opt) {
                WG.go('武道塔')
              }
            },
            mp5: {
              name: '矿山',
              callback: function(key, opt) {
                WG.go('扬州城-矿山')
              }
            },
            mp6: {
              name: '药铺',
              callback: function(key, opt) {
                WG.go('扬州城-药铺')
              }
            }
          }
        },
        门派传送: {
          name: '门派传送',
          items: {
            mp0: {
              name: '武当',
              callback: function(key, opt) {
                WG.go('武当派-广场')
              }
            },
            mp1: {
              name: '少林',
              callback: function(key, opt) {
                WG.go('少林派-广场')
              }
            },
            mp2: {
              name: '华山',
              callback: function(key, opt) {
                WG.go('华山派-镇岳宫')
              }
            },
            mp3: {
              name: '峨眉',
              callback: function(key, opt) {
                WG.go('峨眉派-金顶')
              }
            },
            mp4: {
              name: '逍遥',
              callback: function(key, opt) {
                WG.go('逍遥派-青草坪')
              }
            },
            mp5: {
              name: '丐帮',
              callback: function(key, opt) {
                WG.go('丐帮-树洞内部')
              }
            },
            mp6: {
              name: '襄阳',
              callback: function(key, opt) {
                WG.go('襄阳城-广场')
              }
            }
          }
        },
        打开仓库: {
          name: '打开仓库',
          callback: function(key, opt) {
            WG.go('仓库')
          }
        },
        更新ID: {
          name: '更新ID',
          callback: function(key, opt) {
            WG.updete_goods_id()
            WG.updete_npc_id()
          }
        },
        调试BOSS: {
          name: '调试BOSS',
          visible: false,
          callback: function(key, opt) {
            Helper.kksBoss({
              content: '听说殇月出现在逍遥派-林间小道一带。'
            })
          }
        },
        设置: {
          name: '设置',
          callback: function(key, opt) {
            WG.setting()
          }
        },
        计算器: {
          name: '计算器',
          callback: function(key, opt) {
            WG.calc()
          }
        },
        打开面板: {
          name: '打开面板',
          visible: function(key, opt) {
            return $('.WG_log').css('display') == 'none'
          },
          callback: function(key, opt) {
            WG.showhideborad()
          }
        },
        关闭面板: {
          name: '关闭面板',
          visible: function(key, opt) {
            return $('.WG_log').css('display') != 'none'
          },
          callback: function(key, opt) {
            WG.showhideborad()
          }
        }
      }
    })
  })
})()
