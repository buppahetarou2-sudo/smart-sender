document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const views = {
        home: document.getElementById('view-home'),
        templates: document.getElementById('view-templates'),
        history: document.getElementById('view-history'),
        settings: document.getElementById('view-settings')
    };
    const navBtns = {
        home: document.getElementById('nav-home'),
        templates: document.getElementById('nav-templates'),
        history: document.getElementById('nav-history'),
        settings: document.getElementById('nav-settings')
    };

    // Home view
    const tmplSelect = document.getElementById('template-select');
    const autoDateToggle = document.getElementById('auto-date-toggle');
    const subjectSelect = document.getElementById('subject-select');
    const msgSubject = document.getElementById('message-subject');
    const msgBody = document.getElementById('message-body');
    const btnSend = document.getElementById('btn-send');
    const sendToLine = document.getElementById('send-to-line');
    const sendToEmail = document.getElementById('send-to-email');
    const sendStatus = document.getElementById('send-status');

    // Templates view
    const tmplTitle = document.getElementById('tmpl-title');
    const tmplBody = document.getElementById('tmpl-body');
    const btnSaveTmpl = document.getElementById('btn-save-tmpl');
    const templateList = document.getElementById('template-list');

    // History view
    const historyList = document.getElementById('history-list');
    const btnClearHistory = document.getElementById('btn-clear-history');

    // Settings view
    const setYahooEmail = document.getElementById('set-yahoo-email');
    const setYahooPassword = document.getElementById('set-yahoo-password');
    const setLineToken = document.getElementById('set-line-token');
    const newDestEmail = document.getElementById('new-dest-email');
    const btnAddEmail = document.getElementById('btn-add-email');
    const destEmailList = document.getElementById('dest-email-list');
    const settingsStatus = document.getElementById('settings-status');

    // === State ===
    let templates = JSON.parse(localStorage.getItem('smart_templates')) || [];
    let historyData = JSON.parse(localStorage.getItem('smart_history')) || [];
    let settings = JSON.parse(localStorage.getItem('smart_settings')) || {
        yahooEmail: '',
        yahooPassword: '',
        lineToken: '',
        destEmails: []
    };
    let currentEditingTmplId = null;

    // === Navigation Logic ===
    const switchView = (viewName) => {
        Object.values(views).forEach(v => v.classList.remove('active-view'));
        Object.values(navBtns).forEach(b => b.classList.remove('active'));
        
        views[viewName].classList.add('active-view');
        navBtns[viewName].classList.add('active');
        
        if(viewName === 'home') renderTemplateDropdown();
    };

    navBtns.home.addEventListener('click', () => switchView('home'));
    navBtns.templates.addEventListener('click', () => switchView('templates'));
    navBtns.history.addEventListener('click', () => switchView('history'));
    navBtns.settings.addEventListener('click', () => switchView('settings'));

    // === Subject Logic ===
    subjectSelect.addEventListener('change', (e) => {
        if(e.target.value === 'custom') {
            msgSubject.classList.remove('hidden');
            msgSubject.value = '';
            msgSubject.focus();
        } else {
            msgSubject.classList.add('hidden');
            msgSubject.value = e.target.value;
        }
    });

    // === Date Logic ===
    const getNextDayString = () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        const month = tomorrow.getMonth() + 1;
        const date = tomorrow.getDate();
        const day = days[tomorrow.getDay()];
        
        return `${month}月${date}日（${day}）`;
    };

    const applyTemplateToEditor = () => {
        const selectedId = tmplSelect.value;
        let text = "";
        
        if (selectedId) {
            const tmpl = templates.find(t => t.id === selectedId);
            if (tmpl) text = tmpl.body;
        }

        if (autoDateToggle.checked) {
            const dateStr = getNextDayString();
            text = `${dateStr}\n\n${text}`;
        }
        
        msgBody.value = text;
    };

    tmplSelect.addEventListener('change', applyTemplateToEditor);
    autoDateToggle.addEventListener('change', applyTemplateToEditor);

    // === Settings Logic ===
    const loadSettings = () => {
        setYahooEmail.value = settings.yahooEmail;
        setYahooPassword.value = settings.yahooPassword;
        setLineToken.value = settings.lineToken;
        renderDestEmails();
    };

    const autoSaveSettings = () => {
        settings.yahooEmail = setYahooEmail.value.trim();
        settings.yahooPassword = setYahooPassword.value.trim();
        settings.lineToken = setLineToken.value.trim();
        localStorage.setItem('smart_settings', JSON.stringify(settings));
        
        settingsStatus.textContent = '自動保存しました';
        settingsStatus.className = 'status-msg status-success';
        setTimeout(() => settingsStatus.textContent = '', 2000);
    };

    setYahooEmail.addEventListener('input', autoSaveSettings);
    setYahooPassword.addEventListener('input', autoSaveSettings);
    setLineToken.addEventListener('input', autoSaveSettings);

    const renderDestEmails = () => {
        destEmailList.innerHTML = '';
        settings.destEmails.forEach((email, idx) => {
            const li = document.createElement('li');
            li.className = 'list-item';
            li.innerHTML = `
                <span class="list-item-title">${email}</span>
                <button class="btn-delete" data-idx="${idx}">削除</button>
            `;
            destEmailList.appendChild(li);
        });
        
        document.querySelectorAll('#dest-email-list .btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-idx'));
                settings.destEmails.splice(idx, 1);
                autoSaveSettings();
                renderDestEmails();
            });
        });
    };

    btnAddEmail.addEventListener('click', () => {
        const val = newDestEmail.value.trim();
        if(val && val.includes('@') && !settings.destEmails.includes(val)) {
            settings.destEmails.push(val);
            newDestEmail.value = '';
            autoSaveSettings();
            renderDestEmails();
        }
    });

    // === Template Logic ===
    const renderTemplates = () => {
        templateList.innerHTML = '';
        templates.forEach(t => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <span class="list-item-title">${t.title}</span>
                <div>
                    <button class="btn-edit" data-id="${t.id}">編集</button>
                    <button class="btn-delete" data-id="${t.id}">削除</button>
                </div>
            `;
            templateList.appendChild(div);
        });

        document.querySelectorAll('#template-list .btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const t = templates.find(x => x.id === id);
                if(t) {
                    tmplTitle.value = t.title;
                    tmplBody.value = t.body;
                    currentEditingTmplId = id;
                    btnSaveTmpl.textContent = '更新する';
                }
            });
        });

        document.querySelectorAll('#template-list .btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                if(confirm('本当に削除しますか？')) {
                    templates = templates.filter(x => x.id !== id);
                    saveTemplates();
                }
            });
        });
    };

    const renderTemplateDropdown = () => {
        const currentVal = tmplSelect.value;
        tmplSelect.innerHTML = '<option value="">-- 選択してください --</option>';
        templates.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.title;
            tmplSelect.appendChild(opt);
        });
        if (templates.find(t => t.id === currentVal)) {
            tmplSelect.value = currentVal;
        }
    };

    const saveTemplates = () => {
        localStorage.setItem('smart_templates', JSON.stringify(templates));
        renderTemplates();
        renderTemplateDropdown();
    };

    btnSaveTmpl.addEventListener('click', () => {
        const title = tmplTitle.value.trim();
        const body = tmplBody.value.trim();
        if(!title || !body) {
            alert('タイトルと本文を入力してください。');
            return;
        }

        if(currentEditingTmplId) {
            const idx = templates.findIndex(t => t.id === currentEditingTmplId);
            if(idx !== -1) {
                templates[idx].title = title;
                templates[idx].body = body;
            }
            currentEditingTmplId = null;
            btnSaveTmpl.textContent = '保存する';
        } else {
            templates.push({
                id: 'tmpl_' + Date.now(),
                title: title,
                body: body
            });
        }
        
        tmplTitle.value = '';
        tmplBody.value = '';
        saveTemplates();
    });

    // === Sending Logic ===
    btnSend.addEventListener('click', async () => {
        const message = msgBody.value.trim();
        const subject = msgSubject.value.trim() || '連絡事項';

        if(!message) {
            alert('メッセージ本文が空です。');
            return;
        }

        const isLine = sendToLine.checked;
        const isEmail = sendToEmail.checked;

        if(!isLine && !isEmail) {
            alert('送信先（LINE/メール）を選択してください。');
            return;
        }

        // Show loading
        btnSend.disabled = true;
        btnSend.querySelector('.btn-text').classList.add('hidden');
        btnSend.querySelector('.loader').classList.remove('hidden');
        sendStatus.textContent = '送信中...';
        sendStatus.className = 'status-msg';

        try {
            const res = await fetch('/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: subject,
                    message: message,
                    destinations: settings.destEmails,
                    email_config: {
                        email: settings.yahooEmail,
                        password: settings.yahooPassword
                    },
                    line_token: settings.lineToken,
                    send_line: isLine,
                    send_email: isEmail
                })
            });

            const data = await res.json();
            
            let resultText = "送信完了！\n";
            if(isEmail) resultText += `メール: ${data.email === 'success' ? '成功' : '失敗 ('+data.email+')'}\n`;
            if(isLine) resultText += `LINE: ${data.line === 'success' ? '成功' : '失敗 ('+data.line+')'}`;

            sendStatus.textContent = resultText;
            sendStatus.className = `status-msg ${data.email === 'success' || data.line === 'success' ? 'status-success' : 'status-error'}`;
            sendStatus.style.whiteSpace = 'pre-line';
            
            // Save to history
            if(data.email === 'success' || data.line === 'success') {
                saveToHistory(message);
            }
            
        } catch(e) {
            sendStatus.textContent = '通信エラーが発生しました。';
            sendStatus.className = 'status-msg status-error';
        } finally {
            btnSend.disabled = false;
            btnSend.querySelector('.btn-text').classList.remove('hidden');
            btnSend.querySelector('.loader').classList.add('hidden');
        }
    });

    // === History Logic ===
    const renderHistory = () => {
        historyList.innerHTML = '';
        if(historyData.length === 0) {
            historyList.innerHTML = '<p style="text-align:center; color:var(--text-secondary); font-size:0.9rem;">送信履歴はありません</p>';
            return;
        }

        // Show newest at the bottom (LINE style)
        historyData.forEach((item) => {
            const wrap = document.createElement('div');
            wrap.className = 'history-bubble-wrap';
            
            const timeStr = new Date(item.timestamp).toLocaleString('ja-JP', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            wrap.innerHTML = `
                <div class="history-time">${timeStr}</div>
                <div class="history-bubble">
                    ${escapeHTML(item.message)}
                    <div class="history-meta">
                        <span>送信済</span>
                        <button class="btn-copy" data-msg="${escapeHTMLAttribute(item.message)}">コピー</button>
                    </div>
                </div>
            `;
            historyList.appendChild(wrap);
        });

        // Scroll to bottom
        historyList.scrollTop = historyList.scrollHeight;

        // Attach copy events
        document.querySelectorAll('.btn-copy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const text = e.target.getAttribute('data-msg');
                navigator.clipboard.writeText(text).then(() => {
                    const originalText = e.target.textContent;
                    e.target.textContent = 'コピー完了';
                    setTimeout(() => e.target.textContent = originalText, 2000);
                });
            });
        });
    };

    const saveToHistory = (message) => {
        historyData.push({
            timestamp: Date.now(),
            message: message
        });
        // Keep only last 100 items
        if(historyData.length > 100) historyData = historyData.slice(-100);
        localStorage.setItem('smart_history', JSON.stringify(historyData));
        renderHistory();
    };

    btnClearHistory.addEventListener('click', () => {
        if(confirm('送信履歴をすべて消去しますか？')) {
            historyData = [];
            localStorage.setItem('smart_history', JSON.stringify(historyData));
            renderHistory();
        }
    });

    const escapeHTML = (str) => {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    };

    const escapeHTMLAttribute = (str) => {
        return str.replace(/"/g, '&quot;');
    };

    // === Initialization ===
    loadSettings();
    renderTemplates();
    renderTemplateDropdown();
    renderHistory();
    
    // Auto insert date on initial load
    applyTemplateToEditor();
});
