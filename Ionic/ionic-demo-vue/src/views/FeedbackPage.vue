<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>反馈</ion-title>
        <ion-buttons slot="end" v-if="isAdmin">
          <ion-button @click="goAdmin">管理全部反馈</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="feedback-container">
        <!-- 用户信息 -->
        <div class="user-card">
          <ion-icon :icon="personCircle" class="user-avatar"></ion-icon>
          <div>
            <p class="user-name">{{ username }}</p>
            <p class="user-id">用户 ID: {{ userId }}</p>
          </div>
        </div>

        <!-- 提交反馈 -->
        <div class="card">
          <h3 class="card-title">提交反馈</h3>
          <ion-segment v-model="visibility" class="vis-segment">
            <ion-segment-button value="public">
              <ion-label>🔓 公共</ion-label>
            </ion-segment-button>
            <ion-segment-button value="private">
              <ion-label>🔒 私人</ion-label>
            </ion-segment-button>
          </ion-segment>
          <ion-textarea
            v-model="content"
            :rows="4"
            :maxlength="2000"
            placeholder="写下你的建议或问题…"
          ></ion-textarea>
          <div class="submit-row">
            <span class="hint">{{ content.length }}/2000</span>
            <ion-button :disabled="submitting || !content.trim()" @click="submit">
              {{ submitting ? '提交中…' : '提交' }}
            </ion-button>
          </div>
          <p v-if="submitError" class="err-text">{{ submitError }}</p>
        </div>

        <!-- 列表筛选 -->
        <div class="list-header">
          <h3 class="card-title">反馈面板</h3>
          <ion-segment v-model="filter" class="filter-segment">
            <ion-segment-button value="all">
              <ion-label>全部</ion-label>
            </ion-segment-button>
            <ion-segment-button value="public">
              <ion-label>公共</ion-label>
            </ion-segment-button>
            <ion-segment-button value="private">
              <ion-label>我的私人</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>

        <div v-if="loading" class="state-hint">
          <ion-spinner name="crescent"></ion-spinner>
          <p>加载中…</p>
        </div>
        <div v-else-if="error" class="state-hint">
          <p>{{ error }}</p>
          <ion-button size="small" @click="load">重试</ion-button>
        </div>
        <div v-else-if="filtered.length === 0" class="state-hint">
          <p>暂无反馈</p>
        </div>
        <!-- 反馈列表 -->
        <div v-else class="feedback-list">
          <div v-for="f in filtered" :key="f.id" class="fb-card">
            <div class="fb-head">
              <ion-badge :color="f.visibility === 'public' ? 'primary' : 'warning'">
                {{ f.visibility === 'public' ? '公共' : '私人' }}
              </ion-badge>
              <span class="fb-meta">
                用户 {{ f.user_id }}<span v-if="f.username">（{{ f.username }}）</span>
              </span>
            </div>
            <p class="fb-content">{{ f.content }}</p>
            <p class="fb-time">{{ formatTime(f.created_at) }}</p>

            <div v-if="f.admin_reply" class="admin-reply">
              <div class="reply-tag">管理员回复</div>
              <p>{{ f.admin_reply }}</p>
              <p class="fb-time">{{ formatTime(f.replied_at) }}</p>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getUsername, getUserId, isAdmin } from '@/services/auth'
import { submitFeedback, getFeedbackList } from '@/services/api'
import type { FeedbackItem, FeedbackVisibility } from '@/services/api'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonLabel, IonBadge,
  IonSegment, IonSegmentButton, IonTextarea, IonSpinner, onIonViewWillEnter,
} from '@ionic/vue'
import { personCircle } from 'ionicons/icons'

const router = useRouter()
const username = ref('')
const userId = ref(0)

const visibility = ref<FeedbackVisibility>('public')
const content = ref('')
const submitting = ref(false)
const submitError = ref('')

const filter = ref<'all' | 'public' | 'private'>('all')
const items = ref<FeedbackItem[]>([])
const loading = ref(false)
const error = ref('')

// 如果 f.visibility === 'public' 成立，就返回 true
// 筛选出符合条件的反馈列表
const filtered = computed(() => {
  if (filter.value === 'public') return items.value.filter((f) => f.visibility === 'public')
  if (filter.value === 'private') return items.value.filter((f) => f.visibility === 'private')
  return items.value
})

function formatTime(v: string | null): string {
  if (!v) return ''
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleString()
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await getFeedbackList()
    items.value = res.items
  } catch (e: any) {
    error.value = e?.message || '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!content.value.trim()) return
  submitting.value = true
  submitError.value = ''
  try {
    await submitFeedback(visibility.value, content.value.trim())
    content.value = ''
    await load()
  } catch (e: any) {
    submitError.value = e?.message || '提交失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}

function goAdmin() {
  router.push('/admin/feedback')
}

onIonViewWillEnter(() => {
  username.value = getUsername()
  userId.value = getUserId()
  load()
})
</script>

<style scoped>
.feedback-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 16px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.user-avatar {
  font-size: 40px;
  color: #999;
}

.user-name {
  font-weight: 600;
  margin: 0 0 4px;
}

.user-id {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.card-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
}

.vis-segment,
.filter-segment {
  margin-bottom: 12px;
}

.submit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.hint {
  font-size: 12px;
  color: #bbb;
}

.err-text {
  color: #eb445a;
  font-size: 13px;
  margin: 8px 0 0;
}

.list-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 32px;
}

.fb-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.fb-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.fb-meta {
  font-size: 12px;
  color: #999;
}

.fb-content {
  margin: 0 0 6px;
  white-space: pre-wrap;
  word-break: break-word;
}

.fb-time {
  font-size: 11px;
  color: #bbb;
  margin: 0;
}

.admin-reply {
  margin-top: 10px;
  background: #eef6ff;
  border-left: 3px solid #3880ff;
  border-radius: 6px;
  padding: 10px 12px;
}

.reply-tag {
  font-size: 12px;
  font-weight: 600;
  color: #3880ff;
  margin-bottom: 4px;
}

.admin-reply p {
  margin: 0 0 4px;
  white-space: pre-wrap;
  word-break: break-word;
}

.state-hint {
  text-align: center;
  color: #999;
  padding: 24px 0;
}
</style>
