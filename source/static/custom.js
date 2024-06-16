console.log(`welcome to ${location.hostname}!`);

/******************** auto load git explorer if link found ********************/

function initGitExplorer() {
    let git_links = document.querySelectorAll('#gsi-content a.git-explorer');
    if (git_links.length > 0) {
        console.log('load git explorer...');
        let create = function () {
            for (let i = 0; i < git_links.length; i++) {
                let git_link = git_links[i];
                let git_url = git_link.href;
                console.log(`process git link ${git_url}...`);
                createGitExplorer(git_link, git_url);
            }
        };
        gitsite.loadScript('/static/git-explorer.js', create);
    }
}

documentReady(initGitExplorer);
gitsite.addContentChangedListener(initGitExplorer);

/******************** load script for blockchian ********************/

if (location.pathname.startsWith('/books/blockchain/')) {
    documentReady(() => {
        gitsite.loadScript('/static/blockchain-lib.js', null, true);
    });
}

/******************** load script for javascript ********************/

if (location.pathname.startsWith('/books/javascript/')) {
    documentReady(() => {
        function initJqueryOrUnderscore() {
            if (location.pathname.startsWith('/books/javascript/jquery/')) {
                gitsite.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js');
            }
            else if (location.pathname.startsWith('/books/javascript/underscore/')) {
                gitsite.loadScript('https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.13.6/underscore-umd-min.js');
            }
        }
        initJqueryOrUnderscore();
        gitsite.addContentChangedListener(initJqueryOrUnderscore);
    });
}

/******************** load script for sql ********************/

if (location.pathname.startsWith('/books/sql/')) {
    let initSql = function () {
        alasql.options.joinstar = 'underscore';
        let
            i,
            classes_data = [['一班'], ['二班'], ['三班'], ['四班']],
            students_data = [[1, '小明', 'M', 90], [1, '小红', 'F', 95], [1, '小军', 'M', 88], [1, '小米', 'F', 73], [2, '小白', 'F', 81], [2, '小兵', 'M', 55], [2, '小林', 'M', 85], [3, '小新', 'F', 91], [3, '小王', 'M', 89], [3, '小丽', 'F', 88]];
        alasql('DROP TABLE IF EXISTS classes');
        alasql('DROP TABLE IF EXISTS students');
        alasql('CREATE TABLE classes (id BIGINT NOT NULL AUTO_INCREMENT, name VARCHAR(10) NOT NULL, PRIMARY KEY (id))');
        alasql('CREATE TABLE students (id BIGINT NOT NULL AUTO_INCREMENT, class_id BIGINT NOT NULL, name VARCHAR(10) NOT NULL, gender CHAR(1) NOT NULL, score BIGINT NOT NULL, PRIMARY KEY (id))');
        for (i = 0; i < classes_data.length; i++) {
            alasql('INSERT INTO classes (name) VALUES (?)', classes_data[i]);
        }
        for (i = 0; i < students_data.length; i++) {
            alasql('INSERT INTO students (class_id, name, gender, score) VALUES (?, ?, ?, ?)', students_data[i]);
        }
    };
    documentReady(() => {
        gitsite.loadScript('/static/alasql.js', initSql, true);
    });
    gitsite.addContentChangedListener(initSql);
}

/******************** auto load x-lang ********************/

async function exec_sql(code) {
    if (typeof (alasql) === undefined) {
        throw 'JavaScript嵌入式SQL引擎尚未加载完成，请稍后再试或者刷新页面！';
    }
    const genTable = function (rs) {
        if (rs.length === 0) {
            return '<pre><code>empty result set</pre></code>';
        }
        let keys = Object.keys(rs[0]);
        let ths = keys.map(th => {
            let n = th.indexOf('!');
            if (n >= 0) {
                th = th.substring(n + 1);
            }
            return '<th>' + gitsite.encodeHtml(th) + '</th>';
        });
        let trs = rs.map(row => {
            let tds = keys.map(key => {
                let v = row[key];
                if (v === undefined || v === null) {
                    v = 'NULL';
                }
                return '<td>' + gitsite.encodeHtml(String(v)) + '</td>';
            });
            return '<tr>' + tds.join('') + '</tr>';
        });
        return `<table><thead><tr>${ths.join('')}</tr></thead><tbody>${trs.join('')}</tbody></table>`;
    };
    // format lines:
    let lines = code.split('\n')
        .map( // remove comment
            line => {
                let n = line.indexOf('--');
                if (n >= 0) {
                    line = line.substring(0, n);
                }
                return line;
            })
        .join('\n')
        .split(';')
        .map(line => line.trim().replace(/[\s\n]+/g, ' '))
        .filter(line => line !== ''); // remove empty line
    console.log(lines);
    // execute each line:
    let results = [];
    for (let line of lines) {
        let result = '';
        try {
            let rs = alasql(line);
            if (Array.isArray(rs)) {
                result = genTable(rs);
            } else {
                result = '<pre><code>' + gitsite.encodeHtml(String(rs)) + '</code></pre>';
            }
        } catch (err) {
            result = '<pre><code>' + gitsite.encodeHtml(String(err)) + '</code></pre>';
        }
        results.push('<pre><code>&gt;&nbsp;' + gitsite.encodeHtml(line) + '</code></pre>');
        results.push(result);
    }
    return {
        html: true,
        output: results.join('')
    };
}

async function exec_javascript(code) {
    // we must capture console.log / console.error / ...:
    const { fn_log, fn_error, fn_warn, fn_debug, fn_trace, fn_info } = console;
    let buffer = '';
    let _log = function (...args) {
        console.log(...args);
        buffer = buffer + args.map(String).join(' ') + '\n';
    };
    let _warn = function (...args) {
        console.warn(...args);
        buffer = buffer + args.map(String).join(' ') + '\n';
    };
    let _error = function (...args) {
        console.error(...args);
        buffer = buffer + args.map(String).join(' ') + '\n';
    };
    _console = {
        trace: _log,
        debug: _log,
        log: _log,
        info: _log,
        warn: _warn,
        error: _error
    };
    try {
        eval('(function () { const console=_console;\n' + code + '\n})();');
    } catch (err) {
        buffer = buffer + String(err);
        return {
            error: true,
            output: buffer
        };
    }
    return {
        output: buffer
    };
}

function try_exec_code(btn) {
    let form = btn.parentElement.parentElement;
    let lang = form.getAttribute('data-lang');
    console.log(`try execute ${lang}...`);
    // get code:
    let codeText = form.querySelector('textarea').value;
    console.log('try code:\n' + codeText);
    // get element:
    let svgIdle = btn.querySelector('svg.exec-form-icon-idle');
    let svgBusy = btn.querySelector('svg.exec-form-icon-busy');
    let divResult = form.querySelector('div.exec-form-result');
    // start run:
    divResult.style.display = 'none';
    divResult.innerHTML = '';
    svgIdle.style.display = 'none';
    svgBusy.style.display = 'inline';
    btn.disabled = true;
    const setResult = (result) => {
        svgIdle.style.display = 'inline';
        svgBusy.style.display = 'none';
        btn.disabled = false;
        divResult.style.display = 'block';
        if (result.html) {
            // this is a html fragment:
            divResult.innerHTML = result.output || '<pre><code>(no output)</code></pre>';
        } else {
            divResult.innerHTML = '<pre><code></code></pre>';
            divResult.querySelector('code').innerText = result.output || '(no output)';
        }
    };
    setTimeout(() => {
        // run async function:
        let asyncExecFn = window[`exec_${lang}`];
        asyncExecFn(codeText)
            .then(result => {
                setResult(result);
            })
            .catch(err => {
                setResult({
                    error: true,
                    html: false,
                    output: (err || 'Error').toString()
                });
            });
    }, 200);
}

function initExecLang() {
    let codes = document.querySelectorAll('#gsi-content pre.hljs>code[class^="language-x-"]');
    if (codes.length === 0) {
        return;
    }
    const AsyncFunction = (async () => { }).constructor;
    codes.forEach(code => {
        let lang = code.className.substring(11); // 'codeLage-x-'
        if (!lang) {
            console.error(`invalid code class: ${code.className}`);
            return;
        }
        let codeExecFn = window[`exec_${lang}`];
        if (typeof (codeExecFn) !== 'function' || !(codeExecFn instanceof AsyncFunction)) {
            console.error(`async function exec_${lang} not defined.`);
            return;
        }
        // get text:
        let codeText = code.innerText || code.textContent;
        // create form:
        let formHtml = `
<form data-lang="${lang}" class="exec-form" style="margin: 16px 0;" onsubmit="return false">
    <div>
        <textarea class="exec-form-textarea" name="comment" id="comment" class="" style="width:100%; height:260px; resize:vertical; font-family:Menlo,Consolas,Monaco,'Courier New',monospace;"></textarea>
    </div>
    <div>
        <button class="exec-form-button" type="button" onclick="try_exec_code(this)">
            <svg xmlns="http://www.w3.org/2000/svg" class="exec-form-icon-idle" width="20" height="20" fill="currentColor" style="display:inline" viewBox="0 0 16 16"><path d="M10.804 8 5 4.633v6.734zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696z"/></svg>
            <svg xmlns="http://www.w3.org/2000/svg" class="exec-form-icon-busy" width="20" height="20" fill="currentColor" stroke="currentColor" style="display:none" viewBox="0 0 100 100"><g><circle stroke-dasharray="141.37166941154067 49.12388980384689" r="30" stroke-width="6" fill="none" cy="50" cx="50"><animateTransform keyTimes="0;1" values="0 50 50;360 50 50" dur="1s" repeatCount="indefinite" type="rotate" attributeName="transform"></animateTransform></circle><g></g></g></svg>
            Run
        </button>
    </div>
    <div class="exec-form-result" style="display:none">
        <pre><code></code></pre>
    </div>
</form>
`;
        let div = document.createElement('div');
        div.innerHTML = formHtml;
        let pre = code.parentElement;
        pre.style.display = 'none';
        pre.after(div);
        div.querySelector('textarea').value = codeText;
    });
}

documentReady(initExecLang);
gitsite.addContentChangedListener(initExecLang);
