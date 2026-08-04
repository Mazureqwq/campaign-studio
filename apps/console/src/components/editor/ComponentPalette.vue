<script setup lang="ts">
import { componentRegistry } from '@campaign/components'
import { useEditorStore } from '../../stores/editor'
import type { NodeType } from '@campaign/schema'

const store = useEditorStore()
const addable: NodeType[] = ['text', 'image', 'button', 'form', 'countdown', 'coupon', 'modal', 'lottery', 'product', 'share']
function dragStart(event: DragEvent, type: NodeType) { event.dataTransfer?.setData('campaign/component', type); if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy' }
</script>

<template>
  <div class="panel-footer">
    <div class="muted">组件</div>
    <button class="section-add" type="button" @click="store.addSection">＋ 内容区块</button>
    <div class="add-grid"><button v-for="type in addable" :key="type" type="button" draggable="true" @dragstart="dragStart($event, type)" @click="store.addNode(type)">＋ {{ componentRegistry.get(type)?.label }}</button></div>
  </div>
</template>
