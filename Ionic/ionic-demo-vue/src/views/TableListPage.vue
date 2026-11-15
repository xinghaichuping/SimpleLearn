<template>
  <div class="table-page">
    <div v-if="!meta" class="ion-padding ion-text-center">加载中…</div>

    <template v-else>
      <ion-toolbar class="sub-toolbar">
        <ion-searchbar
          v-if="meta.search.length"
          :value="keyword"
          :debounce="400"
          placeholder="搜索…"
          @ionInput="onSearch"
        />
        <ion-button slot="end" @click="openCreate">新增</ion-button>
      </ion-toolbar>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th v-for="col in visibleColumns" :key="col.name">{{ col.label }}</th>
              <th class="actions-col">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="pkOf(row)">
              <td v-for="col in visibleColumns" :key="col.name" :title="formatCell(row[col.name])">
                {{ formatCell(row[col.name]) }}
              </td>
              <td class="actions-col">
                <ion-button size="small" fill="outline" @click="openEdit(row)">编辑</ion-button>
                <ion-button size="small" fill="outline" color="danger" @click="confirmDelete(row)">删除</ion-button>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td :colspan="visibleColumns.length + 1" class="empty">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pager ion-padding">
        <ion-button size="small" :disabled="page <= 1" @click="prev">上一页</ion-button>
        <span class="page-info">{{ total }} 条 · 第 {{ page }} / {{ totalPages }} 页</span>
        <ion-button size="small" :disabled="page >= totalPages" @click="next">下一页</ion-button>
        <span class="jump-group">
          <ion-input
            v-model="jumpPage"
            type="number"
            inputmode="numeric"
            class="jump-input"
            placeholder="页码"
            @keyup.enter="jumpTo"
          />
          <ion-button size="small" fill="outline" :disabled="!jumpPage" @click="jumpTo">跳转</ion-button>
        </span>
      </div>
    </template>

    <RowEditor
      v-if="meta && editorOpen"
      :meta="meta"
      :row="editingRow"
      @close="editorOpen = false"
      @saved="reload"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { IonToolbar, IonSearchbar, IonButton, IonInput, alertController, toastController } from '@ionic/vue'
import { adminGetTables, adminListRows, adminDeleteRow, type AdminTableMeta } from '@/services/api'
import RowEditor from '@/components/RowEditor.vue'

const props = defineProps<{ table: string }>()

const meta = ref<AdminTableMeta | null>(null)
const rows = ref<Record<string, any>[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const jumpPage = ref('')
const keyword = ref('')
const editorOpen = ref(false)
const editingRow = ref<Record<string, any> | null>(null)

const visibleColumns = computed(() => meta.value?.columns.filter((c) => !c.sensitive) || [])
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

onMounted(loadMeta)
watch(() => props.table, () => {
  page.value = 1
  keyword.value = ''
  loadMeta()
})

async function loadMeta() {
  try {
    const tables = await adminGetTables()
    meta.value = tables.find((t) => t.name === props.table) || null
    if (meta.value) await load()
  } catch (e) {
    console.error('加载元数据失败', e)
  }
}

// 加载数据
async function load() {
  if (!meta.value) return
  try {
    const res = await adminListRows(props.table, page.value, pageSize, keyword.value || undefined)
    rows.value = res.rows
    total.value = res.total
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

// ["user_id","domain","word_id"]

function pkOf(row: Record<string, any>): string {
  return (meta.value?.pk || []).map((p) => String(row[p])).join(',')
}
// 

// 格式化单元格显示
function formatCell(v: any): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

// 搜索框400ms自动搜索
function onSearch(ev: any) {
  keyword.value = ev.detail.value || ''
  page.value = 1
  load()
}

function prev() {
  if (page.value > 1) {
    page.value--
    load()
  }
}

function next() {
  if (page.value < totalPages.value) {
    page.value++
    load()
  }
}

function jumpTo() {
  // 十进制
  const n = parseInt(jumpPage.value, 10)
  if (isNaN(n)) return
  // 边界钳制：小于 1 归第 1 页，超过总页数归末页，避免发起无效请求
  const target = Math.min(Math.max(1, n), totalPages.value)
  if (target !== page.value) {
    page.value = target
    load()
  }
  jumpPage.value = ''
}

function reload() {
  editorOpen.value = false
  load()
}

function openCreate() {
  editingRow.value = null
  editorOpen.value = true
}

function openEdit(row: Record<string, any>) {
  editingRow.value = row
  editorOpen.value = true
}

async function confirmDelete(row: Record<string, any>) {
  const alert = await alertController.create({
    header: '确认删除',
    message: `确定要删除这条记录吗？（${pkOf(row)}）`,
    buttons: [
      { text: '取消', role: 'cancel' },
      {
        text: '删除',
        role: 'destructive',
        handler: async () => {
          try {
            await adminDeleteRow(props.table, pkOf(row))
            const toast = await toastController.create({ message: '已删除', duration: 1500 })
            await toast.present()
            load()
          } catch (e: any) {
            const toast = await toastController.create({ message: e?.message || '删除失败', duration: 2000 })
            await toast.present()
          }
        },
      },
    ],
  })
  await alert.present()
}
</script>

<style scoped>
.table-wrap {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  white-space: nowrap;
}
.data-table th,
.data-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #e0e0e0;
  text-align: left;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.data-table th {
  background: #f5f5f5;
}
.actions-col {
  white-space: nowrap;
}
.empty {
  text-align: center;
  color: #999;
  padding: 20px;
}
.pager {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
}
.page-info {
  color: #666;
  font-size: 13px;
}
.jump-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.jump-input {
  --padding-start: 8px;
  --padding-end: 8px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  min-width: 70px;
  max-width: 70px;
  text-align: center;
}
</style>
