importScripts('lzw.js');
onmessage = function (event) {
    var str = event.data.value;
    str = lzw.compress(str);
    postMessage({key : event.data.key, value : str});
};
