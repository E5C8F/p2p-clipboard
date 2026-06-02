

// ===== DOM 元素引用 =====

// ===== 连接控制区 ===== 
var 我的标识 = document.getElementById('我的标识');
var 申请 = document.getElementById('申请');
var 复制 = document.getElementById('复制');
var 注销 = document.getElementById('注销');
var 目标标识 = document.getElementById('目标标识');
var 粘贴 = document.getElementById('粘贴');
var 连接 = document.getElementById('连接');
var 断开 = document.getElementById('断开');
// var 我的标识列表 = document.getElementById('我的标识列表');
// var 目标标识列表 = document.getElementById('目标标识列表');

// ===== 共享剪切板区 ===== 
var 共享文本区 = document.getElementById('共享文本区');
// ===== 共享文件列表区 ===== 
var 选择文件 = document.getElementById('选择文件');
var 文件列表区 = document.getElementById('文件列表区');


// ===== 日志区 ===== 
var 日志 = document.getElementById('日志');

var 文件列表 = new Array();

window.addEventListener('error', (e) => {
    日志.innerHTML += '❌ 全局同步错误：' + e.message + '<br>';
});
window.addEventListener('unhandledrejection', (e) => {
    日志.innerHTML += '❌ 全局异步错误：' + e.reason + '<br>';
});

async function 申请回调() {
    申请.disabled = true;
    标识 = String(我的标识.value || Math.floor(Math.random() * 900000) + 100000)
    新连接 = await 建立连接(标识);

}
async function 复制回调() {
    复制.disabled = true;
    navigator.clipboard.writeText(我的标识.value)
        .then(() => {
            日志.innerHTML += '✅ 复制成功! <br>';
        })
        .catch(() => {
            日志.innerHTML += '❌ 复制失败! <br>';
        })
        .finally(() => {
            复制.disabled = false;
        });
}
async function 注销回调() {
    注销.disabled = true;
    复制.disabled = true;
    申请.disabled = false;
    连接.disabled = true;
    断开.disabled = true;
    粘贴.disabled = true;
    新连接.destroy();
    日志.innerHTML += '注销成功! <br>';
}

async function 连接回调() {
    连接.disabled = true;
    断开.disabled = true;
    粘贴.disabled = true;
    if (目标标识.value) {
        数据连接 = 新连接.connect(await 计算SHA256哈希(目标标识.value));
        数据连接.on('open', () => connection_open回调());
        数据连接.on('data', (data) => connection_data回调(data));
        数据连接.on('close', () => connection_close回调());
        数据连接.on('error', (error) => connection_error回调(error));
    } else {
        连接.disabled = false;
        断开.disabled = true;
        粘贴.disabled = false;
        日志.innerHTML += '❌ 目标标识不能为空<br>';
    }
}
async function 粘贴回调() {
    粘贴.disabled = true;
    navigator.clipboard.readText()
        .then((text) => {
            目标标识.value = text;
            日志.innerHTML += '✅ 粘贴成功<br>';
            连接.click();
        })
        .catch((err) => {
            粘贴.disabled = false;
            日志.innerHTML += '❌ 粘贴失败<br>';
        })

}
async function 断开回调() {
    断开.disabled = true;
    数据连接.close();
    连接.disabled = false;
    粘贴.disabled = false;
}



async function 共享文本区回调() {
    clearTimeout(防抖定时器);

    防抖定时器 = setTimeout(() => {
        if (typeof 数据连接 !== 'undefined' && 数据连接.open) {
            数据连接.send('0' + 共享文本区.value);
            日志.innerHTML += '📨 剪切板已更新, 发送消息...<br>';
        }
    }, 1000);
}


async function 选择文件回调() {
    日志.innerHTML += '✅ 已选择文件...<br>';
    for (const 文件 of 选择文件.files) {
        文件列表.push([文件.name, 文件.size, 文件]);
        if (typeof 数据连接 !== 'undefined' && 数据连接.open) {
            数据连接.send('1' + JSON.stringify([文件.name, 文件.size, 文件]));
            日志.innerHTML += '📨 文件列表已更新, 发送消息...<br>';
        }
    }
    刷新文件列表显示();

}



function 刷新文件列表显示() {
    文件列表区.innerHTML = '';

    if (文件列表.length === 0) {
        文件列表区.innerHTML = '<span style="color: #999;">在此选择文件, 自动同步给对方...</span>';
        return;
    }

    文件列表.forEach((列表, 索引) => {
        // for (const 文件 of 文件列表) {
        const [name, size, 文件] = 列表;
        const 文件项 = document.createElement('div');
        文件项.className = '文件项';

        const 文件名称 = document.createElement('span');
        文件名称.className = '文件名称';
        文件名称.textContent = '📄 ' + name;

        const 文件大小 = document.createElement('span');
        文件大小.className = '文件大小';
        文件大小.textContent = size;

        const 下载按钮 = document.createElement('button');
        下载按钮.className = '下载按钮';
        下载按钮.textContent = '⬇ 下载';
        下载按钮.onclick = () => 下载文件(索引);

        const 删除按钮 = document.createElement('button');
        删除按钮.className = '下载按钮';
        删除按钮.textContent = '🗑 删除';
        删除按钮.style.background = '#ff000089';
        删除按钮.onclick = () => 删除文件(索引);

        文件项.appendChild(文件名称);
        文件项.appendChild(文件大小);
        文件项.appendChild(下载按钮);
        文件项.appendChild(删除按钮);

        文件列表区.appendChild(文件项);
    })


}

function 下载文件(索引) {
    const [name, size, 文件] = 文件列表[索引];
    if (文件 instanceof File) {
        const 链接 = document.createElement('a');
        链接.href = URL.createObjectURL(文件);
        链接.download = 文件.name;
        链接.click();
        URL.revokeObjectURL(链接.href);
    } else {
        数据连接.send('3' + JSON.stringify(文件列表[索引]));
        下载文件名称 = name;
        下载文件大小 = size;
    }
}

function 删除文件(索引) {
    if (typeof 数据连接 !== 'undefined' && 数据连接.open) {
        数据连接.send('2' + JSON.stringify(文件列表[索引]));
        日志.innerHTML += '📨 文件已删除, 发送消息...<br>';
    }
    文件列表.splice(索引, 1);
    刷新文件列表显示();
}

async function connection_open回调() {
    防抖定时器 = null;
    连接.disabled = true;
    断开.disabled = false;
    粘贴.disabled = true;
    选择文件.disabled = false;
    共享文本区.oninput = 共享文本区回调;
    日志.innerHTML += '✅ 连接成功<br>';
}
async function connection_data回调(data) {

    if (typeof 下载文件名称 !== 'undefined' || typeof 下载文件大小 !== 'undefined') {
        // 判断是否是二进制文件数据
        if (data instanceof ArrayBuffer) {
            if (下载文件名称 && 下载文件大小 && data.byteLength === 下载文件大小) {
                // 收到文件数据，下载
                const 链接 = document.createElement('a');
                链接.href = URL.createObjectURL(new Blob([data]));
                链接.download = 下载文件名称;
                链接.click();
                日志.innerHTML += '📩 收到文件数据，正在下载...<br>';
                下载文件名称 = undefined;
                下载文件大小 = undefined;
            }
        }

    } else if (data[0] == '0') {
        共享文本区.oninput = null;
        共享文本区.value = data.slice(1);
        共享文本区.oninput = 共享文本区回调;
        日志.innerHTML += '📩 收到消息, 剪切板已更新.<br>';
    } else if (data[0] == '1') {
        文件列表.push(JSON.parse(data.slice(1)))
        刷新文件列表显示();
        日志.innerHTML += '📩 收到消息，文件列表已更新.<br>';
    } else if (data[0] == '2') {
        const [name, size] = JSON.parse(data.slice(1));
        文件列表 = 文件列表.filter(f => f[0] !== name || f[1] !== size);
        刷新文件列表显示();
        日志.innerHTML += '📩 收到消息，文件已删除.<br>';
    } else if (data[0] == '3') {
        const [name, size] = JSON.parse(data.slice(1));
        const [_, __, 文件] = 文件列表.find(f => f[0] === name && f[1] === size && f[2] instanceof File);
        if (文件) {
            const 数据 = await 文件.arrayBuffer();
            日志.innerHTML += '📩 收到下载请求，文件正在发送...<br>';
            数据连接.send(数据);
        } else {
            日志.innerHTML += '📩 收到下载请求，文件不存在.<br>';
            数据连接.send('4');
        }
    } else if (data[0] == '4') {
        下载文件名称 = undefined;
        下载文件大小 = undefined;
        日志.innerHTML += '📩 收到下载请求，文件不存在.<br>';
    } else if (data[0] == '5') {
        日志.innerHTML += '❌ 目标已有连接对象，对方拒绝连接<br>';
    }
}

async function connection_close回调() {
    连接.disabled = false;
    断开.disabled = true;
    粘贴.disabled = false;
    数据连接 = undefined;
    选择文件.disabled = true;
    共享文本区.oninput = null;
    日志.innerHTML += '🔒 连接被断开<br>';
}

async function connection_error回调(error) {
    数据连接 = undefined;
    连接.disabled = false;
    断开.disabled = true;
    粘贴.disabled = false;
    选择文件.disabled = true;
    共享文本区.oninput = null;
    日志.innerHTML += '❌ 连接错误：' + error + '<br>';
}

async function 计算SHA256哈希(输入字符串) {
    return bytesToHex(sha256(utf8ToBytes(输入字符串)));
}

async function open回调(最终分配标识) {
    if (最终分配标识 != 标识哈希) {
        日志.innerHTML += '该标识已经被占用了，请换一个 <br>';
        新连接.destroy();
    } else {
        日志.innerHTML += '标识分配成功！<br>';
        我的标识.value = 标识;
        目标标识.disabled = false;
        复制.disabled = false;
        注销.disabled = false;
        连接.disabled = false;
        断开.disabled = true;
        粘贴.disabled = false;
    }
}


async function error回调(错误对象) {
    目标标识.disabled = false;
    粘贴.disabled = false;
    连接.disabled = false;
    日志.innerHTML += '❌ 连接发生错误：[' + 错误对象.code + '] ' + 错误对象.message + '<br>';
}
async function connection回调(连接) {
    if (typeof 数据连接 === 'undefined' || !数据连接.open) {
        数据连接 = 连接;
        数据连接.on('open', () => connection_open回调());
        数据连接.on('data', (data) => connection_data回调(data));
        数据连接.on('close', () => connection_close回调());
        数据连接.on('error', (error) => connection_error回调(error));
    } else {
        连接.on('open', () => {连接.send('5');连接.close();});
        日志.innerHTML += '❌ 连接已存在,拒绝和' + 连接.peer + '建立新连接<br>';
    }

}
async function call回调(通话) {
}
async function disconnected回调(断开连接的ID) {
}
async function close回调() {
}
async function reconnecting回调() {
}


async function 建立连接(标识) {

    标识哈希 = await 计算SHA256哈希(标识);
    新连接 = new Peer(标识哈希);
    新连接.on('open', (id) => open回调(id));
    新连接.on('error', (error) => error回调(error));
    新连接.on('connection', (conn) => connection回调(conn));
    新连接.on('call', (call) => call回调(call));
    新连接.on('disconnected', (id) => disconnected回调(id));
    新连接.on('close', () => close回调());
    新连接.on('reconnecting', () => reconnecting回调());
    return 新连接;
}
async function 框架加载完毕() {
    日志.innerHTML += 'JS 框架加载成功 <br>';
    申请.onclick = 申请回调;
    申请.disabled = false;
    我的标识.disabled = false;
    共享文本区.oninput = 共享文本区回调;
    共享文本区.disabled = false;
    复制.disabled = true;
    复制.onclick = 复制回调;
    注销.disabled = true;
    注销.onclick = 注销回调;
    连接.disabled = true;
    连接.onclick = 连接回调;
    断开.disabled = true;
    断开.onclick = 断开回调;
    粘贴.disabled = true;
    粘贴.onclick = 粘贴回调;
    选择文件.disabled = true;
    选择文件.onchange = 选择文件回调;
    目标标识.disabled = true;


    new MutationObserver(() => 日志.scrollTop = 日志.scrollHeight).observe(日志, { childList: true });
    申请.click();
}
async function 框架加载出错() {
    日志.innerHTML += 'JS 框架加载失败 <br>';
}


Promise.all([
    // import('https://esm.sh/peerjs@1.5.5'),
    // import('https://esm.sh/@noble/hashes@2.2.0/sha2'),
    // import('https://cdn.jsdelivr.net/npm/@noble/ed25519@3.1.0/index.min.js'),
    // import('https://esm.sh/@noble/hashes@2.2.0/utils'),
    import('https://esm.sh/peerjs@1.5.5').catch(() => import('https://fastly.jsdelivr.net/npm/peerjs@1.5.5/dist/bundler.mjs/+esm')),
    import('https://esm.sh/@noble/hashes@2.2.0/sha2').catch(() => import('https://fastly.jsdelivr.net/npm/@noble/hashes@2.2.0/sha2.js/+esm')),
    import('https://esm.sh/@noble/hashes@2.2.0/utils').catch(() => import('https://fastly.jsdelivr.net/npm/@noble/hashes@2.2.0/utils.js/+esm')),


]).then(([peerjs, sha2, utils]) => {
    Peer = peerjs.default;
    sha256 = sha2.sha256;
    bytesToHex = utils.bytesToHex;
    utf8ToBytes = utils.utf8ToBytes;

    框架加载完毕();
}).catch((error) => {
    框架加载出错();
});


