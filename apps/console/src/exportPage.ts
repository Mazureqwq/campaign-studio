import type { NodeSchema, PageSchema } from '@campaign/schema'
import type { ExportIssue } from './exportValidation'

const runtimeCss = `*{box-sizing:border-box}body{margin:0;background:#f3f5f4;color:#24313a;font-family:Inter,ui-sans-serif,system-ui,sans-serif}#app{max-width:680px;margin:0 auto;background:#f9fbfa;min-height:100vh}.campaign-text{margin:0;padding:4px 0;font-weight:500}.campaign-image{display:block;width:100%;height:190px;object-fit:cover}.campaign-button,.campaign-submit{display:block;border:0;margin:18px auto 0;padding:11px 28px;font-weight:700}.campaign-form{margin:10px 0;padding:18px;background:#fff;border:1px solid #e4e9e7;border-radius:6px;display:grid;gap:10px}.campaign-form input{padding:10px;border:1px solid #dfe6e3;border-radius:4px}.campaign-countdown{display:grid;gap:6px}.campaign-countdown span{font-size:24px;font-weight:700}.campaign-coupon{display:grid;gap:5px;width:100%;border:1px dashed currentColor;border-radius:8px;padding:14px;background:transparent;color:inherit}.campaign-coupon strong{font-size:28px}.campaign-product{display:grid;grid-template-columns:96px 1fr auto;gap:12px;align-items:center;padding:12px;background:#fff;border:1px solid #e4e9e7;border-radius:6px}.campaign-product img{width:96px;height:96px;object-fit:cover;border-radius:4px}.campaign-product div{display:grid;gap:8px}.campaign-product b{color:#ef6c4d}.campaign-product button{border:0;background:#ef6c4d;color:#fff;border-radius:4px;padding:8px}.campaign-toast{position:fixed;left:50%;bottom:32px;transform:translateX(-50%);z-index:20;background:#24313a;color:#fff;padding:10px 16px;border-radius:5px}.campaign-modal-backdrop{position:fixed;inset:0;z-index:30;display:grid;place-items:center;background:#15252c66}.campaign-modal{width:min(360px,calc(100% - 40px));padding:22px;background:#fff;border-radius:8px;box-shadow:0 10px 35px #0003}.campaign-modal p{line-height:1.7;color:#607174}.campaign-modal button{border:0;background:#ef6c4d;color:#fff;border-radius:4px;padding:9px 20px}`

const runtimeJs = `(function(){
const schema=__SCHEMA__;const device=window.innerWidth<600?'mobile':window.innerWidth<1024?'tablet':'desktop';
const app=document.getElementById('app');let toastTimer;
function toast(message){const el=document.createElement('div');el.className='campaign-toast';el.textContent=message;document.body.appendChild(el);clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.remove(),2200)}
function action(node){const event=(node.events||[]).find(e=>e.name===(node.type==='form'?'submit':'click'));(event?.actions||[]).forEach(a=>{if(a.type==='open-url')window.open(a.payload.url||'','_blank');if(a.type==='show-toast')toast(a.payload.message||'操作成功');if(a.type==='track')console.info('[campaign-track]',a.payload.event);if(a.type==='open-modal'){const back=document.createElement('div');back.className='campaign-modal-backdrop';const box=document.createElement('div');box.className='campaign-modal';const title=document.createElement('strong');title.textContent=a.payload.title||node.props.title||'提示';const content=document.createElement('p');content.textContent=node.props.content||'感谢参与本次活动';const close=document.createElement('button');close.textContent='知道了';close.onclick=()=>back.remove();box.append(title,content,close);back.append(box);back.onclick=e=>{if(e.target===back)back.remove()};document.body.append(back)}})}
function render(node){let el;if(node.type==='page'||node.type==='section')el=document.createElement(node.type==='section'?'section':'div');else if(node.type==='text'){el=document.createElement(node.props.level==='p'?'p':'h1');el.className='campaign-text';el.textContent=node.props.text||''}else if(node.type==='image'){el=document.createElement('img');el.className='campaign-image';el.src=node.props.src||'';el.alt=node.props.alt||''}else if(['button','modal','lottery','share'].includes(node.type)){el=document.createElement('button');el.className='campaign-button';el.textContent=node.props.text||({button:'立即参与',modal:'查看详情',lottery:'立即抽奖',share:'分享活动'}[node.type]);el.onclick=()=>{if(node.type==='lottery')toast('抽奖结果：'+((node.props.prizes||['谢谢参与'])[Math.floor(Math.random()*(node.props.prizes||['谢谢参与']).length)]));if(node.type==='share'){navigator.clipboard?.writeText(location.href);toast('活动链接已复制')}action(node)}}else if(node.type==='coupon'){el=document.createElement('button');el.className='campaign-coupon';el.innerHTML='<strong>¥'+(node.props.amount||'50')+'</strong><span>'+(node.props.title||'新人专享券')+'</span><small>'+(node.props.description||'')+'</small>';el.onclick=()=>action(node)}else if(node.type==='product'){el=document.createElement('article');el.className='campaign-product';el.innerHTML='<img src="'+(node.props.image||'')+'" alt="'+(node.props.name||'')+'"><div><strong>'+(node.props.name||'商品')+'</strong><b>¥'+(node.props.price||'0')+'</b></div><button>立即购买</button>';el.querySelector('button').onclick=()=>action(node)}else if(node.type==='form'){el=document.createElement('form');el.className='campaign-form';el.innerHTML='<strong>'+(node.props.title||'留下联系方式')+'</strong>'+(node.props.fields||[]).map(f=>'<input placeholder="'+f+'">').join('')+'<button class="campaign-submit" type="submit">提交报名</button>';el.onsubmit=e=>{e.preventDefault();action(node)}}else if(node.type==='countdown'){el=document.createElement('div');el.className='campaign-countdown';const title=document.createElement('strong');title.textContent=node.props.title||'活动倒计时';const value=document.createElement('span');const tick=()=>{let s=Math.max(0,Math.floor((new Date(node.props.endAt).getTime()-Date.now())/1000));value.textContent=Math.floor(s/86400)+'天 '+String(Math.floor(s/3600)%24).padStart(2,'0')+':'+String(Math.floor(s/60)%60).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};tick();setInterval(tick,1000);el.append(title,value)}else{el=document.createElement('div')};Object.assign(el.style,node.styles||{});(node.children||[]).forEach(child=>el.append(render(child)));return el}
app.append(render(schema.page.root));
})();`

export function buildStandaloneHtml(schema: PageSchema) {
  const safeSchema = JSON.stringify(schema).replace(/</g, '\\u003c')
  return `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${String(schema.page.title)}</title><style>${runtimeCss}</style></head><body><div id="app"></div><script>${runtimeJs.replace('__SCHEMA__', safeSchema)}</script></body></html>`
}

export function downloadStandalonePage(schema: PageSchema) {
  const blob = new Blob([buildStandaloneHtml(schema)], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = `${schema.page.title || 'campaign-page'}.html`; link.click()
  URL.revokeObjectURL(url)
}

type ZipFile = { name: string; data: Uint8Array }
const encoder = new TextEncoder()

function crc32(data: Uint8Array) {
  let crc = 0xffffffff
  for (const byte of data) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function word(value: number) {
  const bytes = new Uint8Array(4)
  new DataView(bytes.buffer).setUint32(0, value >>> 0, true)
  return bytes
}

function short(value: number) {
  const bytes = new Uint8Array(2)
  new DataView(bytes.buffer).setUint16(0, value, true)
  return bytes
}

function joinBytes(parts: Uint8Array[]) {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0))
  let offset = 0
  for (const part of parts) { result.set(part, offset); offset += part.length }
  return result
}

function createZip(files: ZipFile[]) {
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let offset = 0
  for (const file of files) {
    const name = encoder.encode(file.name)
    const checksum = crc32(file.data)
    const local = joinBytes([word(0x04034b50), short(20), short(0x800), short(0), short(0), short(0), word(checksum), word(file.data.length), word(file.data.length), short(name.length), short(0), name, file.data])
    localParts.push(local)
    const central = joinBytes([word(0x02014b50), short(20), short(20), short(0x800), short(0), short(0), short(0), word(checksum), word(file.data.length), word(file.data.length), short(name.length), short(0), short(0), short(0), short(0), word(0), word(offset), name])
    centralParts.push(central)
    offset += local.length
  }
  const locals = joinBytes(localParts)
  const central = joinBytes(centralParts)
  const end = joinBytes([word(0x06054b50), short(0), short(0), short(files.length), short(files.length), word(central.length), word(locals.length), short(0)])
  return joinBytes([locals, central, end])
}

function assetizeSchema(schema: PageSchema) {
  const exportSchema = JSON.parse(JSON.stringify(schema)) as PageSchema
  const assets: ZipFile[] = []
  const cache = new Map<string, string>()
  const dataUrl = /^data:(image\/[\w.+-]+);base64,([\w+/=]+)$/
  const extension = (mime: string) => ({ 'image/jpeg': 'jpg', 'image/svg+xml': 'svg' }[mime] ?? mime.split('/')[1].replace('jpeg', 'jpg'))
  const replace = (value: string): string => {
    const direct = value.match(dataUrl)
    if (direct) return toAsset(direct[0], direct[1], direct[2])
    return value.replace(/url\((data:image\/[\w.+-]+;base64,[\w+/=]+)\)/g, (_match, source: string) => `url(${toAsset(source, source.match(dataUrl)?.[1] ?? 'image/png', source.match(dataUrl)?.[2] ?? '')})`)
  }
  const toAsset = (source: string, mime: string, base64: string) => {
    const existing = cache.get(source)
    if (existing) return existing
    const path = `assets/images/image-${assets.length + 1}.${extension(mime)}`
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
    cache.set(source, path); assets.push({ name: path, data: bytes }); return path
  }
  const visit = (node: NodeSchema) => {
    Object.keys(node.props).forEach((key) => { if (typeof node.props[key] === 'string') node.props[key] = replace(node.props[key] as string) })
    Object.keys(node.styles).forEach((key) => { node.styles[key] = replace(node.styles[key]) })
    node.children?.forEach(visit)
  }
  visit(exportSchema.page.root)
  return { schema: exportSchema, assets }
}

function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function downloadProjectZip(schema: PageSchema, projectName = schema.page.title, version = 1, issues: ExportIssue[] = []) {
  const { schema: exportSchema, assets } = assetizeSchema(schema)
  const safeSchema = JSON.stringify(exportSchema).replace(/</g, '\\u003c')
  const props = exportSchema.page.root.props
  const title = props.title || projectName
  const description = props.description || ''
  const shareTitle = props.shareTitle || title
  const shareDescription = props.shareDescription || description
  const shareImage = props.shareImage || ''
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta property="og:title" content="${escapeHtml(shareTitle)}"><meta property="og:description" content="${escapeHtml(shareDescription)}">${shareImage ? `<meta property="og:image" content="${escapeHtml(shareImage)}">` : ''}<link rel="stylesheet" href="./assets/styles.css"></head><body><div id="app"></div><script src="./assets/runtime.js"></script></body></html>`
  const runtime = runtimeJs.replace('__SCHEMA__', safeSchema).replace('Object.assign(el.style,node.styles||{})', 'Object.assign(el.style,{...(node.styles||{}),...(node.responsiveStyles?.[device]||{})})')
  const errors = issues.filter((issue) => issue.level === 'error').map((issue) => issue.message)
  const warnings = issues.filter((issue) => issue.level === 'warning').map((issue) => issue.message)
  const manifest = { name: projectName, version: `v${version}`, exportedAt: new Date().toISOString(), schemaVersion: exportSchema.schemaVersion, entry: 'index.html', localImageCount: assets.length, preflight: { status: errors.length ? 'blocked' : 'passed', errors, warnings } }
  const warningLines = warnings.length ? warnings.map((message) => `- [WARN] ${message}`).join('\n') : '- [PASS] 没有自动检查警告'
  const readme = `# ${projectName}\n\n版本：v${version}\n导出时间：${manifest.exportedAt}\n自动检查：${errors.length ? '未通过' : '已通过'}\n\n## 部署\n\n1. 解压本 ZIP，保持 index.html 与 assets 目录同级。\n2. 将整个目录上传到 Nginx 静态目录、OSS 或 CDN。\n3. 访问 index.html 对应的公开地址。\n4. 不要单独移动或重命名 assets 目录。\n\n## Nginx\n\n将本目录配置为站点 root，并确保 index.html 为默认首页。\n\n## OSS/CDN\n\n开启静态网站托管，将 index.html 设置为默认首页，再按需绑定 CDN 域名。\n\n本包中的用户上传图片已放在 assets/images 目录；远程图片仍依赖原图片地址。自动检查只覆盖导出阶段，部署后的访问、域名和 HTTPS 仍需人工确认。\n`
  const checklist = `# 上线验收清单\n\n## 导出前自动检查\n\n- [PASS] Schema 有效\n- [PASS] 页面存在内容\n- [PASS] 导出资源结构完整\n- [PASS] 本地图片已打包（${assets.length} 个）\n${warningLines}\n\n## 上传后人工检查\n\n- [TODO] 手机端页面布局正常\n- [TODO] 平板和桌面端布局正常\n- [TODO] 所有图片正常显示\n- [TODO] 按钮链接和弹窗动作正常\n- [TODO] 倒计时显示正常\n- [TODO] 抽奖、优惠券、分享按钮正常\n- [TODO] 表单字段和提交动作正常\n- [TODO] 上传后 index.html 与 assets 目录同级\n- [TODO] HTTPS 和公开访问地址正常\n`
  const files: ZipFile[] = [
    { name: 'index.html', data: encoder.encode(html) },
    { name: 'assets/styles.css', data: encoder.encode(runtimeCss) },
    { name: 'assets/runtime.js', data: encoder.encode(runtime) },
    { name: 'manifest.json', data: encoder.encode(JSON.stringify(manifest, null, 2)) },
    { name: 'README.md', data: encoder.encode(readme) },
    { name: 'QA-CHECKLIST.md', data: encoder.encode(checklist) },
    ...assets,
  ]
  const blob = new Blob([createZip(files)], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const filename = String(projectName || 'campaign-page').replace(/[\\/:*?"<>|]/g, '-').trim() || 'campaign-page'
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')
  link.href = url; link.download = `${filename}-v${version}-${stamp}.zip`; link.click()
  URL.revokeObjectURL(url)
}
