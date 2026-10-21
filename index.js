'use strict';

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
function log(m){ console.log('[t1]', m); toast('t1 '+m); }

var started = false;
async function start(config){
  started = true;
  log('start() 被调用');
  log('参数: ' + (config ? Object.keys(config).join(',') : '无'));
  log('环境: PORT=' + (process.env.PORT||'-') + ' NODE=' + process.version + ' 平台=' + process.platform + '/' + process.arch);
  log('catServerFactory=' + (typeof globalThis.catServerFactory));
  log('catDartServerPort=' + (typeof globalThis.catDartServerPort));
  return { ok: true };
}
async function stop(){ started = false; log('stop()'); }
module.exports = { start: start, stop: stop };
