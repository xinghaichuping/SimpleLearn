<template>
  <ion-page>
    <ion-split-pane content-id="admin-main" when="md">
    <ion-menu content-id="admin-main" side="start">
      <ion-header>
        <ion-toolbar>
          <ion-title>数据表</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-item
            v-for="t in tables"
            :key="t.name"
            button
            :router-link="`/admin/${t.name}`"
            router-direction="root"
            :detail="false"
            :class="{ 'menu-active': activeTable === t.name }"
          >
            <ion-label>{{ t.label }}</ion-label>
          </ion-item>
          <ion-item
            button
            router-link="/admin/feedback"
            router-direction="root"
            :detail="false"
            :class="{ 'menu-active': activeTable === 'feedback' }"
          >
            <ion-label>📋 反馈管理</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>

    <ion-page id="admin-main">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-menu-button />
          </ion-buttons>
          <!-- 中间展示动态改变 -->
          <ion-title>{{ currentLabel }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="logout">退出</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <AdminFeedbackPage v-if="activeTable === 'feedback'" />
        <TableListPage v-else-if="activeTable" :table="activeTable" />
      </ion-content>
    </ion-page>
    </ion-split-pane>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonSplitPane,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonPage,
  IonButtons,
  IonMenuButton,
  IonButton,
} from '@ionic/vue'
import { adminGetTables, type AdminTableMeta } from '@/services/api'
import { clearAuth } from '@/services/auth'
import TableListPage from '@/views/TableListPage.vue'
import AdminFeedbackPage from '@/views/AdminFeedbackPage.vue'

const route = useRoute()
const router = useRouter()
const tables = ref<AdminTableMeta[]>([])

const activeTable = computed(() => {
  if (route.path === '/admin/feedback') return 'feedback'
  return (route.params.table as string) || ''
})

// 
const currentLabel = computed(() => {
  if (activeTable.value === 'feedback') return '反馈管理'
  // find 方法遍历数组，返回第一个满足条件的元素本身；如果没有找到，返回 undefined
  // 相等返回 true，不相等返回 false
  // 遍历 tables.value.name 
  const t = tables.value.find((x) => x.name === activeTable.value)
  return t ? t.label : activeTable.value
  // 
  // { name: "Users", label: "用户", pk: ["user_id"], auto_pk: true, search: [...], columns: [...] } 
  // 
})

onMounted(async () => {
  try {
    tables.value = await adminGetTables()
  } catch (e) {
    console.error('加载表元数据失败', e)
  }
})

// [
//     {                                     # 第 1 张表的元数据
//         "name": "Users",                  # 表名
//         "label": "用户",                  # 中文名
//         "pk": ["user_id"],                # 主键
//         "auto_pk": True,                  # 是否自增主键
//         "search": ["username", ...],      # 搜索列
//         "columns": [                      # 这张表所有列的元数据
//             {"name": "user_id", "label": "user_id", "type": "integer", "editable": False, ...},
//             {"name": "username", "label": "用户名", "type": "text", "editable": True, ...},
//             ...
//         ],
//     },

function logout() {
  clearAuth()
  router.replace('/login')
}
</script>

<style scoped>
.menu-active {
  --background: var(--ion-color-primary, #3880ff);
  --color: #fff;
}
</style>
