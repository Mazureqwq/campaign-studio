<script setup lang="ts">
import { computed } from 'vue'
import { componentRegistry } from '@campaign/components'
import { findNode, findParent, type NodeSchema } from '@campaign/schema'
import { useEditorStore } from '../../stores/editor'
import { dragSession } from './dragSession'
defineOptions({ name: 'CanvasNode' })
const props = defineProps<{ node: NodeSchema; ghost?: boolean }>()
const store = useEditorStore()
const draggedNode = computed(() => dragSession.sourceId ? findNode(store.schema.page.root, dragSession.sourceId) : undefined)
function select(event: MouseEvent) { store.select(props.node.id, event.ctrlKey || event.metaKey) }
let stopPointerDrag: (() => void) | null = null
function updatePointerTarget(clientX: number, clientY: number) {
  const hit = document.elementFromPoint(clientX, clientY)
  if (!(hit instanceof HTMLElement)) return
  if (hit.closest('.drag-placeholder')) return
  const host = hit.closest<HTMLElement>('[data-canvas-node-id]')
  const targetId = host?.dataset.canvasNodeId
  if (!host || !targetId || targetId === dragSession.sourceId) return
  const target = findNode(store.schema.page.root, targetId)
  const sourceParent = findParent(store.schema.page.root, dragSession.sourceId)
  const targetParent = findParent(store.schema.page.root, targetId)
  if (!target || target.type === 'section' || sourceParent?.id !== targetParent?.id) return
  const rect = host.getBoundingClientRect()
  dragSession.targetId = targetId
  dragSession.position = clientY < rect.top + rect.height / 2 ? 'before' : 'after'
}
function pointerDown(event: PointerEvent) {
  if (event.button !== 0 || !store.selectedIds.includes(props.node.id)) return
  const source = event.currentTarget as HTMLElement
  const startX = event.clientX
  const startY = event.clientY
  let active = false
  const pointerId = event.pointerId
  const move = (moveEvent: PointerEvent) => {
    if (moveEvent.pointerId !== pointerId) return
    if (!active) {
      const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY)
      if (distance < 6) return
      active = true
      dragSession.sourceId = props.node.id
      dragSession.targetId = ''
      dragSession.height = Math.max(44, source.getBoundingClientRect().height)
    }
    moveEvent.preventDefault()
    updatePointerTarget(moveEvent.clientX, moveEvent.clientY)
  }
  const up = () => {
    if (active && dragSession.sourceId === props.node.id && dragSession.targetId) store.dropNode(dragSession.sourceId, dragSession.targetId, dragSession.position)
    dragSession.sourceId = ''
    dragSession.targetId = ''
    stopPointerDrag?.()
    stopPointerDrag = null
  }
  stopPointerDrag = () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up) }
  document.addEventListener('pointermove', move, { passive: false })
  document.addEventListener('pointerup', up, { once: true })
}
function canDrop(event: DragEvent) {
  const transfer = event.dataTransfer
  if (!transfer) return false
  if (Array.from(transfer.types).includes('campaign/component')) return true
  const source = transfer.getData('campaign/node') || dragSession.sourceId
  if (!source || source === props.node.id) return false
  return props.node.type !== 'section' && findParent(store.schema.page.root, source)?.id === findParent(store.schema.page.root, props.node.id)?.id
}
function isNodeDrag(event: DragEvent) { return Array.from(event.dataTransfer?.types ?? []).includes('campaign/node') || Boolean(dragSession.sourceId) }
function dragOver(event: DragEvent) {
  if (!canDrop(event)) return
  event.preventDefault()
  event.stopPropagation()
  if (event.dataTransfer) event.dataTransfer.dropEffect = isNodeDrag(event) ? 'move' : 'copy'
  if (!isNodeDrag(event)) return
  const target = event.currentTarget as HTMLElement
  dragSession.targetId = props.node.id
  dragSession.position = event.clientY < target.getBoundingClientRect().top + target.offsetHeight / 2 ? 'before' : 'after'
}
function dragLeave(event: DragEvent) {
  const current = event.currentTarget as HTMLElement
  const related = event.relatedTarget as Node | null
  if (related instanceof HTMLElement && related.closest('.drag-placeholder')) return
  if ((!related || !current.contains(related)) && dragSession.targetId === props.node.id) dragSession.targetId = ''
}
function dragEnd() { dragSession.sourceId = ''; dragSession.targetId = '' }
function placeholderDragOver(event: DragEvent) {
  if (!dragSession.sourceId) return
  event.preventDefault()
  event.stopPropagation()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
}
function dropAtPlaceholder(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
  const source = event.dataTransfer?.getData('campaign/node') || dragSession.sourceId
  const target = dragSession.targetId
  if (source && target) store.dropNode(source, target, dragSession.position)
  dragSession.targetId = ''
}
function drop(event: DragEvent) {
  event.preventDefault(); event.stopPropagation()
  const type = event.dataTransfer?.getData('campaign/component')
  if (type) { const section = props.node.type === 'section' ? props.node : findParent(store.schema.page.root, props.node.id); if (section?.type === 'section') store.addNodeToSection(type as NodeSchema['type'], section.id); return }
  const source = event.dataTransfer?.getData('campaign/node') || dragSession.sourceId
  if (source && props.node.type !== 'section') store.dropNode(source, props.node.id, dragSession.position)
  dragSession.targetId = ''
}
function showPlaceholder(id: string, position: 'before' | 'after') { return dragSession.targetId === id && dragSession.position === position }
</script>

<template>
  <section v-if="node.type === 'section'" class="preview-section canvas-drop-target" :class="{ selected: store.selectedIds.includes(node.id), 'dragging-source': dragSession.sourceId === node.id }" :style="store.resolvedStyles(node)" draggable="false" @click.stop="select" @dragover="dragOver" @dragleave="dragLeave" @drop="drop">
    <template v-for="child in node.children" :key="child.id">
      <template v-if="child.id !== dragSession.sourceId">
        <Transition name="drag-slot">
          <div v-if="showPlaceholder(child.id, 'before')" class="drag-placeholder" :style="{ height: `${dragSession.height}px` }" @dragover="placeholderDragOver" @drop="dropAtPlaceholder"><CanvasNode v-if="draggedNode" :node="draggedNode" ghost /></div>
        </Transition>
        <CanvasNode :node="child" />
        <Transition name="drag-slot">
          <div v-if="showPlaceholder(child.id, 'after')" class="drag-placeholder" :style="{ height: `${dragSession.height}px` }" @dragover="placeholderDragOver" @drop="dropAtPlaceholder"><CanvasNode v-if="draggedNode" :node="draggedNode" ghost /></div>
        </Transition>
      </template>
    </template>
  </section>
  <div v-else class="canvas-node-host canvas-drop-target" :class="{ 'drag-over': dragSession.targetId === node.id, selected: !ghost && store.selectedIds.includes(node.id), 'drag-ghost': ghost, 'dragging-source': !ghost && dragSession.sourceId === node.id }" :data-canvas-node-id="node.id" draggable="false" @click.stop="select" @pointerdown.stop="pointerDown" @dragover="dragOver" @dragleave="dragLeave" @drop="drop">
    <component :is="componentRegistry.get(node.type)?.component" :node="node" :style="store.resolvedStyles(node)" :class="{ 'selected-node': store.selectedIds.includes(node.id) }" />
  </div>
</template>
