console.log(`welcome to ${location.hostname}!`);

// auto load git explorer if link found:

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
        if (!window._git_explorer_js_) {
            let e = document.createElement('script');
            e.src = '/static/git-explorer.js';
            e.type = 'text/javascript';
            e.addEventListener('load', create);
            document.getElementsByTagName('head')[0].appendChild(e);
            window._git_explorer_js_ = true;
        } else {
            create();
        }
    }
}

documentReady(initGitExplorer);
gitsite.addContentChangedListener(initGitExplorer);

// auto load x-lang if <pre class="hljs"><code class="language-x-lang"> found:

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
    }
    return buffer || '(no output)';
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
    let codeResult = divResult.querySelector('code');
    // start run:
    divResult.style.display = 'none';
    codeResult.innerText = '';
    svgIdle.style.display = 'none';
    svgBusy.style.display = 'inline';
    btn.disabled = true;
    const cleanup = () => {
        svgIdle.style.display = 'inline';
        svgBusy.style.display = 'none';
        btn.disabled = false;
        divResult.style.display = 'block';
    };
    // run async function:
    let asyncExecFn = window[`exec_${lang}`];
    asyncExecFn(codeText)
        .then(result => {
            codeResult.innerText = result.toString();
            cleanup();
        })
        .catch(err => {
            codeResult.innerText = (err || 'Error').toString();
            cleanup();
        });
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
        <textarea class="exec-form-textarea" rows="10" name="comment" id="comment" class="" style="width: 100%; resize: vertical; font-family: Monaco, Menlo, Consolas, 'Courier New', monospace;"></textarea>
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

