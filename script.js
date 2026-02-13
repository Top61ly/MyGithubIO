document.addEventListener('DOMContentLoaded', function() {
    let articles = [];
    let currentPage = 1;
    const perPage = CONFIG.articles.perPage;

    // 初始化页面
    init();

    function init() {
        renderProfile();
        fetchArticles();
    }

    // 渲染作者信息
    function renderProfile() {
        const { author, social } = CONFIG;

        // 头像
        const avatarImg = document.getElementById('avatarImg');
        if (author.avatar) {
            avatarImg.src = author.avatar;
        } else {
            // 使用 GitHub 默认头像
            avatarImg.src = `https://github.com/${CONFIG.github.username}.png`;
        }

        // 名称和简介
        document.getElementById('authorName').textContent = author.name;
        document.getElementById('authorBio').textContent = author.bio;

        // 社交链接
        const socialLinksContainer = document.getElementById('socialLinks');
        let socialHtml = '';

        if (social.github) {
            socialHtml += `<a href="${social.github}" target="_blank" class="social-link">GitHub</a>`;
        }
        if (social.email) {
            socialHtml += `<a href="${social.email}" target="_blank" class="social-link">Email</a>`;
        }
        if (social.twitter) {
            socialHtml += `<a href="${social.twitter}" target="_blank" class="social-link">Twitter</a>`;
        }

        socialLinksContainer.innerHTML = socialHtml;

        // 联系信息
        const contactInfoContainer = document.getElementById('contactInfo');
        let contactHtml = '';

        if (author.location) {
            contactHtml += `<div class="contact-item">📍 ${author.location}</div>`;
        }
        if (author.email) {
            const email = author.email.replace('mailto:', '');
            contactHtml += `<div class="contact-item">✉️ ${email}</div>`;
        }

        contactInfoContainer.innerHTML = contactHtml;

        // 更新页面标题
        document.title = `${author.name} - 个人主页`;
    }

    // 获取 GitHub 仓库中的文章
    async function fetchArticles() {
        try {
            const { username, repo, branch } = CONFIG.github;
            const articlesPath = CONFIG.articles.path;

            // 使用 GitHub API 获取仓库内容
            const apiUrl = `https://api.github.com/repos/${username}/${repo}/contents/${articlesPath}?ref=${branch}`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(apiUrl, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 404) {
                    // 目录不存在，显示空状态
                    showEmptyState('暂无文章');
                    return;
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            articles = Array.isArray(data) ? data.filter(item => item.name.endsWith('.md')) : [];

            if (articles.length === 0) {
                showEmptyState('暂无文章');
                return;
            }

            // 按更新时间排序
            articles.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

            renderArticles();
        } catch (error) {
            console.error('获取文章失败:', error);
            showErrorState(error.message);
        }
    }

    // 渲染文章列表
    function renderArticles() {
        const container = document.getElementById('articlesList');
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        const pageArticles = articles.slice(start, end);

        let html = '';

        pageArticles.forEach(article => {
            const title = article.name.replace('.md', '');
            const date = new Date(article.updated_at).toLocaleDateString('zh-CN');

            html += `
                <div class="article-item">
                    <h3>
                        <a href="${article.html_url}" target="_blank">${title}</a>
                    </h3>
                    <p class="article-meta">更新于 ${date}</p>
                    <p class="article-description">点击查看文章内容</p>
                </div>
            `;
        });

        container.innerHTML = html;

        // 更新文章数量
        document.getElementById('articleCount').textContent = `${articles.length} 篇`;

        // 渲染分页
        renderPagination();
    }

    // 渲染分页
    function renderPagination() {
        const totalPages = Math.ceil(articles.length / perPage);
        const container = document.getElementById('pagination');

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';

        // 上一页
        html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">上一页</button>`;

        // 页码
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += `<span style="color: #444;">...</span>`;
            }
        }

        // 下一页
        html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">下一页</button>`;

        container.innerHTML = html;
    }

    // 跳转到指定页
    window.goToPage = function(page) {
        currentPage = page;
        renderArticles();
        // 滚动到顶部
        document.querySelector('.content').scrollIntoView({ behavior: 'smooth' });
    };

    // 显示空状态
    function showEmptyState(message) {
        document.getElementById('articlesList').innerHTML = `
            <div class="empty-state">
                <p>${message}</p>
            </div>
        `;
        document.getElementById('articleCount').textContent = '0 篇';
    }

    // 显示错误状态
    function showErrorState(message) {
        document.getElementById('articlesList').innerHTML = `
            <div class="error-state">
                <p class="error-title">加载失败</p>
                <p class="error-message">${message}</p>
            </div>
        `;
    }
});
