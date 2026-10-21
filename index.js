'use strict';
// 包4：不 require 任何模块、不自己 listen，完全依赖壳子注入的 catServerFactory
var server = null;

function log(m) {
  try { console.log('[t4]', m); } catch (e) {}
}

function handler(req, res) {
  var p = String((req && req.url) || '').split('?')[0];
  var body = JSON.stringify({
    video: {
      sites: [
        { key: 'nodejs_probe1', name: '探针站一', type: 3, api: '/spider/probe1/3', searchable: 1, quickSearch: 0, filterable: 0 }
      ],
      danmuSearchUrl: '',
      homePageUrl: ''
    },
    read: { sites: [] },
    comic: { sites: [] },
    music: { sites: [] },
    pan: { sites: [] },
    color: []
  });
  try {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(body);
  } catch (e) {
    log('res 写入失败: ' + e.message);
  }
}

async function start(config) {
  log('start() 进入');
  var f = globalThis.catServerFactory;
  log('catServerFactory = ' + (typeof f));
  if (typeof f !== 'function') {
    log('没有工厂，直接返回（本包不自己开端口）');
    return { ok: false };
  }
  try {
    server = f(handler, {});
    log('工厂返回: ' + (server ? typeof server : 'null'));
    if (server && typeof server.listen === 'function') {
      log('listening 属性 = ' + server.listening);
      // 关键：不调用 listen，只观察它会不会自己进入监听
      var t0 = Date.now();
      while (Date.now() - t0 < 3000) {
        if (server.listening === true) {
          var a = typeof server.address === 'function' ? server.address() : null;
          log('工厂已自行监听，端口=' + (a && a.port ? a.port : '未知'));
          return server;
        }
        await new Promise(function (r) { setTimeout(r, 100); });
      }
      log('3 秒内工厂没有自行监听（不主动 listen，按原版思路交给壳子）');
    }
  } catch (e) {
    log('工厂异常: ' + (e && e.message));
  }
  return server;
}

async function stop() {
  server = null;
  log('stop()');
}

module.exports = { start: start, stop: stop };
