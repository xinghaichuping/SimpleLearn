import { ref } from 'vue'
// Vue 只会在“响应式数据变化”时才会去重新渲染（更新 DOM）
// useDropdown.ts
// 下拉菜单的状态管理，返回 showDropdown 和 toggleDropdown 方法
export function useDropdown() {
  const showDropdown = ref(false)
  const toggleDropdown = () => { showDropdown.value = !showDropdown.value }
  return { showDropdown, toggleDropdown }
}
