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
