import type { NodeSchema, PageSchema } from '@campaign/schema'

export interface ExportIssue { level: 'error' | 'warning'; message: string }

export function validateExport(schema: PageSchema): ExportIssue[] {
  const issues: ExportIssue[] = []
  const root = schema.page.root
  if (!(root.children?.length)) issues.push({ level: 'error', message: '页面没有内容区块' })
  if (!String(schema.page.title || root.props.title || '').trim()) issues.push({ level: 'error', message: '页面标题不能为空' })
  const visit = (node: NodeSchema) => {
    if (node.type === 'image' && !String(node.props.src ?? '').trim()) issues.push({ level: 'error', message: `图片节点 ${node.id} 缺少图片地址` })
    if (node.type === 'text' && !String(node.props.text ?? '').trim()) issues.push({ level: 'warning', message: `文字节点 ${node.id} 内容为空` })
    if (['button', 'modal', 'lottery', 'share'].includes(node.type) && !String(node.props.text ?? '').trim()) issues.push({ level: 'warning', message: `${node.type} 节点按钮文字为空` })
    if (node.type === 'form' && !Array.isArray(node.props.fields)) issues.push({ level: 'warning', message: `表单节点 ${node.id} 没有配置字段` })
    if (node.type === 'image' && String(node.props.src ?? '').startsWith('http')) issues.push({ level: 'warning', message: '页面包含远程图片，导出后仍依赖图片源站' })
    node.children?.forEach(visit)
  }
  root.children?.forEach(visit)
  return issues
}
