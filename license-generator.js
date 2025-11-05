(function() {
    const $ = (sel) => document.querySelector(sel);

    function toBase64Url(bytes) {
        let bin = '';
        const arr = new Uint8Array(bytes);
        for (let i = 0; i < arr.length; i += 1) bin += String.fromCharCode(arr[i]);
        return btoa(bin).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    }

    async function hmacSha256(secretStr, payloadBytes) {
        const enc = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw', enc.encode(secretStr), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );
        return await crypto.subtle.sign('HMAC', key, payloadBytes);
    }

    function mkPayload(duration) {
        const nowSec = Math.floor(Date.now() / 1000);
        const addDays = duration === 'year' ? 365 : 30;
        const expSec = nowSec + addDays * 24 * 60 * 60;
        return { payload: { ver: 1, issuer: 'FlashSearch', plan: 'pro', iat: nowSec, exp: expSec, dur: duration }, expSec };
    }

    function renderTokens(list) {
        const results = $('#results');
        results.innerHTML = '';
        list.forEach((item, idx) => {
            const wrap = document.createElement('div');
            wrap.className = 'token-item';

            const meta = document.createElement('div');
            meta.className = 'muted';
            meta.textContent = `#${idx + 1} • истекает ${new Date(item.expSec * 1000).toLocaleString()}`;
            wrap.appendChild(meta);

            const ta = document.createElement('textarea');
            ta.className = 'token-text';
            ta.rows = 2;
            ta.readOnly = true;
            ta.value = item.token;
            wrap.appendChild(ta);

            const actions = document.createElement('div');
            actions.className = 'inline';
            const copyBtn = document.createElement('button');
            copyBtn.className = 'secondary-button mini';
            copyBtn.textContent = 'Копировать';
            copyBtn.addEventListener('click', async () => {
                try { await navigator.clipboard.writeText(item.token); } catch {}
            });
            actions.appendChild(copyBtn);
            wrap.appendChild(actions);

            results.appendChild(wrap);
        });
    }

    function downloadCsv(list) {
        const header = 'token,duration,expISO\n';
        const rows = list.map(i => `${i.token},${i.duration},${new Date(i.expSec * 1000).toISOString()}`);
        const blob = new Blob([header + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'flashsearch-licenses.csv';
        a.click();
        URL.revokeObjectURL(a.href);
    }

    async function generate() {
        const secret = ($('#secret').value || '').trim();
        const duration = $('#duration').value;
        const count = Math.max(1, Math.min(1000, parseInt($('#count').value, 10) || 1));
        const status = $('#status');
        status.textContent = '';
        if (!secret) { status.textContent = 'Введите секрет.'; return; }

        const list = [];
        try {
            for (let i = 0; i < count; i += 1) {
                const { payload, expSec } = mkPayload(duration);
                const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
                const sig = await hmacSha256(secret, payloadBytes);
                const token = `${toBase64Url(payloadBytes)}.${toBase64Url(sig)}`;
                list.push({ token, expSec, duration });
            }
            renderTokens(list);
            // Save for export
            window.__licenseList = list;
            status.textContent = `Сгенерировано ключей: ${list.length}`;
        } catch (e) {
            status.textContent = 'Ошибка генерации. Проверьте секрет и попробуйте снова.';
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        $('#generate').addEventListener('click', generate);
        $('#exportCsv').addEventListener('click', () => {
            const list = window.__licenseList || [];
            if (list.length === 0) return;
            downloadCsv(list);
        });
    });
})();


