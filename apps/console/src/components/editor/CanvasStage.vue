<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEditorStore } from '../../stores/editor'
import CanvasNode from './CanvasNode.vue'

const store = useEditorStore()
const { schema, device } = storeToRefs(store)
</script>

<template>
  <section class="canvas-area" :class="`device-${device}`">
    <div class="canvas-toolbar"><span>{{ store.previewMode ? '活动预览' : '画布' }}</span><span class="muted">{{ device === 'mobile' ? '手机 390px' : device === 'tablet' ? '平板 768px' : '桌面 1200px' }}</span><div v-if="!store.previewMode" class="device-switch"><button v-for="item in [['mobile','手机'],['tablet','平板'],['desktop','桌面']]" :key="item[0]" type="button" :class="{ active: device === item[0] }" @click="store.setDevice(item[0] as 'mobile' | 'tablet' | 'desktop')">{{ item[1] }}</button></div></div>
    <div class="phone"><div class="phone-bar"><span>9:41</span><span>活动预览</span><span>•••</span></div><div class="page" @click.self="store.select(schema.page.root.id)"><CanvasNode v-for="node in schema.page.root.children" :key="node.id" :node="node"/></div></div>
  </section>
</template>
