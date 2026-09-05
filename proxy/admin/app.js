async function api(path, opts){
  const r = await fetch(path, opts);
  const j = await r.json().catch(()=>null);
  return {ok: r.ok, status: r.status, json: j};
}

function qs(el){ return document.querySelector(el); }

// tabs
qsAll = (s)=>Array.from(document.querySelectorAll(s));
qsAll('.tab').forEach(t=>{
  t.addEventListener('click', ()=>{
    qsAll('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    const tab = t.dataset.tab;
    ['tokens','models','billing'].forEach(n=>{
      qs('#'+n).style.display = (n===tab)?'block':'none';
    });
  })
});

// tokens
async function loadTokens(){
  const wrap = qs('#tokensTableWrap');
  wrap.textContent = '加载中...';
  try{
    const r = await api('/admin/tokens');
    if(!r.ok){ wrap.textContent = '加载失败: '+JSON.stringify(r.json); return; }
    const arr = r.json || [];
    if(arr.length===0){ wrap.innerHTML = '<div class="small">没有 tokens，使用上方表单添加。</div>'; return; }
    let html = '<table><thead><tr><th>#</th><th>Token</th><th>Passkey</th><th>Email</th><th>操作</th></tr></thead><tbody>';
    arr.forEach(item=>{
      html += `<tr data-id="${item.id}"><td>${item.id}</td><td class="tk">${escapeHtml(item.token)}</td><td class="pk">${escapeHtml(item.passkey)}</td><td class="em">${escapeHtml(item.email)}</td><td class="actions">`+
              `<button data-act="edit">编辑</button><button data-act="del">删除</button></td></tr>`;
    });
    html += '</tbody></table>';
    wrap.innerHTML = html;
    // bind actions
    wrap.querySelectorAll('button[data-act="del"]').forEach(b=>{
      b.addEventListener('click', async ()=>{
        const tr = b.closest('tr');
        const id = tr.dataset.id;
        if(!confirm('确认删除 token id=' + id + ' ?')) return;
        const res = await api('/admin/token?id='+encodeURIComponent(id), {method:'DELETE'});
        if(res.ok){ loadTokens(); } else { alert('删除失败: '+JSON.stringify(res.json)); }
      })
    });
    wrap.querySelectorAll('button[data-act="edit"]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const tr = b.closest('tr');
        if(tr.classList.contains('editing')) return;
        tr.classList.add('editing');
        const tk = tr.querySelector('.tk').textContent;
        const pk = tr.querySelector('.pk').textContent;
        const em = tr.querySelector('.em').textContent;
        tr.querySelector('.tk').innerHTML = `<input value="${escapeAttr(tk)}" style="width:100%">`;
        tr.querySelector('.pk').innerHTML = `<input value="${escapeAttr(pk)}" style="width:100%">`;
        tr.querySelector('.em').innerHTML = `<input value="${escapeAttr(em)}" style="width:100%">`;
        const actionTd = tr.querySelector('.actions');
        actionTd.dataset.old = actionTd.innerHTML;
        actionTd.innerHTML = `<button data-act="save">保存</button><button data-act="cancel">取消</button>`;
        actionTd.querySelector('[data-act=save]').addEventListener('click', async ()=>{
          const newTk = tr.querySelector('.tk input').value.trim();
          const newPk = tr.querySelector('.pk input').value.trim();
          const newEm = tr.querySelector('.em input').value.trim();
          const id = tr.dataset.id;
          const res = await api('/admin/token?id='+encodeURIComponent(id), {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({token:newTk, passkey:newPk, email:newEm})});
          if(res.ok){ loadTokens(); } else { alert('更新失败: '+JSON.stringify(res.json)); }
        });
        actionTd.querySelector('[data-act=cancel]').addEventListener('click', ()=>{ loadTokens(); });
      })
    });
  }catch(e){ wrap.textContent = '请求失败: '+e.message; }
}

qs('#save').addEventListener('click', async function(){
  const token = qs('#token').value.trim();
  const passkey = qs('#passkey').value.trim();
  const email = qs('#email').value.trim();
  const resDiv = qs('#saveResult');
  resDiv.textContent = '保存中...';
  try{
    const resp = await api('/admin/add-token', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({token, passkey, email})});
    if(resp.ok){ resDiv.textContent = '保存成功'; qs('#token').value=''; qs('#passkey').value=''; qs('#email').value=''; loadTokens(); }
    else { resDiv.textContent = '错误: ' + JSON.stringify(resp.json); }
  }catch(e){ resDiv.textContent = '请求失败: ' + e.message; }
});

// models
async function loadModels(){
  const wrap = qs('#modelsTableWrap');
  wrap.textContent = '加载中...';
  try{
    const r = await api('/v1/models');
    if(!r.ok){ wrap.textContent = '加载失败'; return; }
    const data = r.json && r.json.data ? r.json.data : [];
    if(data.length===0){ wrap.textContent='(无模型)'; return; }
    let html = '<table><thead><tr><th>id</th><th>owned_by</th></tr></thead><tbody>';
    data.forEach(m=>{ html += `<tr><td>${escapeHtml(m.id)}</td><td>${escapeHtml(m.owned_by)}</td></tr>` });
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }catch(e){ wrap.textContent = '请求失败: '+e.message; }
}

// billing
async function loadBalance(){
  const wrap = qs('#balanceWrap');
  wrap.textContent = '加载中...';
  try{
    const r = await api('/v1/billing');
    if(!r.ok){ wrap.textContent = '加载失败: '+ (r.status||''); return; }
    const j = r.json || {};
    // display as table of key/value
    let html = '<table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>';
    Object.keys(j).forEach(k=>{ html += `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(String(j[k]))}</td></tr>` });
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }catch(e){ wrap.textContent = '请求失败: '+e.message; }
}

qs('#refreshModels').addEventListener('click', loadModels);
qs('#refreshBalance').addEventListener('click', loadBalance);

// helpers
function escapeHtml(s){ if(s==null) return ''; return (s+'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escapeAttr(s){ return escapeHtml(s).replace(/'/g, '&#39;'); }

// initial load
loadTokens();
loadModels();
loadBalance();
