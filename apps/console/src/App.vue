<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from './stores/editor'
import { downloadProjectZip } from './exportPage'
import { validateExport, type ExportIssue } from './exportValidation'
import LayerTree from './components/editor/LayerTree.vue'
import ComponentPalette from './components/editor/ComponentPalette.vue'
import CanvasStage from './components/editor/CanvasStage.vue'
import InspectorPanel from './components/editor/InspectorPanel.vue'
import TemplateCenter from './components/editor/TemplateCenter.vue'

const store = useEditorStore()
const templateOpen = ref(false)
const exportIssues = ref<ExportIssue[]>([])
const { schema, saveState, canUndo, canRedo, previewMode, currentTemplateName, selectedIds } = storeToRefs(store)
const saveText = computed(() => ({ saved: '草稿已保存', saving: '正在保存...', dirty: '有未保存修改', error: '保存失败' }[saveState.value]))
function onKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  if ((event.key === 'Delete' || event.key === 'Backspace') && target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA') { event.preventDefault(); store.removeSelected() }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); store.saveDraft() }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd' && target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA') { event.preventDefault(); store.copySelected() }
}
function publish() { store.publish(); window.open('/preview.html', '_blank') }
function exportPage() {
  const name = currentTemplateName.value || schema.value.page.title
  const issues = validateExport(schema.value)
  exportIssues.value = issues
  if (issues.some((issue) => issue.level === 'error')) return
  const version = store.nextExportVersion(name)
  downloadProjectZip(schema.value, name, version, issues)
}
function closeExportReport() { exportIssues.value = [] }
onMounted(() => { store.init(); window.addEventListener('keydown', onKeydown) })
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="shell" :class="{ 'preview-shell': previewMode }">
    <header class="topbar">
      <div class="brand"><span class="brand-mark">C</span><span>Campaign Studio</span></div>
      <div class="crumb">工作空间 / {{ currentTemplateName || schema.page.title }}</div>
      <div class="top-actions">
        <template v-if="!previewMode">
          <button type="button" class="history" :disabled="!canUndo" title="撤销" @click="store.undo"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 6 3.5 9.5 7 13"/><path d="M4 9.5h7a5 5 0 0 1 5 5"/></svg></button>
          <button type="button" class="history" :disabled="!canRedo" title="重做" @click="store.redo"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m13 6 3.5 3.5L13 13"/><path d="M16 9.5H9a5 5 0 0 0-5 5"/></svg></button>
          <span class="status"><i :class="saveState"/>{{ saveText }}</span>
          <button type="button" class="ghost" @click="store.saveDraft">保存草稿</button>
          <button type="button" class="primary" @click="publish">发布预览</button>
          <button type="button" class="ghost" @click="exportPage">导出项目 ZIP</button>
          <button type="button" class="ghost" @click="store.togglePreview">预览模式</button>
          <button type="button" class="ghost" @click="templateOpen = true">模板中心</button>
        </template>
        <button v-else type="button" class="ghost" @click="store.togglePreview">返回编辑</button>
      </div>
    </header>
    <div v-if="!previewMode && selectedIds.length" class="context-toolbar"><span>已选 {{ selectedIds.length }} 项</span><button type="button" @click="store.copySelected">复制</button><button type="button" @click="store.reorderSelected('up')">上移</button><button type="button" @click="store.reorderSelected('down')">下移</button><button type="button" @click="store.reorderSelected('top')">置顶</button><button type="button" @click="store.reorderSelected('bottom')">置底</button><button type="button" class="danger-text" @click="store.removeSelected">删除</button></div>
    <main v-if="!previewMode" class="workspace"><aside class="left-panel panel"><div class="panel-heading"><span>页面结构</span><span class="muted">{{ schema.page.root.children?.length ?? 0 }} 个区块</span></div><LayerTree/><ComponentPalette/></aside><CanvasStage/><InspectorPanel/></main>
    <main v-else class="standalone-preview"><CanvasStage/></main>
    <aside v-if="exportIssues.length" class="export-report"><div class="export-report-header"><strong>导出检查</strong><button type="button" class="icon-button" aria-label="关闭导出检查" @click="closeExportReport">×</button></div><p v-if="exportIssues.some((issue) => issue.level === 'error')" class="export-error">存在错误，修复后才能导出。</p><p v-else class="export-success">检查通过，项目 ZIP 已开始下载。</p><ul><li v-for="issue in exportIssues" :key="issue.message" :class="issue.level">{{ issue.message }}</li></ul></aside>
    <TemplateCenter v-if="templateOpen" @close="templateOpen = false" />
  </div>
</template>
