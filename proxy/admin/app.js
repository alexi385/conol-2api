document.getElementById('save').addEventListener('click', async function(){
  const token = document.getElementById('token').value.trim();
  const passkey = document.getElementById('passkey').value.trim();
  const email = document.getElementById('email').value.trim();
  const resDiv = document.getElementById('saveResult');
  resDiv.textContent = '保存中...';
  try{
    const resp = await fetch('/admin/add-token', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({token, passkey, email})
    });
    const j = await resp.json();
    if(resp.status === 200){
      resDiv.textContent = '保存成功: ' + (j.email || JSON.stringify(j));
    } else {
      resDiv.textContent = '错误: ' + JSON.stringify(j);
    }
  }catch(e){
    resDiv.textContent = '请求失败: ' + e.message;
  }
});

document.getElementById('refreshModels').addEventListener('click', async function(){
  const el = document.getElementById('models');
  el.textContent = '加载中...';
  try{
    const r = await fetch('/v1/models');
    const j = await r.json();
    el.textContent = JSON.stringify(j, null, 2);
  }catch(e){
    el.textContent = '请求失败: '+e.message;
  }
});

document.getElementById('refreshBalance').addEventListener('click', async function(){
  const el = document.getElementById('balance');
  el.textContent = '加载中...';
  try{
    const r = await fetch('/v1/billing');
    const j = await r.json();
    el.textContent = JSON.stringify(j, null, 2);
  }catch(e){
    el.textContent = '请求失败: '+e.message;
  }
});

// 自动加载一次
document.getElementById('refreshModels').click();
document.getElementById('refreshBalance').click();
