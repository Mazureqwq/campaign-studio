import { createApp, h, ref } from 'vue'
import { starterPage, type NodeSchema } from '@campaign/schema'
import { componentRegistry } from '@campaign/components'
import './style.css'

const schema = JSON.parse(localStorage.getItem('campaign-page-schema') ?? JSON.stringify(starterPage()))
const device = window.innerWidth < 600 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
const toast = ref('')
const modal = ref<{ title: string; content: string } | null>(null)
let toastTimer = 0
function showToast(message: string) { toast.value = message; window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => { toast.value = '' }, 2200) }
function runAction(node: NodeSchema) {
  if (node.type === 'lottery') { const prizes = Array.isArray(node.props.prizes) ? node.props.prizes : ['谢谢参与']; showToast(`抽奖结果：${String(prizes[Math.floor(Math.random() * prizes.length)])}`) }
  if (node.type === 'share') { if (navigator.share) navigator.share({ title: document.title, url: location.href }).catch(() => undefined); else { navigator.clipboard?.writeText(location.href); showToast('活动链接已复制') } }
  const event = node.events.find((item) => item.name === (node.type === 'form' ? 'submit' : 'click'))
  for (const action of event?.actions ?? []) {
    if (action.type === 'open-url') window.open(String(action.payload.url ?? ''), '_blank')
    if (action.type === 'show-toast') showToast(String(action.payload.message ?? '操作成功'))
    if (action.type === 'open-modal') modal.value = { title: String(action.payload.title ?? node.props.title ?? '提示'), content: String(node.props.content ?? '感谢参与本次活动') }
    if (action.type === 'track') console.info('[campaign-track]', action.payload.event)
  }
}
const render = (node: NodeSchema): ReturnType<typeof h> => {
  if (node.type === 'page') return h('div', { class: 'runtime-page', style: { ...node.styles, ...(node.responsiveStyles?.[device] ?? {}) } }, (node.children ?? []).map(render))
  if (node.type === 'section') return h('section', { class: 'runtime-section', style: { ...node.styles, ...(node.responsiveStyles?.[device] ?? {}) } }, (node.children ?? []).map(render))
  return h(componentRegistry.get(node.type)?.component ?? 'div', { node, style: { ...node.styles, ...(node.responsiveStyles?.[device] ?? {}) }, onAction: runAction })
}
const App = { setup: () => () => h('div', [render(schema.page.root), toast.value ? h('div', { class: 'campaign-toast' }, toast.value) : null, modal.value ? h('div', { class: 'campaign-modal-backdrop', onClick: () => { modal.value = null } }, [h('div', { class: 'campaign-modal', onClick: (event: Event) => event.stopPropagation() }, [h('strong', modal.value.title), h('p', modal.value.content), h('button', { onClick: () => { modal.value = null } }, '知道了')])]) : null]) }
createApp(App).mount('#app')
