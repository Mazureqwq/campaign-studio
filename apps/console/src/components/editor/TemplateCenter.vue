<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '../../stores/editor'
import { builtInTemplates, type TemplateRecord } from '../../templates'

const emit = defineEmits<{ close: [] }>()
const store = useEditorStore()
const { customTemplates } = storeToRefs(store)
const activeCategory = ref('全部')
const showSaveForm = ref(false)
const name = ref('')
const description = ref('')
const categories = ['全部', '促销活动', '新品发布', '报名收集', '自定义']
const templates = computed(() => [...builtInTemplates, ...customTemplates.value].filter((template) => activeCategory.value === '全部' || template.category === activeCategory.value))

function apply(template: TemplateRecord) {
  if (window.confirm(`应用“${template.name}”将替换当前页面，是否继续？`)) { store.applyTemplate(template); emit('close') }
}
function save() {
  store.saveAsTemplate(name.value, description.value)
  name.value = ''; description.value = ''; showSaveForm.value = false; activeCategory.value = '自定义'
}
</script>

<template>
  <div class="template-backdrop" @click.self="emit('close')">
    <section class="template-drawer" role="dialog" aria-label="模板中心">
      <header class="template-header"><div><h2>模板中心</h2><p>选择一个营销场景快速开始</p></div><button type="button" class="icon-button" aria-label="关闭模板中心" @click="emit('close')">×</button></header>
      <div class="template-toolbar"><div class="template-tabs"><button v-for="category in categories" :key="category" type="button" :class="{ active: activeCategory === category }" @click="activeCategory = category">{{ category }}</button></div><button type="button" class="primary" @click="showSaveForm = !showSaveForm">保存当前为模板</button></div>
      <form v-if="showSaveForm" class="template-save-form" @submit.prevent="save"><input v-model="name" required placeholder="模板名称"/><input v-model="description" placeholder="模板描述（可选）"/><button type="submit" class="primary">保存</button></form>
      <div class="template-grid">
        <article v-for="template in templates" :key="template.id" class="template-card">
          <div class="template-cover" :style="{ background: template.schema.page.root.children?.[0]?.styles.background || '#edf5f3' }"><span>{{ template.category }}</span><strong>{{ template.name }}</strong><small>{{ template.schema.page.root.children?.length ?? 0 }} 个区块</small></div>
          <div class="template-card-body"><h3>{{ template.name }}</h3><p>{{ template.description }}</p><div class="template-card-actions"><button type="button" class="primary" @click="apply(template)">应用模板</button><button v-if="!template.builtin" type="button" class="text-button" @click="store.removeTemplate(template.id)">删除</button></div></div>
        </article>
        <div v-if="templates.length === 0" class="template-empty">暂无自定义模板</div>
      </div>
    </section>
  </div>
</template>
