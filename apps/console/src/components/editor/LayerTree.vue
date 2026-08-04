<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { componentRegistry } from '@campaign/components'
import type { NodeSchema } from '@campaign/schema'
import { useEditorStore } from '../../stores/editor'

const store = useEditorStore()
const { schema, selectedIds } = storeToRefs(store)
let draggingId = ''
function select(node: NodeSchema, event: MouseEvent) { store.select(node.id, event.ctrlKey || event.metaKey) }
function dragStart(id: string) { draggingId = id }
function drop(id: string) { if (draggingId) store.dropNode(draggingId, id); draggingId = '' }
</script>

<template>
  <div class="tree">
    <div class="tree-label">页面</div>
    <div v-for="section in schema.page.root.children" :key="section.id" class="tree-section">
      <button class="tree-row" :class="{ active: selectedIds.includes(section.id) }" draggable="true" @click="select(section, $event)" @dragstart="dragStart(section.id)" @dragover.prevent @drop="drop(section.id)"><svg class="tree-icon caret-icon" viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg><span>{{ section.type === 'section' ? '内容区块' : section.type }}</span></button>
      <button v-for="child in section.children" :key="child.id" class="tree-row child" :class="{ active: selectedIds.includes(child.id) }" draggable="true" @click="select(child, $event)" @dragstart="dragStart(child.id)" @dragover.prevent @drop="drop(child.id)"><span class="node-dot"/><span>{{ componentRegistry.get(child.type)?.label ?? child.type }}</span></button>
    </div>
  </div>
</template>
