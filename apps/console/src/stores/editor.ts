import { defineStore } from 'pinia'
import { cloneSchema, createId, createNode, findNode, findParent, migrateSchema, starterPage, validateSchema, type NodeSchema, type NodeType, type PageSchema } from '@campaign/schema'
import { builtInTemplates, type TemplateRecord } from '../templates'

type Snapshot = { label: string; before: PageSchema; after: PageSchema }
const STORAGE_KEY = 'campaign-editor-draft'
const PUBLISHED_KEY = 'campaign-page-schema'
const TEMPLATES_KEY = 'campaign-editor-templates'
const VERSIONS_KEY = 'campaign-editor-export-versions'
const CURRENT_TEMPLATE_KEY = 'campaign-editor-current-template'

export const useEditorStore = defineStore('editor', {
  state: () => ({ schema: starterPage() as PageSchema, selectedId: '', selectedIds: [] as string[], past: [] as Snapshot[], future: [] as Snapshot[], saveState: 'saved' as 'saved' | 'dirty' | 'saving' | 'error', lastSavedAt: null as number | null, initialized: false, previewMode: false, device: 'mobile' as 'mobile' | 'tablet' | 'desktop', publishedAt: null as number | null, customTemplates: [] as TemplateRecord[], currentTemplateName: '', exportVersions: {} as Record<string, number> }),
  getters: {
    selected(state): NodeSchema | undefined { return findNode(state.schema.page.root, state.selectedId) },
    canUndo: (state) => state.past.length > 0,
    canRedo: (state) => state.future.length > 0,
  },
  actions: {
    init() {
      if (this.initialized) return
      const raw = localStorage.getItem(STORAGE_KEY)
      const defaultTemplate = builtInTemplates[0]
      if (raw) { try { const candidate = migrateSchema(JSON.parse(raw) as PageSchema); if (validateSchema(candidate).length === 0) this.schema = candidate } catch { localStorage.removeItem(STORAGE_KEY) } }
      else if (defaultTemplate) { this.schema = cloneSchema(defaultTemplate.schema); localStorage.setItem(CURRENT_TEMPLATE_KEY, defaultTemplate.name) }
      this.selectedId = this.schema.page.root.children?.[0]?.id ?? this.schema.page.root.id
      this.selectedIds = [this.selectedId]
      this.currentTemplateName = localStorage.getItem(CURRENT_TEMPLATE_KEY) || defaultTemplate?.name || this.schema.page.title
      try { const items = JSON.parse(localStorage.getItem(TEMPLATES_KEY) ?? '[]') as TemplateRecord[]; this.customTemplates = Array.isArray(items) ? items : [] } catch { this.customTemplates = [] }
      try { const versions = JSON.parse(localStorage.getItem(VERSIONS_KEY) ?? '{}') as Record<string, number>; this.exportVersions = versions && typeof versions === 'object' ? versions : {} } catch { this.exportVersions = {} }
      this.initialized = true; this.lastSavedAt = raw ? Date.now() : null
    },
    select(id: string, additive = false) { this.selectedIds = additive ? (this.selectedIds.includes(id) ? this.selectedIds.filter((item) => item !== id) : [...this.selectedIds, id]) : [id]; this.selectedId = this.selectedIds[this.selectedIds.length - 1] ?? '' },
    resolvedStyles(node: NodeSchema) { return { ...node.styles, ...(node.responsiveStyles?.[this.device] ?? {}) } },
    clearSelection() { this.selectedIds = []; this.selectedId = '' },
    togglePreview() { this.previewMode = !this.previewMode },
    setDevice(device: 'mobile' | 'tablet' | 'desktop') { this.device = device },
    saveDraft() { this.persist(false) },
    nextExportVersion(name: string) { const version = (this.exportVersions[name] ?? 0) + 1; this.exportVersions[name] = version; localStorage.setItem(VERSIONS_KEY, JSON.stringify(this.exportVersions)); return version },
    publish() { localStorage.setItem(PUBLISHED_KEY, JSON.stringify(this.schema)); this.publishedAt = Date.now(); this.saveState = 'saved' },
    saveAsTemplate(name: string, description: string) { const template: TemplateRecord = { id: `custom-${Date.now()}`, name: name.trim() || '未命名模板', description: description.trim() || '我的营销活动模板', category: '自定义', createdAt: Date.now(), schema: cloneSchema(this.schema) }; this.customTemplates.unshift(template); localStorage.setItem(TEMPLATES_KEY, JSON.stringify(this.customTemplates)) },
    removeTemplate(id: string) { this.customTemplates = this.customTemplates.filter((template) => template.id !== id); localStorage.setItem(TEMPLATES_KEY, JSON.stringify(this.customTemplates)) },
    applyTemplate(template: TemplateRecord) { const next = cloneSchema(template.schema); const applied = this.execute(`应用模板：${template.name}`, (schema) => { schema.schemaVersion = next.schemaVersion; schema.page = next.page }); if (applied) { this.currentTemplateName = template.name; localStorage.setItem(CURRENT_TEMPLATE_KEY, template.name); this.exportVersions[template.name] = 0; localStorage.setItem(VERSIONS_KEY, JSON.stringify(this.exportVersions)); this.select(this.schema.page.root.children?.[0]?.id ?? this.schema.page.root.id) } },
    updateEvent(name: 'click' | 'submit' | 'load', actionType: 'open-url' | 'show-toast' | 'open-modal' | 'track', payload: Record<string, unknown>) { if (!this.selected) return; const id = this.selected.id; this.execute('配置事件', (schema) => { const node = findNode(schema.page.root, id); if (!node) return; const event = node.events.find((item) => item.name === name); const action = { type: actionType, payload }; if (event) event.actions = [action]; else node.events.push({ name, actions: [action] }) }) },
    execute(label: string, mutation: (schema: PageSchema) => void) { const before = cloneSchema(this.schema); mutation(this.schema); const issues = validateSchema(this.schema); if (issues.length) { this.schema = before; this.saveState = 'error'; return false }; this.past.push({ label, before, after: cloneSchema(this.schema) }); this.future = []; this.saveState = 'dirty'; this.persist(); return true },
    addNode(type: NodeType) { const target = this.selected?.type === 'section' ? this.selected : this.schema.page.root.children?.find((node) => node.type === 'section'); if (!target) return; const node = createNode(type); const added = this.execute(`添加${type}`, (schema) => { const section = findNode(schema.page.root, target.id); if (section) { section.children ??= []; section.children.push(node) } }); if (added) this.select(node.id) },
    addNodeToSection(type: NodeType, sectionId: string) { const node = createNode(type); const added = this.execute(`添加${type}`, (schema) => { const section = findNode(schema.page.root, sectionId); if (section?.type === 'section') { section.children ??= []; section.children.push(node) } }); if (added) this.select(node.id) },
    addSection() { const section = createNode('section'); const added = this.execute('添加内容区块', (schema) => { schema.page.root.children ??= []; schema.page.root.children.push(section) }); if (added) this.select(section.id) },
    updateProp(key: string, value: unknown) { if (!this.selected) return; const id = this.selected.id; this.execute('修改属性', (schema) => { const node = findNode(schema.page.root, id); if (node) { node.props[key] = value; if (node.type === 'page' && key === 'title') schema.page.title = String(value) } }) },
    updateStyle(key: string, value: string) { if (!this.selected) return; const id = this.selected.id; this.execute('修改样式', (schema) => { const node = findNode(schema.page.root, id); if (!node) return; if (this.device === 'mobile') node.styles[key] = value; else { node.responsiveStyles ??= {}; node.responsiveStyles[this.device] ??= {}; node.responsiveStyles[this.device]![key] = value } }) },
    copySelected() { const ids = [...this.selectedIds]; const originals = ids.map((id) => findNode(this.schema.page.root, id)).filter((node): node is NodeSchema => Boolean(node)); if (!originals.length) return; const copies = originals.map((node) => this.cloneWithNewIds(node)); const copied = this.execute('复制节点', (schema) => { ids.forEach((id, index) => { const parent = findParent(schema.page.root, id); const owner = parent && findNode(schema.page.root, parent.id); const position = owner?.children?.findIndex((item) => item.id === id) ?? -1; if (owner?.children && position >= 0) owner.children.splice(position + 1, 0, copies[index]) }) }); if (copied) { this.selectedIds = copies.map((node) => node.id); this.selectedId = this.selectedIds[this.selectedIds.length - 1] } },
    cloneWithNewIds(node: NodeSchema) { const copy = JSON.parse(JSON.stringify(node)) as NodeSchema; const visit = (item: NodeSchema) => { item.id = createId(); item.children?.forEach(visit) }; visit(copy); return copy },
    reorderSelected(direction: 'up' | 'down' | 'top' | 'bottom') { const id = this.selectedId; const parent = id ? findParent(this.schema.page.root, id) : undefined; if (!parent?.children) return; const index = parent.children.findIndex((node) => node.id === id); const target = direction === 'up' ? index - 1 : direction === 'down' ? index + 1 : direction === 'top' ? 0 : parent.children.length - 1; if (index < 0 || target < 0 || target >= parent.children.length || target === index) return; this.execute('调整节点顺序', (schema) => { const owner = findParent(schema.page.root, id); if (!owner?.children) return; const [node] = owner.children.splice(index, 1); owner.children.splice(target, 0, node) }) },
    dropNode(sourceId: string, targetId: string, position: 'before' | 'after' = 'before') { if (sourceId === targetId) return; const sourceParent = findParent(this.schema.page.root, sourceId); const targetParent = findParent(this.schema.page.root, targetId); if (!sourceParent?.children || sourceParent.id !== targetParent?.id) return; const sourceIndex = sourceParent.children.findIndex((node) => node.id === sourceId); const targetIndex = sourceParent.children.findIndex((node) => node.id === targetId); if (sourceIndex < 0 || targetIndex < 0) return; this.execute('拖拽调整顺序', (schema) => { const owner = findParent(schema.page.root, sourceId); if (!owner?.children) return; const [node] = owner.children.splice(sourceIndex, 1); const insertionIndex = position === 'after' ? targetIndex + (sourceIndex < targetIndex ? 0 : 1) : targetIndex - (sourceIndex < targetIndex ? 1 : 0); owner.children.splice(Math.max(0, insertionIndex), 0, node) }); this.select(sourceId) },
    moveIntoSection(sourceId: string, sectionId: string) { if (sourceId === sectionId) return; const section = findNode(this.schema.page.root, sectionId); if (section?.type !== 'section') return; const sourceParent = findParent(this.schema.page.root, sourceId); const node = findNode(this.schema.page.root, sourceId); if (!sourceParent?.children || !node) return; this.execute('拖入内容区块', (schema) => { const owner = findParent(schema.page.root, sourceId); const target = findNode(schema.page.root, sectionId); if (!owner?.children || target?.type !== 'section') return; owner.children = owner.children.filter((child) => child.id !== sourceId); target.children ??= []; target.children.push(node) }); this.select(sourceId) },
    removeSelected() { const ids = this.selectedIds.filter((id) => id !== this.schema.page.root.id); if (!ids.length || !window.confirm(`确定删除选中的 ${ids.length} 个节点吗？`)) return; const parent = findParent(this.schema.page.root, ids[0]); if (!parent) return; this.execute('删除元素', (schema) => { const remove = (owner: NodeSchema) => { if (owner.children) { owner.children = owner.children.filter((child) => !ids.includes(child.id)); owner.children.forEach(remove) } }; remove(schema.page.root) }); this.select(parent.id) },
    undo() { const item = this.past.pop(); if (!item) return; this.future.push(item); this.schema = cloneSchema(item.before); this.reselect(); this.saveState = 'dirty'; this.persist(false) },
    redo() { const item = this.future.pop(); if (!item) return; this.past.push(item); this.schema = cloneSchema(item.after); this.reselect(); this.saveState = 'dirty'; this.persist(false) },
    reselect() { this.selectedIds = this.selectedIds.filter((id) => Boolean(findNode(this.schema.page.root, id))); if (!this.selectedIds.length) this.selectedIds = [this.schema.page.root.children?.[0]?.id ?? this.schema.page.root.id]; this.selectedId = this.selectedIds[this.selectedIds.length - 1] },
    persist(debounce = true) { this.saveState = 'saving'; const write = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.schema)); this.lastSavedAt = Date.now(); this.saveState = 'saved' } catch { this.saveState = 'error' } }; if (debounce) window.setTimeout(write, 250); else write() },
  },
})
