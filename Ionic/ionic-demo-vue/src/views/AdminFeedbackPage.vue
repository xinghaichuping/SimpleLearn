<template>
  <div class="admin-feedback">
    <ion-toolbar class="sub-toolbar">
      <ion-segment :value="filter" @ionChange="onFilter">
        <ion-segment-button value="all">
          <ion-label>全部</ion-label>
        </ion-segment-button>
        <ion-segment-button value="public">
          <ion-label>公共</ion-label>
        </ion-segment-button>
        <ion-segment-button value="private">
          <ion-label>私人</ion-label>
        </ion-segment-button>
        <ion-segment-button value="unreplied">
          <ion-label>待回复</ion-label>
        </ion-segment-button>
      </ion-segment>
    </ion-toolbar>

    <div v-if="loading" class="ion-padding ion-text-center">
      <ion-spinner name="crescent"></ion-spinner>
    </div>
    <div v-else-if="error" class="ion-padding ion-text-center">
      <p>{{ error }}</p>
      <ion-button size="small" @click="load">重试</ion-button>
    </div>
    <div v-else-if="filtered.length === 0" class="ion-padding ion-text-center">
      <p class="muted">暂无反馈</p>
    </div>
    <div v-else class="fb-list">
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
          <div class="reply-tag">已回复 · {{ formatTime(f.replied_at) }}</div>
          <p>{{ f.admin_reply }}</p>
        </div>
        <div v-else class="reply-box">
          <ion-textarea
            v-model="drafts[f.id]"
            :rows="2"
            placeholder="输入回复…"
          ></ion-textarea>
          <ion-button
            size="small"
            :disabled="!drafts[f.id] || !drafts[f.id].trim()"
            @click="reply(f.id)"
          >
            回复
          </ion-button>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { adminListFeedback, adminReplyFeedback } from '@/services/api'
import type { FeedbackItem } from '@/services/api'
import {
  IonToolbar, IonSegment, IonSegmentButton, IonLabel, IonBadge,
  IonTextarea, IonButton, IonSpinner,
} from '@ionic/vue'

const filter = ref<'all' | 'public' | 'private' | 'unreplied'>('all')
const items = ref<FeedbackItem[]>([])
const loading = ref(false)
const error = ref('')
const drafts = reactive<Record<number, string>>({})

const filtered = computed(() => {
  switch (filter.value) {
    case 'public':
      return items.value.filter((f) => f.visibility === 'public')
    case 'private':
      return items.value.filter((f) => f.visibility === 'private')
    case 'unreplied':
      return items.value.filter((f) => !f.admin_reply)
    default:
      return items.value
  }
})

function onFilter(e: CustomEvent) {
  filter.value = e.detail.value as any
}

function formatTime(v: string | null): string {
  if (!v) return ''
  const d = new Date(v)
  return isNaN(d.getTime()) ? v : d.toLocaleString()
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await adminListFeedback()
    items.value = res.items
  } catch (e: any) {
    error.value = e?.message || '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

async function reply(id: number) {
  const text = (drafts[id] || '').trim()
  if (!text) return
  try {
    await adminReplyFeedback(id, text)
    delete drafts[id]
    await load()
  } catch (e: any) {
    error.value = e?.message || '回复失败，请稍后重试'
  }
}

onMounted(load)
</script>


<style scoped>
.admin-feedback {
  max-width: 760px;
  margin: 0 auto;
  padding: 0 16px 32px;
}

.sub-toolbar {
  --background: transparent;
  --padding-start: 0;
  --padding-end: 0;
  margin: 8px 0 16px;
}

.fb-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.reply-box {
  margin-top: 10px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.muted {
  color: #999;
}
</style>
