import { createNode, type NodeSchema, type PageSchema } from '@campaign/schema'

export interface TemplateRecord {
  id: string
  name: string
  description: string
  category: string
  builtin?: boolean
  createdAt?: number
  schema: PageSchema
}

type Styles = Record<string, string>

const page = (title: string, children: NodeSchema[]): PageSchema => ({
  schemaVersion: 1,
  page: { id: `template-${title}`, title, root: createNode('page', { props: { title }, children }) },
})

const text = (value: string, level: 'h1' | 'p' = 'p', styles: Styles = {}) => createNode('text', { props: { text: value, level }, styles })
const section = (children: NodeSchema[], styles: Styles = {}) => createNode('section', { children, styles })
const image = (src: string, alt: string, styles: Styles = {}) => createNode('image', { props: { src, alt }, styles })
const button = (value: string, styles: Styles = {}) => createNode('button', { props: { text: value }, styles })

const dark = '#183f4a'
const coral = '#ef6c4d'
const muted = '#607174'
const lifestyleImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80'
const summerImage = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80'
const eventImage = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80'

export const builtInTemplates: TemplateRecord[] = [
  {
    id: 'template-flash-sale', name: '限时促销', description: '用倒计时、优惠券和抽奖制造紧迫感，适合短周期促销和大促会场。', category: '促销活动', builtin: true,
    schema: page('限时促销', [
      section([
        text('限时福利，先到先得', 'h1', { color: '#ffffff', fontSize: '28px', fontWeight: '700' }),
        text('今日下单享专属礼遇，错过本场再等一年', 'p', { color: '#dbe6e4', marginTop: '10px' }),
        button('立即抢购', { background: coral, color: '#ffffff', marginTop: '18px' }),
      ], { padding: '38px 20px 30px', background: dark, color: '#ffffff', textAlign: 'center' }),
      image(summerImage, '夏日促销主视觉', { height: '220px' }),
      section([
        text('距离优惠结束还有', 'p', { color: muted, textAlign: 'center' }),
        createNode('countdown', { styles: { marginTop: '8px', textAlign: 'center', padding: '16px', background: '#fff4ef', color: '#c94f36' } }),
      ], { padding: '20px 16px', background: '#ffffff' }),
      section([
        text('新客专享优惠', 'h1', { fontSize: '22px', textAlign: 'center' }),
        createNode('coupon', { props: { title: '新人立减券', amount: '50', description: '满199元可用' }, styles: { marginTop: '12px' } }),
        button('领取优惠并查看商品', { background: coral, color: '#ffffff', width: '100%', marginTop: '12px' }),
      ], { padding: '24px 16px', background: '#fffaf7' }),
      section([
        text('本场热卖推荐', 'h1', { fontSize: '22px' }),
        createNode('product', { props: { name: '夏日限定礼盒', price: '199', image: lifestyleImage }, styles: { marginTop: '12px' } }),
        createNode('product', { props: { name: '轻盈通勤单品', price: '129', image: summerImage }, styles: { marginTop: '10px' } }),
      ], { padding: '26px 16px', background: '#ffffff' }),
      section([
        text('再抽一次，赢免单好礼', 'h1', { fontSize: '22px', textAlign: 'center' }),
        text('完成购买后即可参与抽奖，中奖名单每日公布', 'p', { color: muted, textAlign: 'center' }),
        createNode('lottery', { styles: { marginTop: '10px' } }),
      ], { padding: '24px 16px', background: '#fff1f2' }),
      section([
        text('留下联系方式，获取专属提醒', 'h1', { fontSize: '22px' }),
        createNode('form', { styles: { marginTop: '12px' } }),
        createNode('share', { styles: { marginTop: '10px' } }),
      ], { padding: '28px 16px', background: '#f5faf8' }),
    ]),
  },
  {
    id: 'template-product-launch', name: '新品发布', description: '从新品主视觉到卖点、商品卡片和分享传播，适合新品首发和预售收集。', category: '新品发布', builtin: true,
    schema: page('新品发布', [
      image(lifestyleImage, '新品主视觉', { height: '270px' }),
      section([
        text('全新生活方式，现在登场', 'h1', { fontSize: '27px', textAlign: 'center' }),
        text('为日常加入一点轻松，也为这个夏天准备一份新礼物', 'p', { marginTop: '10px', color: muted, textAlign: 'center' }),
        button('预约新品体验', { background: coral, color: '#ffffff', marginTop: '18px' }),
      ], { padding: '30px 20px', background: '#ffffff' }),
      section([
        text('为什么值得期待', 'h1', { fontSize: '22px' }),
        text('01 轻量设计，全天舒适', 'p', { marginTop: '14px', fontWeight: '700' }),
        text('02 经典配色，轻松融入不同场景', 'p', { marginTop: '8px', color: muted }),
        text('03 限量首发，先预约先体验', 'p', { marginTop: '8px', color: muted }),
      ], { padding: '26px 20px', background: '#f5faf8' }),
      section([
        text('新品首发价', 'h1', { fontSize: '22px', textAlign: 'center' }),
        createNode('product', { props: { name: '夏日限定礼盒', price: '199', image: lifestyleImage }, styles: { marginTop: '12px' } }),
        createNode('coupon', { props: { title: '预约专享券', amount: '30', description: '首发当日可抵扣' }, styles: { marginTop: '14px' } }),
      ], { padding: '28px 16px', background: '#fffaf7' }),
      section([
        text('首发倒计时', 'h1', { fontSize: '22px', textAlign: 'center' }),
        createNode('countdown', { styles: { marginTop: '12px', background: '#ffffff' } }),
        createNode('share', { styles: { marginTop: '8px' } }),
      ], { padding: '24px 16px', background: '#ffffff' }),
      section([
        text('成为首批体验官', 'h1', { fontSize: '22px' }),
        text('填写联系方式，新品上线后我们会第一时间通知你', 'p', { marginTop: '8px', color: muted }),
        createNode('form', { styles: { marginTop: '12px' } }),
      ], { padding: '30px 16px', background: dark, color: '#ffffff' }),
    ]),
  },
  {
    id: 'template-registration', name: '活动报名', description: '包含活动介绍、亮点、报名表单和详情入口，适合线下活动、体验会和公开课。', category: '报名收集', builtin: true,
    schema: page('活动报名', [
      image(eventImage, '活动现场主视觉', { height: '230px' }),
      section([
        text('城市体验官招募中', 'h1', { color: '#c94f36', fontSize: '28px' }),
        text('一场关于生活方式、灵感与真实体验的线下聚会', 'p', { marginTop: '10px', color: muted }),
        button('立即报名', { background: coral, color: '#ffffff', marginTop: '18px' }),
      ], { padding: '30px 20px', background: '#fff4ef', textAlign: 'center' }),
      section([
        text('你将获得什么', 'h1', { fontSize: '22px' }),
        text('现场体验新品，与品牌主理人面对面交流', 'p', { marginTop: '14px' }),
        text('参与互动任务，领取限定伴手礼', 'p', { marginTop: '9px', color: muted }),
        text('和同频伙伴认识，交换真实灵感', 'p', { marginTop: '9px', color: muted }),
        createNode('modal', { props: { text: '查看活动详情', title: '活动详情', content: '活动时间：本周六 14:00\n活动地点：城市生活空间\n名额有限，先到先得' }, styles: { marginTop: '12px' } }),
      ], { padding: '28px 20px', background: '#ffffff' }),
      section([
        text('报名截止倒计时', 'h1', { fontSize: '22px', textAlign: 'center' }),
        createNode('countdown', { styles: { marginTop: '10px' } }),
      ], { padding: '22px 16px', background: '#f5faf8' }),
      section([
        text('填写信息，锁定活动席位', 'h1', { fontSize: '22px' }),
        text('提交后请保持电话畅通，工作人员会与您确认', 'p', { marginTop: '8px', color: muted }),
        createNode('form', { styles: { marginTop: '12px' } }),
      ], { padding: '30px 16px', background: '#ffffff' }),
      section([
        text('邀请朋友一起参加', 'h1', { fontSize: '20px', textAlign: 'center' }),
        createNode('share', { styles: { marginTop: '8px' } }),
      ], { padding: '22px 16px', background: '#fffaf7' }),
    ]),
  },
]
