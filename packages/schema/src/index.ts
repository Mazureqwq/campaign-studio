export type NodeType = 'page' | 'section' | 'text' | 'image' | 'button' | 'form' | 'countdown' | 'coupon' | 'modal' | 'lottery' | 'product' | 'share'
export const CURRENT_SCHEMA_VERSION = 1

export interface NodeSchema {
  id: string
  type: NodeType
  version: string
  props: Record<string, unknown>
  styles: Record<string, string>
  responsiveStyles?: Partial<Record<'mobile' | 'tablet' | 'desktop', Record<string, string>>>
  events: EventConfig[]
  children?: NodeSchema[]
}
export interface EventConfig { name: 'click' | 'submit' | 'load'; actions: ActionConfig[] }
export interface ActionConfig { type: 'open-url' | 'show-toast' | 'open-modal' | 'track'; payload: Record<string, unknown> }
export interface PageSchema { schemaVersion: number; page: { id: string; title: string; root: NodeSchema } }
export interface SchemaIssue { path: string; message: string }
export const createId = () => Math.random().toString(36).slice(2, 10)

export function createNode(type: NodeType, overrides: Partial<NodeSchema> = {}): NodeSchema {
  const defaults: Record<NodeType, Partial<NodeSchema>> = {
    page: { props: { title: '新活动' }, styles: {} },
    section: { props: {}, styles: { padding: '24px 16px', background: '#ffffff' }, children: [] },
    text: { props: { text: '活动标题', level: 'h1' }, styles: { color: '#16202a', textAlign: 'center' } },
    image: { props: { src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80', alt: '活动主视觉' }, styles: {} },
    button: { props: { text: '立即参与' }, styles: { background: '#ef6c4d', color: '#ffffff', borderRadius: '6px' } },
    form: { props: { title: '留下联系方式', fields: ['姓名', '手机号'] }, styles: {} },
    countdown: { props: { title: '活动倒计时', endAt: new Date(Date.now() + 3 * 86400000).toISOString() }, styles: { textAlign: 'center', padding: '16px', background: '#fff4ef', color: '#c94f36' } },
    coupon: { props: { title: '新人专享券', amount: '50', description: '满 199 元可用' }, styles: { textAlign: 'center', padding: '18px', background: '#fff7ed', color: '#b45309' } },
    modal: { props: { text: '查看活动详情', title: '活动详情', content: '感谢参与本次活动' }, styles: { textAlign: 'center', padding: '16px' } },
    lottery: { props: { text: '立即抽奖', prizes: ['一等奖', '二等奖', '谢谢参与'] }, styles: { textAlign: 'center', padding: '18px', background: '#fff1f2', color: '#be123c' } },
    product: { props: { name: '夏日限定礼盒', price: '199', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' }, styles: {} },
    share: { props: { text: '分享活动' }, styles: { textAlign: 'center', padding: '14px' } },
  }
  return { id: createId(), type, version: '1.0.0', props: {}, styles: {}, events: [], ...defaults[type], ...overrides }
}

export const starterPage = (): PageSchema => ({
  schemaVersion: 1,
  page: {
    id: createId(),
    title: '夏日新品活动',
    root: createNode('page', { children: [
      createNode('section', { children: [
        createNode('text', { props: { text: '夏日新品，限时体验', level: 'h1' }, styles: { color: '#ffffff', textAlign: 'center', fontSize: '30px', fontWeight: '700' } }),
        createNode('text', { props: { text: '现在报名，领取专属礼遇', level: 'p' }, styles: { color: '#ffe6dc', textAlign: 'center', marginTop: '8px' } }),
        createNode('button'),
      ], styles: { padding: '44px 20px', background: '#183f4a' } }),
      createNode('image'),
      createNode('section', { children: [createNode('form')] }),
    ] }),
  },
})

export function findNode(root: NodeSchema, id: string): NodeSchema | undefined { if (root.id === id) return root; for (const child of root.children ?? []) { const found = findNode(child, id); if (found) return found } }
export function findParent(root: NodeSchema, id: string): NodeSchema | undefined { for (const child of root.children ?? []) { if (child.id === id) return root; const parent = findParent(child, id); if (parent) return parent } }
export function cloneSchema(schema: PageSchema): PageSchema { return JSON.parse(JSON.stringify(schema)) as PageSchema }

export function validateSchema(schema: unknown): SchemaIssue[] {
  const issues: SchemaIssue[] = []
  if (!schema || typeof schema !== 'object') return [{ path: '', message: 'Schema 必须是对象' }]
  const page = (schema as Partial<PageSchema>).page
  if (typeof (schema as Partial<PageSchema>).schemaVersion !== 'number') issues.push({ path: 'schemaVersion', message: '缺少 Schema 版本' })
  if (!page || typeof page !== 'object') return [...issues, { path: 'page', message: '缺少页面对象' }]
  if (!page.root || typeof page.root !== 'object') return [...issues, { path: 'page.root', message: '缺少根节点' }]
  validateNode(page.root, 'page.root', issues); return issues
}
function validateNode(node: unknown, path: string, issues: SchemaIssue[]) {
  if (!node || typeof node !== 'object') { issues.push({ path, message: '节点必须是对象' }); return }
  const value = node as Partial<NodeSchema>
  if (!value.id) issues.push({ path: `${path}.id`, message: '节点缺少 id' })
  if (!value.type || !['page', 'section', 'text', 'image', 'button', 'form', 'countdown', 'coupon', 'modal', 'lottery', 'product', 'share'].includes(value.type)) issues.push({ path: `${path}.type`, message: '节点类型不支持' })
  if (!value.props || typeof value.props !== 'object') issues.push({ path: `${path}.props`, message: 'props 必须是对象' })
  if (!value.styles || typeof value.styles !== 'object') issues.push({ path: `${path}.styles`, message: 'styles 必须是对象' })
  if (value.children !== undefined) { if (!Array.isArray(value.children)) issues.push({ path: `${path}.children`, message: 'children 必须是数组' }); else value.children.forEach((child, index) => validateNode(child, `${path}.children[${index}]`, issues)) }
}
export function migrateSchema(input: PageSchema): PageSchema { const schema = cloneSchema(input); schema.schemaVersion = CURRENT_SCHEMA_VERSION; schema.page.root = migrateNode(schema.page.root); return schema }
function migrateNode(node: NodeSchema): NodeSchema { node.version ||= '1.0.0'; node.props ||= {}; node.styles ||= {}; node.events ||= []; if (node.children) node.children = node.children.map(migrateNode); return node }
