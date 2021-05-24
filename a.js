ow.loadFormat();

var fn = function(aStr) {
  _$(aStr, "aStr").isString().$_();

  var sizes = ['BYTES', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  aStr = aStr.trim();
  var arr = aStr.split(/\s+/), unit, value;
  if (arr.length >= 2) {
    unit  = String(arr[arr.length - 1]);
    value = Number(arr[arr.length - 2]);  
  } else {
    unit  = "";
    value = parseFloat(aStr);
  }
  
  var vfactor = 1;
  for(var ii = 1; ii <= sizes.indexOf(unit.toUpperCase()); ii++) {
    vfactor *= 1024;
  }
  return Math.round(value * vfactor);
}