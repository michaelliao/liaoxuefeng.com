# 首页

<h4>廖雪峰的官方网站为您提供原创精品中文教程：</h4>

<div class="home-book-list">
    <!-- java -->
    <div class="home-book-list-item">
        <a href="/books/java/index.html" class="home-book-list-image">
            <div>
                <img src="/static/cover/java.jpg" /> 
            </div>
            <div class="home-book-list-title">
                Java教程
            </div>
            <div class="home-book-list-desc">
                小白的Java新手教程，零基础迈向Java架构师！
            </div>
        </a>
    </div>
    <!-- python -->
    <div class="home-book-list-item">
        <a href="/books/python/index.html" class="home-book-list-image">
            <div>
                <img src="/static/cover/python.jpg" />
            </div>
            <div class="home-book-list-title">
                Python教程
            </div>
            <div class="home-book-list-desc">
                完全面向小白的Python新手教程！
            </div>
        </a>
    </div>
    <!-- javascript -->
    <div class="home-book-list-item">
        <a href="/books/javascript/index.html" class="home-book-list-image">
            <div>
                <img src="/static/cover/javascript.jpg" />
            </div>
            <div class="home-book-list-title">
                JavaScript教程
            </div>
            <div class="home-book-list-desc">
                迈向全栈工程师之路的JavaScript教程！
            </div>
        </a>
    </div>
    <!-- sql -->
    <div class="home-book-list-item">
        <a href="/books/sql/index.html" class="home-book-list-image">
            <div>
                <img src="/static/cover/sql.jpg" />
            </div>
            <div class="home-book-list-title">
                SQL教程
            </div>
            <div class="home-book-list-desc">
                小白的零基础SQL教程，可以在线跑SQL！
            </div>
        </a>
    </div>
    <!-- summerframework -->
    <div class="home-book-list-item">
        <a href="/books/summerframework/index.html" class="home-book-list-image">
            <div>
                <img src="/static/cover/summerframework.jpg" />
            </div>
            <div class="home-book-list-title">
                手写Spring
            </div>
            <div class="home-book-list-desc">
                从零开发一个迷你版的Spring框架！
            </div>
        </a>
    </div>
    <!-- jerrymouse -->
    <div class="home-book-list-item">
        <a href="/books/jerrymouse/index.html" class="home-book-list-image">
            <div>
                <img src="/static/cover/jerrymouse.jpg" />
            </div>
            <div class="home-book-list-title">
                手写Tomcat
            </div>
            <div class="home-book-list-desc">
                从零开发一个迷你版的Tomcat服务器！
            </div>
        </a>
    </div>
    <!-- blockchain -->
    <div class="home-book-list-item">
        <a href="/books/blockchain/index.html" class="home-book-list-image">
            <div>
                <img src="/static/cover/blockchain.jpg" />
            </div>
            <div class="home-book-list-title">
                区块链教程
            </div>
            <div class="home-book-list-desc">
                零基础入门区块链，还可以在线写代码！
            </div>
        </a>
    </div>
    <!-- git -->
    <div class="home-book-list-item">
        <a href="/books/git/index.html" class="home-book-list-image">
            <div>
                <img src="/static/cover/git.jpg" />
            </div>
            <div class="home-book-list-title">
                Git教程
            </div>
            <div class="home-book-list-desc">
                最适合小白入门的浅显易懂的Git教程！
            </div>
        </a>
    </div>
    <!-- makefile -->
    <div class="home-book-list-item">
        <a href="/books/makefile/index.html" class="home-book-list-image">
            <div>
                <img src="/static/cover/makefile.jpg" />
            </div>
            <div class="home-book-list-title">
                Makefile教程
            </div>
            <div class="home-book-list-desc">
                入门Linux开发，从零开始编写Makefile！
            </div>
        </a>
    </div>
</div>

<h4>最新发表的博客文章：</h4>

<div id="home-blog-list" class="home-blog-list"></div>

<script>
    documentReady(async ()=>{
        const resp = await fetch('/blogs/all/index.json');
        let blogs = await resp.json();
        if (blogs.length > 20) {
            blogs = blogs.slice(0, 20);
        }
        console.log(JSON.stringify(blogs));
        const items = blogs.map(blog => {
            let date = new Date(blog.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
            return `
<div class="home-blog-list-item">
    <div><span class="text-sm font-semibold uppercase">${date}</span></div>
    <div><a href="${blog.uri}">${gitsite.encodeHtml(blog.title)}</a></div>
</div>`;
        });
        document.getElementById('home-blog-list').innerHTML = items.join('');
    });
</script>
