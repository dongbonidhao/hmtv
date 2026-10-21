'use strict';
const http = require('http');

function toast(msg){
  try{
    var port = typeof globalThis.catDartServerPort==='function' ? Number(globalThis.catDartServerPort())||0 : 0;
    if(!port) return;
    var payload = JSON.stringify({action:'toast',opt:{message:msg,duration:4}});
    var req = require('http').request({host:'127.0.0.1',port:port,path:'/msg',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(payload)}}, function(r){ r.resume(); });
    req.on('error',function(){});
    req.write(payload); req.end();
  }catch(e){}
}
function log(m){ console.log('[t3]', m); toast('t3 '+m); }

var server = null;
var SITES = [
  { key:'nodejs_probe1', name:'探针站一', type:3, api:'/spider/probe1/3', searchable:1, quickSearch:0, filterable:0 },
  { key:'nodejs_probe2', name:'探针站二', type:3, api:'/spider/probe2/3', searchable:1, quickSearch:0, filterable:0 }
];
function config(){
  return {
    video: { sites: SITES, danmuSearchUrl:'', homePageUrl:'' },
    read:{sites:[]}, comic:{sites:[]}, music:{sites:[]}, pan:{sites:[]}, color:[]
  };
}
function handler(req, res){
  var p = String(req.url||'').split('?')[0];
  if (p === '/config' || p === '/full-config') {
    res.writeHead(200, {'Content-Type':'application/json; charset=utf-8'});
    return res.end(JSON.stringify(config()));
  }
  var m = /^\/spider\/([^/]+)\/(\d+)\/(.*)$/.exec(p);
  if (m) {
    var action = m[3];
    var body = '';
    req.on('data', function(c){ body += c; });
    req.on('end', function(){
      res.writeHead(200, {'Content-Type':'application/json; charset=utf-8'});
      if (action === 'home') return res.end(JSON.stringify({ class:[{type_id:'1', type_name:'探针分类'}] }));
      if (action === 'category') return res.end(JSON.stringify({ page:1, pagecount:1, list:[{vod_id:'a1',vod_name:'探针条目',vod_pic:'',vod_remarks:'ok'}] }));
      res.end('{}');
    });
    return;
  }
  res.writeHead(200, {'Content-Type':'application/json; charset=utf-8'});
  res.end(JSON.stringify({ probe:true, url:req.url }));
}
async function start(configIn){
  var port = Number(process.env.DEV_HTTP_PORT || process.env.PORT || 9988);
  log('start() 端口=' + port);
  var srv = null;
  if (typeof globalThis.catServerFactory === 'function') {
    try { srv = globalThis.catServerFactory(handler, {}); log('用壳子工厂'); } catch(e){ log('工厂异常: '+e.message); srv=null; }
  }
  if (!srv || typeof srv.listen !== 'function') { srv = http.createServer(handler); log('用原生 http'); }
  var ok = await new Promise(function(resolve){
    var done=false; function fin(v){ if(!done){done=true;resolve(v);} }
    setTimeout(function(){ fin(false); }, 6000);
    srv.once('listening', function(){ fin(true); });
    srv.once('error', function(e){ log('listen 报错: '+(e&&e.code)); fin(e && e.code==='EADDRINUSE'); });
    try { srv.listen({ port: port, host: '0.0.0.0' }); } catch(e){ log('抛错: '+(e&&e.code)); fin(false); }
  });
  server = srv;
  log('监听' + (ok?'成功':'失败') + ' @' + port);
  return srv;
}
async function stop(){ if(server){ try{ server.close(); }catch(e){} server=null; } }
module.exports = { start: start, stop: stop };
