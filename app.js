const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
let data = { music: [], fragments: [] };
let editing = false;
const status = (msg) => { $("#editStatus").textContent = msg; };
const editableFields = () => $$(".edit-panel [data-edit]");
const defaultText = {};
$$("[data-edit]").forEach(el => defaultText[el.dataset.edit] = el.innerHTML);

async function loadData() {
  try {
    const local = localStorage.getItem("personal-universe-data");
    if (local) return JSON.parse(local);
  } catch(e) {}
  try {
    const response = await fetch("site-data.json");
    if (response.ok) return await response.json();
  } catch(e) {}
  return {music:[],fragments:[]};
}
function renderMusic() {
  const root = $("#musicList"); root.innerHTML = "";
  data.music.forEach((m, i) => {
    const card = document.createElement("article"); card.className = "music-card";
    card.innerHTML = `<div class="music-art" aria-hidden="true">♫</div><div class="music-info"><small></small><h3></h3><p class="artist"></p><p class="note"></p></div><a class="music-open" target="_blank" rel="noopener noreferrer">LINK ↗</a>`;
    $(".music-info small", card).textContent = m.tag || `SOUND / ${String(i+1).padStart(3,"0")}`;
    $(".music-info h3", card).textContent = m.title || "曲名";
    $(".artist", card).textContent = m.artist || "";
    $(".note", card).textContent = m.note || "";
    const link = $(".music-open", card); link.href = safeUrl(m.url); link.setAttribute("aria-label", `${m.title || "音楽"}を外部サイトで開く`);
    root.appendChild(card);
    if (editing) {
      const editor = document.createElement("div"); editor.className = "music-edit";
      editor.innerHTML = `<input aria-label="分類ラベル" placeholder="分類ラベル"><input aria-label="曲名" placeholder="曲名"><input aria-label="アーティスト" placeholder="アーティスト"><textarea aria-label="曲のメモ" rows="2" placeholder="曲のメモ"></textarea><input aria-label="外部リンク" placeholder="https://..."><button class="remove-item" type="button">この曲を削除</button>`;
      const inputs = $$("input,textarea", editor); [m.tag,m.title,m.artist,m.note,m.url].forEach((v,j)=>inputs[j].value=v||"");
      inputs.forEach((input,j)=>input.addEventListener("input",()=>{[ "tag","title","artist","note","url" ].forEach((key,k)=>{if(k===j)m[key]=input.value;}); renderMusicViewOnly();}));
      $(".remove-item",editor).addEventListener("click",()=>{data.music.splice(i,1);renderMusic();status("曲を削除しました。保存を忘れずに！");});
      root.appendChild(editor);
    }
  });
}
function renderMusicViewOnly(){
  const cards=$$(".music-card",$("#musicList"));
  cards.forEach((card,i)=>{const m=data.music[i];if(!m)return;$(".music-info small",card).textContent=m.tag||"";$(".music-info h3",card).textContent=m.title||"";$(".artist",card).textContent=m.artist||"";$(".note",card).textContent=m.note||"";$(".music-open",card).href=safeUrl(m.url);});
}
function renderFragments(){
  const root=$("#fragmentGrid");root.innerHTML="";
  data.fragments.forEach((f,i)=>{
    const card=document.createElement("article");card.className="fragment-card";
    const visual=document.createElement("div");visual.className="fragment-visual"+(f.image?" has-image":"");
    const sym=document.createElement("span");sym.textContent=f.symbol||"✦";visual.appendChild(sym);
    if(f.image){const img=document.createElement("img");img.className="custom-image";img.alt=f.title||"画像";img.src=safeUrl(f.image);img.onerror=()=>{img.remove();visual.classList.remove("has-image");};visual.appendChild(img);}
    const cap=document.createElement("span");cap.className="fragment-caption";cap.textContent=f.caption||"";visual.appendChild(cap);
    const title=document.createElement("h3");title.textContent=f.title||"小さな記録";
    const note=document.createElement("p");note.textContent=f.note||"";
    card.append(visual,title,note);root.appendChild(card);
    if(editing){
      const editor=document.createElement("div");editor.className="music-edit";
      editor.innerHTML=`<input placeholder="タイトル" aria-label="画像タイトル"><input placeholder="小さなラベル" aria-label="画像ラベル"><input placeholder="画像URL（https://...）" aria-label="画像URL"><textarea rows="2" placeholder="説明" aria-label="説明"></textarea><button class="remove-item" type="button">このカードを削除</button>`;
      const inputs=$$("input,textarea",editor);[f.title,f.caption,f.image,f.note].forEach((v,j)=>inputs[j].value=v||"");
      inputs.forEach((input,j)=>input.addEventListener("input",()=>{["title","caption","image","note"].forEach((key,k)=>{if(j===k)f[key]=input.value;});renderFragments();status("画像カードを更新しました。");}));
      $(".remove-item",editor).addEventListener("click",()=>{data.fragments.splice(i,1);renderFragments();status("画像カードを削除しました。");});
      root.appendChild(editor);
    }
  });
}
function safeUrl(url){try{const u=new URL(url||"#",location.href);return ["https:","http:"].includes(u.protocol)?u.href:"#";}catch(e){return "#";}}
function setInlineEditing(on){
  editing=on;document.body.classList.toggle("inline-editing",on);
  $$("[data-edit]").forEach(el=>{el.contentEditable=on?"true":"false";el.spellcheck=on;});
  renderMusic();renderFragments();
  $("#enableInline").textContent=on?"文字の直接編集を終了":"文字を直接編集";
  status(on?"ページ上の文字をタップして編集できます。":"直接編集を終了しました。保存してください。");
}
function collectData(){
  const text={};$$("[data-edit]").forEach(el=>text[el.dataset.edit]=el.innerHTML);
  return {text,music:data.music,fragments:data.fragments};
}
function applyData(payload){
  if(payload.text) Object.entries(payload.text).forEach(([key,value])=>{const el=$(`[data-edit="${CSS.escape(key)}"]`);if(el)el.innerHTML=value;});
  data.music=Array.isArray(payload.music)?payload.music:[];
  data.fragments=Array.isArray(payload.fragments)?payload.fragments:[];
  renderMusic();renderFragments();
}
function openPanel(){ $("#editPanel").hidden=false;$("#panelBackdrop").hidden=false; }
function closePanel(){ $("#editPanel").hidden=true;$("#panelBackdrop").hidden=true; }
$("#editToggle").addEventListener("click",openPanel);
$("#closeEdit").addEventListener("click",closePanel);
$("#panelBackdrop").addEventListener("click",closePanel);
$("#enableInline").addEventListener("click",()=>setInlineEditing(!editing));
$("#saveLocal").addEventListener("click",()=>{
  try{localStorage.setItem("personal-universe-data",JSON.stringify(collectData()));status("この端末のブラウザに保存しました。公開サイト全体にはまだ反映されていません。");}
  catch(e){status("保存できませんでした。データをダウンロードして保管してください。");}
});
$("#exportData").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(collectData(),null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="personal-universe-edits.json";a.click();URL.revokeObjectURL(a.href);
  status("編集データをダウンロードしました。GitHubへ反映するには、JSONの内容を site-data.json と index.html に反映してください。");
});
$("#importData").addEventListener("change",async e=>{
  const file=e.target.files[0];if(!file)return;
  try{const payload=JSON.parse(await file.text());applyData(payload);status("編集データを読み込みました。保存またはダウンロードしてください。");}
  catch(err){status("JSONを読み込めませんでした。正しい編集データか確認してください。");}
  e.target.value="";
});
$("#addMusic").addEventListener("click",()=>{data.music.push({tag:"NEW TRACK",title:"新しい曲",artist:"アーティスト名",note:"曲の感想",url:"https://"});setInlineEditing(true);$("#editPanel").hidden=false;status("曲を追加しました。内容を入力してください。");});
$("#addFragment").addEventListener("click",()=>{data.fragments.push({symbol:"✧",title:"新しい記録",caption:"FRAGMENT / NEW",note:"説明を入力",image:""});setInlineEditing(true);$("#editPanel").hidden=false;status("画像カードを追加しました。画像URLを入力できます。");});
(async()=>{
  data=await loadData();
  const saved=localStorage.getItem("personal-universe-data");
  if(saved){try{applyData(JSON.parse(saved));}catch(e){renderMusic();renderFragments();}}
  else renderMusic(),renderFragments();
})();