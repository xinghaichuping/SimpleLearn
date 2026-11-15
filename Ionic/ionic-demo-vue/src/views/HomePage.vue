<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>智能英语学习平台</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openPopover">菜单</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-popover :is-open="showDropdown" @didDismiss="showDropdown = false">
      <ion-content>
        <ion-list>
          <ion-item @click="logout">注销本次登录</ion-item>
        </ion-list>
      </ion-content>
    </ion-popover>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">智能英语学习平台</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="container">
        <strong class="welcome-title">Welcome To The Smart English Learning Platform</strong>

        <div class="study-section">
          <ion-item class="context-selector">
            <ion-label position="stacked">选择专业语境（必选）</ion-label>
            <ion-select
              v-model="selectedContext"
              placeholder="请选择专业语境"
              interface="popover"
            >
              <ion-select-option value="frontend">前端</ion-select-option>
              <ion-select-option value="frontend_mdps">前端MDPS</ion-select-option>
              <ion-select-option value="frontend_sm2">前端SM2</ion-select-option>
              <!-- <ion-select-option value="backend">后端</ion-select-option>
              <ion-select-option value="cloud">云计算</ion-select-option>
              <ion-select-option value="bigdata">大数据</ion-select-option>
              <ion-select-option value="database">数据库</ion-select-option> -->
            </ion-select>
          </ion-item>

          <ion-button
            expand="block"
            class="start-btn"
            @click="startLearning"
            :disabled="!selectedContext || loading"
          >
            {{ loading ? '加载中...' : '开始英语学习' }}
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDropdown } from '@/composables/useDropdown'
import { clearAuth } from '@/services/auth'
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonButtons, IonButton, IonList, IonItem, IonLabel,
  IonPopover, IonSelect, IonSelectOption,
} from '@ionic/vue'

const router = useRouter()
const { showDropdown } = useDropdown()

const selectedContext = ref('')
const loading = ref(false)

/** 前端语境 → 后端段落类型映射（与 startLearning 使用一致） */
const paragraphsTypeMap: Record<string, string> = {
  frontend: 'web',
  frontend_mdps: 'web_mdps',
  frontend_sm2: 'web_sm2',
  // backend: 'web',
  // cloud: 'web',
  // bigdata: 'web',
  // database: 'web',
}

function resolveParagraphsType(): string {
  return paragraphsTypeMap[selectedContext.value] || 'web'
}

function openPopover() {
  showDropdown.value = true
}

function go(path: string) {
  showDropdown.value = false
  router.push(path)
}

function openProduct() {
  showDropdown.value = false
  // 应用内预览页：按当前选中的语境跳转（未选择时默认 web 语境）
  router.push({
    name: 'Preview',
    query: {
      paragraphs_type: resolveParagraphsType(),
      context: selectedContext.value || 'frontend',
    },
  })
}

/** 注销登录：清除本地 token 信息并跳转到登录页 */
function logout() {
  showDropdown.value = false
  clearAuth()
  router.replace('/login')
}

async function startLearning() {
  if (!selectedContext.value) return
  loading.value = true
  try {
    // 先进入「学习内容预览」页，预览阅读后再由用户点击开始猜词
    const paragraphsType = resolveParagraphsType()
    router.push({ name: 'Preview', query: { paragraphs_type: paragraphsType, context: selectedContext.value } })
  } finally {
    loading.value = false
  }
}
</script>


<style scoped>
#container {
  text-align: center;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 24px 16px;
}

.welcome-title {
  font-size: 2rem;
  line-height: 1.2;
  font-weight: 700;
}

#container p {
  font-size: 16px;
  line-height: 22px;
  color: #8c8c8c;
  margin: 8px 0 0;
}

#container a {
  text-decoration: none;
}

.study-section {
  margin-top: 32px;
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
}

.context-selector {
  --background: transparent;
  --padding-start: 0;
  margin-bottom: 16px;
  text-align: left;
}

.start-btn {
  margin-top: 8px;
}
</style>
