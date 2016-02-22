'use strict';

var os   = require('os'),
  clui = require('clui');

function buildTrack(length) {
  length = (length)? length: 100;

  let track = [];
  for(var i=0; i<length; i++){
    track.push(' ');
  }

  return track;
}

function renderTrack(track){
  let ret = '[';

  track.forEach(function(el, index){
    if(index % 10 == 0 && el == ' ') {
      el = '.';
    }
    ret += el.toString();
  });

  ret += ']';
  return ret;
}

function paintOnPosition(pos, symbol, track) {
  symbol = (symbol) ? symbol : 'X';
  track[pos] = symbol.toString();
  return track;
}

var pos = 0;
console.log('');
setInterval(function(){
  var track = buildTrack(100);
  //var track2 = buildTrack(100);
  track = paintOnPosition(pos, null, track);
  track = paintOnPosition(Math.ceil(Math.random()*100), 'B',  track);
  track = paintOnPosition(Math.ceil(Math.random()*40), 'C',  track);
  //console.log(renderTrack(track));
  process.stdout.write(renderTrack(track)+'\r');
  pos++;
}, 50);
