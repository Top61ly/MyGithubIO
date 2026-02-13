document.addEventListener('DOMContentLoaded', function() {
    let dailyUpdates = [];
    let currentFilter = 'all';
    const API_URL = 'https://www.jendrikillner.com/article_database/';

    // 从网页动态获取数据
    async function fetchUpdates() {
        showLoadingState();

        // 尝试从API获取数据
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(API_URL, {
                signal: controller.signal,
                mode: 'cors'
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const html = await response.text();
            parseAndExtractUpdates(html);
            renderUpdates();
        } catch (error) {
            console.error('获取数据失败:', error);
            const errorMessage = getErrorMessage(error);
            showErrorState(errorMessage);
        }
    }

    // 获取错误详细信息
    function getErrorMessage(error) {
        if (error.name === 'AbortError') {
            return '请求超时 - 服务器响应时间过长';
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            return '网络错误 - 无法连接到数据源，请检查网络连接';
        }
        if (error.message.includes('CORS') || error.message.includes('Cross-Origin')) {
            return '跨域错误 - 数据源不支持跨域访问';
        }
        if (error.message.includes('HTTP')) {
            return `服务器错误 - ${error.message}`;
        }
        return `未知错误 - ${error.message}`;
    }

    // 显示错误状态
    function showErrorState(message) {
        const listContainer = document.getElementById('updatesList');
        listContainer.innerHTML = `
            <div class="error-state">
                <p class="error-title">⚠️ 数据加载失败</p>
                <p class="error-message">${message}</p>
                <p class="error-hint">将使用备用数据继续显示</p>
            </div>
        `;
        loadFallbackUpdates();
        renderUpdates();
    }

    // 解析HTML提取更新
    function parseAndExtractUpdates(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // 查找所有链接和标题
        const allLinks = doc.querySelectorAll('a');
        const updates = [];
        const seen = new Set();
        
        allLinks.forEach((link, index) => {
            const text = link.textContent.trim();
            const href = link.getAttribute('href') || '';
            
            // 避免重复
            if (text && text.length > 5 && !seen.has(text) && index < 50) {
                seen.add(text);
                
                const update = {
                    type: classifyContent(text, href),
                    title: cleanTitle(text),
                    description: extractDescription(text),
                    source: extractSource(href),
                    url: href
                };
                
                if (update.title.length > 0) {
                    updates.push(update);
                }
            }
        });
        
        dailyUpdates = updates.length > 5 ? updates.slice(0, 20) : loadFallbackUpdates();
    }

    // 分类内容
    function classifyContent(text, url) {
        const lower = text.toLowerCase();
        if (lower.includes('video') || lower.includes('youtube')) return 'video';
        if (lower.includes('github') || lower.includes('sample') || lower.includes('project')) return 'tool';
        return 'article';
    }

    // 清理标题
    function cleanTitle(text) {
        return text.replace(/\[video\]|\[article\]|\[tool\]/gi, '').trim();
    }

    // 提取描述
    function extractDescription(text) {
        text = cleanTitle(text);
        if (text.length > 80) {
            return text.substring(0, 80) + '...';
        }
        return text;
    }

    // 提取来源
    function extractSource(url) {
        try {
            if (!url || url === '') return '图形编程周刊';
            if (url.startsWith('http')) {
                return new URL(url).hostname.replace('www.', '');
            }
            return '图形编程周刊';
        } catch {
            return '图形编程周刊';
        }
    }

    // 加载备用数据
    function loadFallbackUpdates() {
        dailyUpdates = [
            {
                type: 'video',
                title: 'Complex numbers are multivectors | Geometric algebra episode 4',
                description: '几何代数系列教程 - 复数作为多向量的理解',
                source: 'YouTube',
                url: 'https://www.youtube.com/watch?v=K1Je3k8ektk'
            },
            {
                type: 'video',
                title: 'Simple Terrain Auto Material - Terrain Shaders - Episode 14',
                description: '地形着色器系列 - 简单地形自动材质实现',
                source: 'YouTube',
                url: 'https://www.youtube.com/watch?v=CGTPW2mWeGQ'
            },
            {
                type: 'article',
                title: 'Gyms, Zoos, and Museums: Your documentation should be in-game',
                description: '关于游戏内文档的设计与实现的深度讨论',
                source: 'rystorm.com',
                url: 'https://rystorm.com/blog/gyms-zoos-museums-your-documentation-should-be-in-game'
            },
            {
                type: 'tool',
                title: 'Vulkan Ecosystem and SDK Survey - February 2026',
                description: '2026年2月Vulkan生态和SDK调查问卷',
                source: 'surveymonkey.com',
                url: 'https://www.surveymonkey.com/r/LRFD7V6'
            },
            {
                type: 'article',
                title: 'Surfel-based global illumination on the web',
                description: '在Web上实现基于Surfel的全局照明技术',
                source: 'juretriglav.si',
                url: 'https://juretriglav.si/surfel-based-global-illumination-on-the-web/'
            },
            {
                type: 'article',
                title: 'Mastering GFXReconstruct: Part 4',
                description: 'GFXReconstruct工具使用指南第四部分',
                source: 'lunarg.com',
                url: 'https://www.lunarg.com/mastering-gfxreconstruct-part-4/'
            },
            {
                type: 'video',
                title: 'Learn to Read + Edit HLSL in 40 min',
                description: '40分钟快速学习HLSL读写与编辑技能',
                source: 'YouTube',
                url: 'https://www.youtube.com/watch?v=rd2glMlHwYI'
            },
            {
                type: 'article',
                title: 'Thoughts on No Graphics API',
                description: '关于无图形API设计的思考与探讨',
                source: 'corsix.org',
                url: 'https://www.corsix.org/content/thoughts-on-no-graphics-api'
            },
            {
                type: 'video',
                title: 'SIGGRAPH 2025 Advances in Real-Time Rendering in Games',
                description: 'SIGGRAPH 2025 - 实时渲染最新进展展示',
                source: 'YouTube',
                url: 'https://www.youtube.com/watch?v=VTrdeqMMMK0'
            },
            {
                type: 'video',
                title: 'Getting started with BGFX',
                description: 'BGFX图形库入门教程系列',
                source: 'YouTube',
                url: 'https://www.youtube.com/playlist?list=PLwFtWV3PS6y_oTOfHjbE0Zk8N9_QuQlHy'
            }
        ];
        return dailyUpdates;
    }

    // 显示加载状态
    function showLoadingState() {
        const listContainer = document.getElementById('updatesList');
        listContainer.innerHTML = `
            <div class="loading">
                <p>⏳ 正在从图形编程周刊加载最新内容...</p>
                <div class="spinner"></div>
            </div>
        `;
    }

    // 渲染更新列表
    function renderUpdates(filter = 'all') {
        const listContainer = document.getElementById('updatesList');
        listContainer.innerHTML = '';

        if (dailyUpdates.length === 0) {
            listContainer.innerHTML = '<div class="loading">暂无数据</div>';
            return;
        }

        const filtered = filter === 'all' 
            ? dailyUpdates 
            : dailyUpdates.filter(item => item.type === filter);

        filtered.forEach((update, index) => {
            const updateEl = document.createElement('div');
            updateEl.className = `update-item ${update.type}`;
            updateEl.innerHTML = `
                <div class="update-category ${update.type}">${getTypeLabel(update.type)}</div>
                <h3>${index + 1}. ${update.title}</h3>
                <p class="update-description">${update.description}</p>
                <p class="update-meta">📍 来源: ${update.source}</p>
                ${update.url ? `<a href="${update.url}" target="_blank" class="update-link">查看原文 →</a>` : ''}
            `;
            listContainer.appendChild(updateEl);
        });

        updateStats(filter);
    }

    // 获取类型标签
    function getTypeLabel(type) {
        const labels = {
            'video': '🎬 视频',
            'article': '📄 文章',
            'tool': '🛠️ 工具'
        };
        return labels[type] || type;
    }

    // 更新统计信息
    function updateStats(filter) {
        const statsEl = document.getElementById('statsInfo');
        const filtered = filter === 'all' 
            ? dailyUpdates 
            : dailyUpdates.filter(item => item.type === filter);
        
        const total = dailyUpdates.length;
        const count = filtered.length;
        const timestamp = new Date().toLocaleString('zh-CN');
        statsEl.textContent = `📈 正在显示 ${count} 项，共 ${total} 项 | ⏰ 更新时间: ${timestamp}`;
    }

    // 绑定过滤按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderUpdates(currentFilter);
        });
    });

    // 初始化 - 动态获取数据
    fetchUpdates();
});
