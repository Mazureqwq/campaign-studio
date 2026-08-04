import { reactive } from 'vue'

export const dragSession = reactive({
  sourceId: '',
  targetId: '',
  position: 'before' as 'before' | 'after',
  height: 64,
})
