importScripts('lzw.js');
onmessage = function (event) {
    var str = event.data.value;
    str = lzw.decompress(str);
    postMessage({key : event.data.key, value : str});
};
