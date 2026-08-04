<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { componentRegistry } from '@campaign/components'
import { useEditorStore } from '../../stores/editor'

const store = useEditorStore()
const { selected, schema, device } = storeToRefs(store)
const label = computed(() => selected.value ? componentRegistry.get(selected.value.type)?.label ?? '页面' : '未选择')
const prop = (key: string) => selected.value?.props[key] as string | undefined
const style = (key: string) => selected.value ? store.resolvedStyles(selected.value)[key] ?? '' : ''
const event = computed(() => selected.value?.events.find((item) => item.name === 'click' || item.name === 'submit'))
const eventType = computed(() => event.value?.actions[0]?.type ?? 'show-toast')
const eventValue = computed(() => String(event.value?.actions[0]?.payload.url ?? event.value?.actions[0]?.payload.message ?? event.value?.actions[0]?.payload.title ?? event.value?.actions[0]?.payload.event ?? ''))
const uploading = ref(false)
const uploadError = ref('')
const sideNames = { top: 'Top', right: 'Right', bottom: 'Bottom', left: 'Left' } as const

function spacingValue(key: 'padding' | 'margin', side: keyof typeof sideNames) {
  if (!selected.value) return ''
  const styles = store.resolvedStyles(selected.value)
  const individual = styles[`${key}${sideNames[side]}`]
  if (individual) return individual.replace(/px$/, '')
  const values = String(styles[key] ?? '').trim().split(/\s+/).filter(Boolean)
  if (!values.length) return ''
  const mapped = values.length === 1 ? [values[0], values[0], values[0], values[0]] : values.length === 2 ? [values[0], values[1], values[0], values[1]] : values.length === 3 ? [values[0], values[1], values[2], values[1]] : values
  return String(mapped[{ top: 0, right: 1, bottom: 2, left: 3 }[side]]).replace(/px$/, '')
}
function updateSpacing(key: 'padding' | 'margin', side: keyof typeof sideNames, value: string) { store.updateStyle(`${key}${sideNames[side]}`, value === '' ? '' : `${value}px`) }
function applyPreset(preset: 'compact' | 'standard' | 'loose' | 'primary' | 'outline') {
  if (!selected.value) return
  if (preset === 'compact') { store.updateStyle('padding', '12px 12px'); store.updateStyle('margin', '8px 0') }
  if (preset === 'standard') { store.updateStyle('padding', '24px 16px'); store.updateStyle('margin', '12px 0') }
  if (preset === 'loose') { store.updateStyle('padding', '40px 20px'); store.updateStyle('margin', '20px 0') }
  if (preset === 'primary') { store.updateStyle('background', '#ef6c4d'); store.updateStyle('color', '#ffffff'); store.updateStyle('borderRadius', '6px') }
  if (preset === 'outline') { store.updateStyle('background', '#ffffff'); store.updateStyle('color', '#183f4a'); store.updateStyle('border', '1px solid #183f4a'); store.updateStyle('borderRadius', '6px') }
}
function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]; input.value = ''; uploadError.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) { uploadError.value = '请选择图片文件'; return }
  if (file.size > 5 * 1024 * 1024) { uploadError.value = '图片不能超过 5MB'; return }
  uploading.value = true
  const reader = new FileReader()
  reader.onload = () => { store.updateProp(selected.value?.type === 'page' ? 'shareImage' : 'src', String(reader.result)); uploading.value = false }
  reader.onerror = () => { uploadError.value = '图片读取失败'; uploading.value = false }
  reader.readAsDataURL(file)
}
function updateEvent(type: 'open-url' | 'show-toast' | 'open-modal' | 'track', value: string) { const name = selected.value?.type === 'form' ? 'submit' : 'click'; const key = type === 'open-url' ? 'url' : type === 'open-modal' ? 'title' : type === 'track' ? 'event' : 'message'; store.updateEvent(name, type, { [key]: value }) }
</script>

<template>
  <aside class="right-panel panel">
    <div class="panel-heading"><span>属性</span><span class="muted">{{ label }} · {{ device }}</span></div>
    <div v-if="selected" class="inspector">
      <label>名称<input :value="label" disabled /></label>
      <template v-if="selected.type === 'page'"><div class="inspector-section"><div class="section-title">页面信息</div><label>页面标题<input :value="prop('title') || schema.page.title" @input="store.updateProp('title', ($event.target as HTMLInputElement).value)" /></label><label>页面描述<textarea :value="prop('description')" rows="2" placeholder="用于搜索和分享摘要" @input="store.updateProp('description', ($event.target as HTMLTextAreaElement).value)" /></label><label>分享标题<input :value="prop('shareTitle')" placeholder="默认使用页面标题" @input="store.updateProp('shareTitle', ($event.target as HTMLInputElement).value)" /></label><label>分享描述<textarea :value="prop('shareDescription')" rows="2" placeholder="默认使用页面描述" @input="store.updateProp('shareDescription', ($event.target as HTMLTextAreaElement).value)" /></label><label>分享封面上传<input class="image-upload" type="file" accept="image/*" @change="uploadImage" /><small v-if="uploading">正在读取图片...</small><small v-if="uploadError" class="upload-error">{{ uploadError }}</small></label><label>分享封面地址<input :value="prop('shareImage')" placeholder="https://..." @input="store.updateProp('shareImage', ($event.target as HTMLInputElement).value)" /></label></div></template>
      <label v-if="selected.type === 'text'">内容<textarea :value="prop('text')" rows="3" @input="store.updateProp('text', ($event.target as HTMLTextAreaElement).value)" /></label>
      <label v-if="selected.type === 'image'">图片上传<input class="image-upload" type="file" accept="image/*" @change="uploadImage" /><small v-if="uploading">正在读取图片...</small><small v-if="uploadError" class="upload-error">{{ uploadError }}</small></label><label v-if="selected.type === 'image'">图片地址<input :value="prop('src')" @input="store.updateProp('src', ($event.target as HTMLInputElement).value)" /></label><label v-if="selected.type === 'image'">替代文本<input :value="prop('alt')" @input="store.updateProp('alt', ($event.target as HTMLInputElement).value)" /></label>
      <label v-if="selected.type === 'button'">按钮文字<input :value="prop('text')" @input="store.updateProp('text', ($event.target as HTMLInputElement).value)" /></label><label v-if="selected.type === 'form'">表单标题<input :value="prop('title')" @input="store.updateProp('title', ($event.target as HTMLInputElement).value)" /></label><label v-if="selected.type === 'countdown'">结束时间<input type="datetime-local" :value="String(prop('endAt') ?? '').slice(0, 16)" @input="store.updateProp('endAt', new Date(($event.target as HTMLInputElement).value).toISOString())" /></label><label v-if="selected.type === 'coupon'">券面金额<input :value="prop('amount')" @input="store.updateProp('amount', ($event.target as HTMLInputElement).value)" /></label><label v-if="selected.type === 'coupon'">使用说明<input :value="prop('description')" @input="store.updateProp('description', ($event.target as HTMLInputElement).value)" /></label><label v-if="selected.type === 'modal' || selected.type === 'lottery' || selected.type === 'share'">按钮文字<input :value="prop('text')" @input="store.updateProp('text', ($event.target as HTMLInputElement).value)" /></label><label v-if="selected.type === 'modal'">弹窗内容<textarea :value="prop('content')" rows="3" @input="store.updateProp('content', ($event.target as HTMLTextAreaElement).value)" /></label><label v-if="selected.type === 'product'">商品名称<input :value="prop('name')" @input="store.updateProp('name', ($event.target as HTMLInputElement).value)" /></label><label v-if="selected.type === 'product'">商品价格<input :value="prop('price')" @input="store.updateProp('price', ($event.target as HTMLInputElement).value)" /></label><label v-if="selected.type === 'product'">商品图片<input :value="prop('image')" @input="store.updateProp('image', ($event.target as HTMLInputElement).value)" /></label>
      <label v-if="selected.type === 'text'">字号<input :value="style('fontSize')" placeholder="16px" @input="store.updateStyle('fontSize', ($event.target as HTMLInputElement).value)" /></label>
      <div v-if="selected.type !== 'page'" class="inspector-section visual-style-section"><div class="section-title">视觉样式 <span class="muted">{{ device }} 覆盖</span></div><label v-if="selected.type === 'section'">布局预设<select @change="applyPreset(($event.target as HTMLSelectElement).value as 'compact' | 'standard' | 'loose')"><option value="">选择预设</option><option value="compact">紧凑</option><option value="standard">标准</option><option value="loose">宽松</option></select></label><div class="spacing-control"><span>内边距</span><div class="spacing-grid"><label v-for="side in (['top','right','bottom','left'] as const)" :key="side">{{ sideNames[side] }}<input type="number" min="0" :value="spacingValue('padding', side)" @input="updateSpacing('padding', side, ($event.target as HTMLInputElement).value)" /></label></div></div><div class="spacing-control"><span>外边距</span><div class="spacing-grid"><label v-for="side in (['top','right','bottom','left'] as const)" :key="side">{{ sideNames[side] }}<input type="number" min="0" :value="spacingValue('margin', side)" @input="updateSpacing('margin', side, ($event.target as HTMLInputElement).value)" /></label></div></div><div class="style-grid"><label>宽度<input :value="style('width')" placeholder="100%" @input="store.updateStyle('width', ($event.target as HTMLInputElement).value)" /></label><label>高度<input :value="style('height')" placeholder="auto" @input="store.updateStyle('height', ($event.target as HTMLInputElement).value)" /></label></div><div class="style-grid"><label>文字颜色<input :value="style('color') || '#24313a'" type="color" @input="store.updateStyle('color', ($event.target as HTMLInputElement).value)" /></label><label>背景颜色<input :value="style('background') || '#ffffff'" type="color" @input="store.updateStyle('background', ($event.target as HTMLInputElement).value)" /></label></div><div class="style-grid"><label>对齐<select :value="style('textAlign')" @change="store.updateStyle('textAlign', ($event.target as HTMLSelectElement).value)"><option value="">默认</option><option value="left">左</option><option value="center">中</option><option value="right">右</option></select></label><label>圆角<input :value="style('borderRadius')" placeholder="6px" @input="store.updateStyle('borderRadius', ($event.target as HTMLInputElement).value)" /></label></div><label>阴影<select :value="style('boxShadow')" @change="store.updateStyle('boxShadow', ($event.target as HTMLSelectElement).value)"><option value="">无</option><option value="0 4px 14px #0002">柔和</option><option value="0 8px 24px #0003">卡片</option></select></label><label>背景图片<input :value="style('backgroundImage')" placeholder="url(...)" @input="store.updateStyle('backgroundImage', ($event.target as HTMLInputElement).value)" /></label><label v-if="selected.type === 'button'">按钮预设<select @change="applyPreset(($event.target as HTMLSelectElement).value as 'primary' | 'outline')"><option value="">选择预设</option><option value="primary">主按钮</option><option value="outline">描边按钮</option></select></label></div>
      <div v-if="['button', 'form', 'coupon', 'modal', 'lottery', 'product', 'share'].includes(selected.type)" class="inspector-section"><div class="section-title">交互动作</div><label>触发动作<select :value="eventType" @change="updateEvent(($event.target as HTMLSelectElement).value as 'open-url' | 'show-toast' | 'open-modal' | 'track', eventValue)"><option value="show-toast">显示提示</option><option value="open-url">打开链接</option><option value="open-modal">打开弹窗</option><option value="track">记录埋点</option></select></label><label>动作参数<input :value="eventValue" :placeholder="eventType === 'open-url' ? 'https://example.com' : '请输入内容'" @change="updateEvent(eventType, ($event.target as HTMLInputElement).value)" /></label></div>
      <button v-if="selected.type !== 'page'" type="button" class="delete-button" @click.stop="store.removeSelected">删除元素</button>
    </div><div v-else class="empty">选择画布中的组件开始编辑</div>
  </aside>
</template>
