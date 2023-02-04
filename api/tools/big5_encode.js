import { Iconv } from 'iconv';
const iconv2Big5 = new Iconv('utf8', 'BIG5');

export const big5_encode = chr => {
  var rtn = '';
  var buf = iconv2Big5.convert(chr);
  for (var i = 0; i < buf.length; i += 2) {
    if (buf[i + 1] === undefined) break;
    rtn += '%' + buf[i].toString(16).toUpperCase();
    rtn +=
      (buf[i + 1] >= 65 && buf[i + 1] <= 90) || (buf[i + 1] >= 97 && buf[i + 1] <= 122)
        ? String.fromCharCode(buf[i + 1])
        : '%' + buf[i + 1].toString(16).toUpperCase();
  }
  return rtn;
};
