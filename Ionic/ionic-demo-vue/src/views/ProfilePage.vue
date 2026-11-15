<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">← 返回首页</ion-button>
        </ion-buttons>
        <ion-title>个人主页</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="profile-container">
        <div class="avatar">
          <ion-icon :icon="personCircle" size="large"></ion-icon>
        </div>
        <h2>{{ username }}</h2>
        <p class="user-id">用户 ID: {{ userId }}</p>
        <div class="contact-row">
          <span class="contact-item">📧 {{ profileEmail || '未设置邮箱' }}</span>
          <span class="contact-item">📱 {{ profilePhone || '未设置手机号' }}</span>
        </div>
        <ion-button size="small" fill="outline" @click="openEditContact">修改联系方式</ion-button>
      </div>

      <div class="calendar-section">
        <div class="calendar-header">
          <ion-button fill="clear" size="small" @click="prevMonth">
            <ion-icon :icon="chevronBack" slot="icon-only"></ion-icon>
          </ion-button>
          <span class="calendar-title">{{ calTitle }}</span>
          <ion-button fill="clear" size="small" @click="nextMonth">
            <ion-icon :icon="chevronForward" slot="icon-only"></ion-icon>
          </ion-button>
        </div>

        <div v-if="calendarLoading" class="calendar-loading">
          <ion-spinner name="dots" />
        </div>
        <template v-else>
        <div class="calendar-grid">
          <div v-for="w in weekdayLabels" :key="w" class="cal-weekday">{{ w }}</div>
          <div
            v-for="cell in calendarGrid"
            :key="cell.date"
            class="cal-cell"
            :class="{
              out: !cell.inMonth,
              future: cell.isFuture,
              today: cell.isToday,
            }"
            @click="onDayClick(cell)"
          >
            <span class="cal-day-num">{{ cell.day }}</span>
            <span
              v-if="cell.inMonth && cell.data && cell.data.answers > 0"
              class="cal-dot"
              :class="{ done: cell.data.completed }"
            >{{ cell.data.completed ? '✓' : '' }}</span>
          </div>
        </div>

        <div class="calendar-legend">
          <span class="legend-item"><span class="legend-dot"></span>学了</span>
          <span class="legend-item"><span class="legend-dot legend-done">✓</span>完成全流程</span>
        </div>

        <div v-if="selectedDetail" class="calendar-detail">
          <p class="detail-date">{{ selectedDetail.date }}</p>
          <p v-if="selectedDetail.data" class="detail-body">
            答题 {{ selectedDetail.data.answers }} 题 · 答对 {{ selectedDetail.data.correct }} 题
            <span v-if="selectedDetail.data.completed" class="detail-done">· 已完成全流程 ✓</span>
            <span v-else class="detail-notdone">· 未完成全流程</span>
          </p>
          <p v-else class="detail-notdone">该日未学习</p>
        </div>
        <div v-else class="calendar-detail calendar-detail-hint">
          <p>点击日期查看当天学习详情</p>
        </div>
        </template>
      </div>

      <div class="vocab-section">
        <ion-item class="domain-selector">
          <ion-label position="stacked">选择学习域</ion-label>
          <ion-select
            v-model="selectedDomain"
            interface="popover"
            placeholder="请选择学习域"
          >
            <ion-select-option value="frontend">前端</ion-select-option>
            <ion-select-option value="frontend_mdps">前端MDPS</ion-select-option>
            <ion-select-option value="frontend_sm2">前端SM2</ion-select-option>
          </ion-select>
        </ion-item>

        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-num">{{ total }}</span>
            <span class="stat-label">总词数</span>
          </div>
          <div class="stat-card stat-learned">
            <span class="stat-num">{{ learnedCount }}</span>
            <span class="stat-label">已学</span>
          </div>
          <div class="stat-card stat-unlearned">
            <span class="stat-num">{{ unlearnedCount }}</span>
            <span class="stat-label">未学</span>
          </div>
        </div>

        <ion-segment v-model="filter" class="filter-segment">
          <ion-segment-button value="all">全部</ion-segment-button>
          <ion-segment-button value="learned">已学</ion-segment-button>
          <ion-segment-button value="unlearned">未学</ion-segment-button>
        </ion-segment>

        <div v-if="loading" class="state-hint">
          <ion-spinner name="crescent"></ion-spinner>
          <p>加载中...</p>
        </div>
        <div v-else-if="error" class="state-hint">
          <p>{{ error }}</p>
        </div>
        <div v-else-if="filteredWords.length === 0" class="state-hint">
          <p>暂无词汇</p>
        </div>
        <ion-list v-else class="word-list">
          <ion-item v-for="w in filteredWords" :key="w.word_id" lines="full">
            <ion-label>
              <div class="word-row">
                <span class="word-text">{{ w.word_text }}</span>
                <span v-if="w.phonetic_uk" class="word-phonetic">{{ w.phonetic_uk }}</span>
              </div>
              <div class="word-def">
                <span v-if="w.pos" class="word-pos">{{ w.pos }}</span>
                <span v-if="w.definition_cn">{{ w.definition_cn }}</span>
              </div>
            </ion-label>
            <ion-badge v-if="w.learned" color="success" class="word-badge">
              复习 {{ w.review_count }} 次
            </ion-badge>
            <ion-badge v-else color="medium" class="word-badge">未学</ion-badge>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getUsername, getUserId } from '@/services/auth'
import { getDomainWordProgress, getStudyCalendar, getMe, updateMyProfile } from '@/services/api'
import type { DomainWordProgressItem, CalendarDayItem } from '@/services/api'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonList, IonItem, IonLabel,
  IonSelect, IonSelectOption, IonSegment, IonSegmentButton,
  IonBadge, IonSpinner, onIonViewWillEnter, alertController, toastController,
} from '@ionic/vue'
import { personCircle, chevronBack, chevronForward } from 'ionicons/icons'

const router = useRouter()
const username = ref('')
const userId = ref(0)
const profileEmail = ref('')
const profilePhone = ref('')

const selectedDomain = ref('frontend')
const filter = ref<'all' | 'learned' | 'unlearned'>('all')

const total = ref(0)
const learnedCount = ref(0)
const unlearnedCount = ref(0)
const words = ref<DomainWordProgressItem[]>([])
const loading = ref(false)
const error = ref('')

const domainTypeMap: Record<string, string> = {
  frontend: 'web',
  frontend_mdps: 'web_mdps',
  frontend_sm2: 'web_sm2',
}

// ---- 学习日历 ----
interface CalCell {
  date: string
  day: number
  inMonth: boolean
  isFuture: boolean
  isToday: boolean
  data?: CalendarDayItem
}

const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日']
const calYear = ref(new Date().getFullYear())
const calMonth = ref(new Date().getMonth()) // 0-11
const calendarMap = ref<Record<string, CalendarDayItem>>({})
const selectedDate = ref('')
const calendarLoading = ref(true)

const calTitle = computed(() => `${calYear.value} 年 ${calMonth.value + 1} 月`)

function fmtDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

const calendarGrid = computed<CalCell[]>(() => {
  const startWeekday = (new Date(calYear.value, calMonth.value, 1).getDay() + 6) % 7 // 周一=0
  const daysInMonth = new Date(calYear.value, calMonth.value + 1, 0).getDate()
  const today = new Date()
  const todayStr = fmtDate(today.getFullYear(), today.getMonth(), today.getDate())
  const cells: CalCell[] = []

  // 上月补齐
  const prevLastDay = new Date(calYear.value, calMonth.value, 0).getDate()
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = prevLastDay - i
    const y = calMonth.value === 0 ? calYear.value - 1 : calYear.value
    const m = calMonth.value === 0 ? 11 : calMonth.value - 1
    const date = fmtDate(y, m, d)
    cells.push({ date, day: d, inMonth: false, isFuture: false, isToday: date === todayStr, data: calendarMap.value[date] })
  }

  // 当月
  for (let d = 1; d <= daysInMonth; d++) {
    const date = fmtDate(calYear.value, calMonth.value, d)
    const cellDate = new Date(calYear.value, calMonth.value, d)
    cells.push({
      date,
      day: d,
      inMonth: true,
      isFuture: cellDate.getTime() > today.getTime(),
      isToday: date === todayStr,
      data: calendarMap.value[date],
    })
  }

  // 下月补齐到整周
  const remaining = (7 - (cells.length % 7)) % 7
  for (let i = 1; i <= remaining; i++) {
    const y = calMonth.value === 11 ? calYear.value + 1 : calYear.value
    const m = calMonth.value === 11 ? 0 : calMonth.value + 1
    const date = fmtDate(y, m, i)
    cells.push({ date, day: i, inMonth: false, isFuture: true, isToday: date === todayStr, data: calendarMap.value[date] })
  }

  return cells
})

const selectedDetail = computed(() => {
  if (!selectedDate.value) return null
  const [y, m] = selectedDate.value.split('-').map(Number)
  if (y !== calYear.value || m - 1 !== calMonth.value) return null
  return { date: selectedDate.value, data: calendarMap.value[selectedDate.value] }
})

function prevMonth() {
  if (calMonth.value === 0) { calMonth.value = 11; calYear.value-- }
  else calMonth.value--
}

function nextMonth() {
  if (calMonth.value === 11) { calMonth.value = 0; calYear.value++ }
  else calMonth.value++
}

function onDayClick(cell: CalCell) {
  if (!cell.inMonth || cell.isFuture) return
  selectedDate.value = cell.date
}

async function loadCalendar() {
  try {
    const res = await getStudyCalendar(12)
    const map: Record<string, CalendarDayItem> = {}
    for (const d of res.days) map[d.date] = d
    calendarMap.value = map
  } catch (e: any) {
    // 日历加载失败不阻塞主页其余内容
    console.warn('学习日历加载失败', e?.message)
  } finally {
    calendarLoading.value = false
  }
}

const filteredWords = computed(() => {
  if (filter.value === 'learned') return words.value.filter((w) => w.learned)
  if (filter.value === 'unlearned') return words.value.filter((w) => !w.learned)
  return words.value
})

function goBack() {
  router.push('/home')
}

function refreshProfile() {
  username.value = getUsername()
  userId.value = getUserId()
}

async function loadProgress() {
  loading.value = true
  error.value = ''
  try {
    const paragraphsType = domainTypeMap[selectedDomain.value] || 'web'
    const res = await getDomainWordProgress(paragraphsType)
    total.value = res.total
    learnedCount.value = res.learned_count
    unlearnedCount.value = res.unlearned_count
    words.value = res.words
  } catch (e: any) {
    error.value = e?.message || '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

watch(selectedDomain, loadProgress)

async function loadContact() {
  try {
    const me = await getMe()
    profileEmail.value = me.email || ''
    profilePhone.value = me.phone || ''
  } catch {
    // 服务端不可用：保持为空，不影响主页其余内容
  }
}

async function openEditContact() {
  const alert = await alertController.create({
    header: '修改联系方式',
    inputs: [
      { name: 'email', type: 'email', placeholder: '邮箱（留空=清除）', value: profileEmail.value },
      { name: 'phone', type: 'tel', placeholder: '手机号（留空=清除）', value: profilePhone.value },
    ],
    buttons: [
      { text: '取消', role: 'cancel' },
      { text: '保存', handler: (data) => onSaveContact(data) },
    ],
  })
  await alert.present()
}

async function onSaveContact(data: any) {
  const email = (data?.email || '').trim() || null
  const phone = (data?.phone || '').trim() || null
  try {
    await updateMyProfile({ email, phone })
    profileEmail.value = email || ''
    profilePhone.value = phone || ''
    const toast = await toastController.create({ message: '联系方式已更新', duration: 1500 })
    await toast.present()
    return true
  } catch (e: any) {
    const toast = await toastController.create({
      message: e?.message || '保存失败，请稍后重试',
      duration: 2500,
    })
    await toast.present()
    return false
  }
}

onMounted(refreshProfile)
// 切TAB、子页面返回
onIonViewWillEnter(async () => {
  refreshProfile()
  await Promise.all([loadProgress(), loadCalendar(), loadContact()])
})
</script>

<style scoped>
.profile-container {
  text-align: center;
  padding: 32px 16px 16px;
}

.avatar {
  font-size: 72px;
  color: #ccc;
  margin-bottom: 12px;
}

h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.user-id {
  font-size: 14px;
  color: #999;
  margin-bottom: 8px;
}

.contact-row {
  display: flex;
  flex-direction: column;
  margin: 4px 0 12px;
  font-size: 14px;
  color: #666;
}

.contact-item {
  line-height: 1.6;
}

.vocab-section {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 16px 32px;
}

.domain-selector {
  --background: transparent;
  --padding-start: 0;
  margin-bottom: 16px;
  text-align: left;
}

.stats-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 16px 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
}

.stat-learned {
  background: #e8f5e9;
}

.stat-unlearned {
  background: #fafafa;
}

.stat-num {
  font-size: 24px;
  font-weight: 700;
}

.stat-label {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.filter-segment {
  margin-bottom: 16px;
}

.state-hint {
  text-align: center;
  color: #999;
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.word-list {
  border-radius: 12px;
  overflow: hidden;
}

.word-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.word-text {
  font-size: 16px;
  font-weight: 600;
}

.word-phonetic {
  font-size: 13px;
  color: #888;
}

.word-def {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.word-pos {
  color: #999;
  margin-right: 6px;
  font-style: italic;
}

.word-badge {
  flex-shrink: 0;
}

/* ---- 学习日历 ---- */
.calendar-section {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 16px 24px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.calendar-title {
  font-size: 16px;
  font-weight: 600;
}

.calendar-loading {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

.calendar-grid {
  display: flex;
  flex-wrap: wrap;
}

.cal-weekday {
  width: calc((100% - 28px) / 7);
  margin: 0 2px;
  box-sizing: border-box;
  text-align: center;
  font-size: 12px;
  color: #999;
  padding: 6px 0;
}

.cal-cell {
  position: relative;
  width: calc((100% - 28px) / 7);
  margin: 0 2px 4px;
  box-sizing: border-box;
  height: 42px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  background: #f7f7f7;
}

.cal-cell.out {
  background: transparent;
  cursor: default;
  color: #ccc;
}

.cal-cell.future {
  color: #ccc;
  cursor: not-allowed;
}

.cal-cell.today {
  box-shadow: inset 0 0 0 2px var(--ion-color-primary, #3880ff);
}

.cal-day-num {
  font-size: 14px;
  line-height: 1;
}

.cal-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2dd36f;
  margin-top: 3px;
}

.cal-dot.done {
  width: 16px;
  height: 16px;
  color: #fff;
  font-size: 11px;
  line-height: 16px;
  text-align: center;
  margin-top: 2px;
}

.calendar-legend {
  display: flex;
  gap: 16px;
  margin: 12px 0 8px;
  font-size: 12px;
  color: #666;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2dd36f;
}

.legend-dot.legend-done {
  color: #fff;
  text-align: center;
  font-size: 9px;
  line-height: 10px;
}

.calendar-detail {
  margin-top: 12px;
  padding: 12px;
  background: #f7f7f7;
  border-radius: 8px;
  font-size: 14px;
}

.calendar-detail-hint {
  color: #999;
  text-align: center;
}

.detail-date {
  font-weight: 600;
  margin: 0 0 4px;
}

.detail-body {
  margin: 0;
}

.detail-done {
  color: #2dd36f;
}

.detail-notdone {
  color: #999;
}
</style>
