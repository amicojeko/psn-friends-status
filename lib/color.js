exports.hex_to_int32 = function(color){
  if (color == undefined) return 0;
  var r = parseInt(color.substring(0,2),16);
  var g = parseInt(color.substring(2,4),16);
  var b = parseInt(color.substring(4,6),16);
  return r << 16 | g << 8 | b;
}
