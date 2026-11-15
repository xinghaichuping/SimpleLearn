<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">← 返回首页</ion-button>
        </ion-buttons>
        <ion-title>{{ pageTitle }}</ion-title>
        <ion-buttons slot="end">
          <ion-badge v-if="pageStatus === 'reciting'" color="success">{{ masteredIds.size }}</ion-badge>
          <span v-if="pageStatus === 'reciting'" class="progress-text">/ {{ allWords.length }}</span>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- ============================================================ -->
      <!-- 状态 1: reciting — 猜词游戏                                    -->
      <!-- ============================================================ -->
      <template v-if="pageStatus === 'reciting'">
        <!-- 加载中 -->
        <div v-if="isLoading" class="ion-padding ion-text-center empty-state">
          <ion-spinner></ion-spinner>
          <p>单词加载中...</p>
        </div>
        <!-- 空状态 -->
        <div v-else-if="allWords.length === 0" class="ion-padding ion-text-center empty-state">
          <p>暂无学习内容, 请联系管理员</p>
          <ion-button @click="goBack">返回首页</ion-button>
        </div>

        <!-- 猜词游戏 -->
        <div v-else class="ion-padding study-container">
          <!-- 题干 -->
          <div class="question-area">
            <p class="question-label">📚 以下释义是哪个单词？</p>
            <ion-card class="definition-card" :class="answerClass">
              <ion-card-content>
                <p class="definition-text">{{ questionDefinition }}</p>
                <p v-if="answered" class="answer-reveal">
                  <template v-if="isLastCorrect">✔ 正确！就是 <strong>{{ correctWord?.word_text }}</strong></template>
                  <template v-else>❌ 不对，正确答案是 <strong>{{ correctWord?.word_text }}</strong></template>
                </p>
              </ion-card-content>
            </ion-card>
          </div>

          <!-- 四个单词卡（2×2 网格） -->
          <div class="word-grid">
            <ion-card
              v-for="word in currentFour"
              :key="word.word_id"
              class="word-card"
              :class="cardClass(word.word_id)"
              :button="!answered"
              @click="!answered && guessWord(word.word_id)"
            >
              <ion-card-header>
                <ion-card-title class="word-text">{{ word.word_text }}</ion-card-title>
              </ion-card-header>
              <ion-card-content v-if="revealedWordId === word.word_id">
                <div class="word-phonetics" v-if="word.phonetic_uk || word.phonetic_us">
                  <span v-if="word.phonetic_uk" class="phonetic-uk">英 [{{ word.phonetic_uk }}]</span>
                  <span v-if="word.phonetic_us" class="phonetic-us">美 [{{ word.phonetic_us }}]</span>
                </div>
                <div class="word-pos" v-if="word.pos">
                  <span class="pos-badge">{{ word.pos }}</span>
                </div>
                <div class="word-definition-cn" v-if="word.definition_cn">
                  <p>{{ word.definition_cn }}</p>
                </div>
                <div class="word-definition-en" v-if="word.definition_en">
                  <p class="definition-en-text">{{ word.definition_en }}</p>
                </div>
              </ion-card-content>
              <div class="card-footer">
                <ion-button size="small" fill="clear" @click.stop="togglePreview(word.word_id)" :disabled="answered">
                  {{ revealedWordId === word.word_id ? '收起' : '查看' }}
                </ion-button>
              </div>
            </ion-card>
          </div>

          <div v-if="answered" class="action-area">
            <ion-button expand="block" @click="nextRound" color="primary">下一题</ion-button>
          </div>
        </div>
      </template>

      <!-- ============================================================ -->
      <!-- 状态 2: chatting — LLM 对话                                    -->
      <!-- ============================================================ -->
      <template v-if="pageStatus === 'chatting'">
        <!-- 加载中：等待后端生成问题 -->
        <div v-if="isLoadingQuestion" class="ion-padding ion-text-center empty-state">
          <ion-spinner></ion-spinner>
          <p>正在生成对话问题...</p>
        </div>
        <div v-else class="ion-padding chat-container">
          <!-- LLM 问题 -->
          <div class="llm-question-card">
            <ion-card>
              <ion-card-header>
                <ion-card-subtitle>🤖 智能学伴提问</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <p class="llm-question-text">{{ llmQuestion }}</p>
              </ion-card-content>
            </ion-card>
          </div>

          <!-- 对话历史（多轮问答） -->
          <div v-for="(msg, i) in chatHistory" :key="i" class="llm-msg-item">
            <ion-card :color="msg.role === 'user' ? '' : 'light'">
              <ion-card-header>
                <ion-card-subtitle>{{ msg.role === 'user' ? '👤 我的回答' : '🤖 智能学伴回复' }}</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <p class="llm-reply-text">{{ msg.content }}</p>
              </ion-card-content>
            </ion-card>
          </div>

          <!-- 对话框：可多轮对话，随时可结束 -->
          <div class="chat-input-area">
            <ion-item>
              <ion-textarea
                v-model="userAnswer"
                placeholder="请在此输入你的回答..."
                :auto-grow="true"
                :rows="3"
                :disabled="isSubmitting"
              ></ion-textarea>
            </ion-item>
            <ion-button
              expand="block"
              @click="submitAnswer"
              :disabled="!userAnswer.trim() || isSubmitting"
            >
              {{ isSubmitting ? '提交中...' : '提交回答' }}
            </ion-button>
            <ion-button
              v-if="chatHistory.length > 0"
              expand="block"
              color="success"
              @click="finishChat"
            >
              完成对话，结束今日学习
            </ion-button>
          </div>
        </div>
      </template>

      <!-- ============================================================ -->
      <!-- 状态 3: done — 今日完成                                        -->
      <!-- ============================================================ -->
      <template v-if="pageStatus === 'done'">
        <div class="ion-padding ion-text-center empty-state">
          <h2>🎉 完成！</h2>
          <p>今天的背诵已经完成了，休息休息吧</p>
          <ion-button @click="goBack">返回首页</ion-button>
        </div>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  reportAnswer, paragraphStudy,
  getStudyStatus, completeStudy, getLLMQuestion,
  submitLLMAnswer, finishStudy,
  getExpiredTime, getWordLists,
} from '@/services/api'

import type { StudyWordInfo, StudyStatus } from '@/services/api'
import {
  getMasteredCache, setMasteredCache, clearMasteredCache,
  getChatHistoryCache, setChatHistoryCache, clearChatHistoryCache,
} from '@/services/auth'

import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonCard, IonCardHeader, IonCardSubtitle,
  IonCardTitle, IonCardContent, IonBadge, IonItem, IonTextarea,
  IonSpinner,
  onIonViewWillEnter,
} from '@ionic/vue'

const router = useRouter()

type ExtendedWord = StudyWordInfo

// ---- 页面状态 ----
const pageStatus = ref<StudyStatus>('reciting')
const isSubmitting = ref(false)                    // LLM 提交中
const isLoading = ref(true)                        // 页面加载中

const pageTitle = computed(() => {
  if (pageStatus.value === 'reciting') return '猜词挑战'
  if (pageStatus.value === 'chatting') return '智能学伴对话'
  if (pageStatus.value === 'done') return '休息休息'
  return '今日学习'
})

// ---- 猜词游戏状态 ----
const allWords = ref<ExtendedWord[]>([])
const masteredIds = ref<Set<number>>(new Set())
const currentFour = ref<ExtendedWord[]>([])
const correctWordId = ref<number>(0)
const selectedWordId = ref<number | null>(null)
const answered = ref(false)
const isLastCorrect = ref(false)
const revealedWordId = ref<number>(0)

const correctWord = computed(() => allWords.value.find(w => w.word_id === correctWordId.value))
const questionDefinition = computed(() => correctWord.value?.definition_cn || '')

const answerClass = computed(() => {
  if (!answered.value) return {}
  return isLastCorrect.value ? 'correct-reveal' : 'wrong-reveal'
})

function cardClass(wid: number) {
  if (!answered.value) return {}
  if (wid === correctWordId.value) return 'selected-correct'
  if (wid === selectedWordId.value) return 'selected-wrong'
  return 'disabled'
}

// ---- LLM 对话状态 ----
const llmQuestion = ref('')
const userAnswer = ref('')
const paragraphsType = ref('web')
const isLoadingQuestion = ref(false)               // LLM 问题加载中

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
const chatHistory = ref<ChatMessage[]>([])         // 多轮对话历史

// ====================================================================
// 猜词游戏逻辑
// ====================================================================
function goBack() { router.push('/home') }

function refreshRound() {
  const remaining = allWords.value.filter(w => !masteredIds.value.has(w.word_id))
  if (remaining.length === 0) {
    // 全部答对 → 进入 LLM 阶段
    enterChattingPhase()
    return
  }
  for (let i = 0; i < 20; i++) {
    const shuffled = [...allWords.value].sort(() => Math.random() - 0.5)
    const four = shuffled.slice(0, 4)
    const candidate = four.find(w => !masteredIds.value.has(w.word_id))
    if (candidate) {
      currentFour.value = four
      correctWordId.value = candidate.word_id
      break
    }
  }
  selectedWordId.value = null
  answered.value = false
  isLastCorrect.value = false
  revealedWordId.value = 0
}

async function guessWord(wordId: number) {
  if (answered.value) return
  selectedWordId.value = wordId
  answered.value = true
  const correct = wordId === correctWordId.value
  isLastCorrect.value = correct
  if (correct) {
    masteredIds.value = new Set(masteredIds.value).add(wordId)
    // 同步写入 localStorage 即时缓存，弥补后端批量 flush 的延迟窗口
    setMasteredCache([...masteredIds.value])
  }
  revealedWordId.value = correctWordId.value
  try { await reportAnswer(wordId, correctWordId.value, correct) }
  catch (err: any) { alert(`⚠️ ${err?.message || '上报失败，请检查网络'}`) }
}

function togglePreview(wordId: number) {
  if (answered.value) return
  revealedWordId.value = revealedWordId.value === wordId ? 0 : wordId
}

function nextRound() { refreshRound() }

// ====================================================================
// LLM 对话逻辑
// ====================================================================
async function enterChattingPhase() {
  pageStatus.value = 'chatting'
  isLoadingQuestion.value = true
  await nextTick()
  try {
    await completeStudy()                            // 标记背诵完成
    const qRes = await getLLMQuestion()              // 获取 LLM 问题
    llmQuestion.value = qRes.question
  } catch {
    llmQuestion.value = '（wait 生成问题失败，请稍后重试）'
  } finally {
    isLoadingQuestion.value = false
  }
}

async function submitAnswer() {
  if (!userAnswer.value.trim()) return
  if (isSubmitting.value) return
  isSubmitting.value = true
  const userInput = userAnswer.value.trim()
  userAnswer.value = ''  // 清空输入框，准备下一轮对话
  // 计算当前对话轮次（已有的用户消息数 + 本次提交），驱动 LLM 提示词层级递进
  const roundNum = chatHistory.value.filter(m => m.role === 'user').length + 1
  // 将发送前的历史一并传给后端，让 LLM 拥有完整的对话上下文
  const historyToSend = chatHistory.value.map(m => ({ role: m.role, content: m.content }))
  try {
    const res = await submitLLMAnswer(userInput, paragraphsType.value, roundNum, historyToSend)
    chatHistory.value.push(
      { role: 'user', content: userInput },
      { role: 'assistant', content: res.reply }
    )
    // 持久化对话历史，返回首页再进入可恢复
    setChatHistoryCache(chatHistory.value)
  } catch (err: any) {
    alert(`⚠️ ${err?.message || '提交失败，请检查网络'}`)
  } finally {
    isSubmitting.value = false
  }
}

async function finishChat() {
  pageStatus.value = 'done'
  try { await finishStudy() } catch { /* 后端 Pass，忽略 */ }
  // 后端已完成 clean + 段落推进，清空 localStorage 即时缓存
  clearMasteredCache()
  clearChatHistoryCache()
}

// ====================================================================
// 页面初始化
// ====================================================================
async function initPage() {
  // 每次进入页面时重置所有状态，确保实时从数据库获取
  isLoading.value = true
  pageStatus.value = 'reciting'
  isSubmitting.value = false
  allWords.value = []
  masteredIds.value = new Set()
  currentFour.value = []
  correctWordId.value = 0
  selectedWordId.value = null
  answered.value = false
  isLastCorrect.value = false
  revealedWordId.value = 0
  llmQuestion.value = ''
  chatHistory.value = []
  userAnswer.value = ''

  const route = router.currentRoute.value
  paragraphsType.value = (route.query.paragraphs_type as string) || 'web'
  const now = new Date()

  // 第一步：获取过期时间戳, 如果过期时间过期，后端会更新状态
  let expiredTime: string | null = null
  try {
    const expRes = await getExpiredTime()
    expiredTime = expRes.expired_time
  } catch (err: any) {
    if (err?.response?.status === 404) {
      // 后端未实现，降级为直接加载
    } else {
      // 其他异常（401 已由拦截器统一跳转登录；超时/网络错误由拦截器转为友好文案）
      alert(`Warning ${err?.message || '获取学习状态失败，请检查网络后重试'}`)
      isLoading.value = false
      return
    }
  }

  const isExpired = !expiredTime || new Date(expiredTime) <= now

  if (isExpired) {
    // 过期或为空 → 直接加载单词
    // 过期说明后端已清空 pass_list（新批次），前端 localStorage 也必须联动清空，
    // 避免旧缓存导致"已掌握词"被误跳过
    clearMasteredCache()
    masteredIds.value = new Set()
    try {
      const data = await paragraphStudy(paragraphsType.value)
      allWords.value = data.words.map((item: any) => item.word).filter(Boolean)
      console.log("refresh isExpired")
      refreshRound()
    } catch (err: any) {
      alert(`Warning ${err?.message || '获取学习内容失败，请检查网络后返回首页重试'}`)
    }
    isLoading.value = false
    return
  }

  // 第三步：未过期 → 查询当天学习状态
  try {
    const statusRes = await getStudyStatus()
    if (statusRes.status === 'done') {
      pageStatus.value = 'done'
      // 昨天的临时缓存已过期（后端已 clean），必须清空避免旧单词误判
      clearMasteredCache()
      isLoading.value = false
      return
    }
    if (statusRes.status === 'chatting') {
      pageStatus.value = 'chatting'
      // 获取单词列表，恢复已通过的单词记录
      // 若后端 pass_list 为空（如过期重置/新批次），前端缓存联动清空，干净开始；
      // 否则用 localStorage 即时缓存 ∪ 后端 pass_list 并集恢复
      try {
        const wlRes = await getWordLists()
        if (wlRes.pass_list.length === 0) {
          clearMasteredCache()
          masteredIds.value = new Set()
        } else {
          const cached = getMasteredCache()
          masteredIds.value = new Set([...cached, ...wlRes.pass_list])
        }
      } catch {
        masteredIds.value = new Set(getMasteredCache())
      }
      // 直接从后端获取已保存的 LLM 问题
      llmQuestion.value = statusRes.question || '（生成问题失败，请稍后重试）'
      // 从 localStorage 恢复对话历史（用户返回首页再进入时保留上下文）
      chatHistory.value = getChatHistoryCache()
      isLoading.value = false
      return
    }
    // reciting 或默认: 获取单词列表，恢复已通过的单词记录，然后加载单词
    // 若后端 pass_list 为空（如过期重置/新批次），前端缓存联动清空，干净开始；
    // 否则用 localStorage 即时缓存 ∪ 后端 pass_list 并集恢复，弥补 flush 延迟窗口
    try {
      const wlRes = await getWordLists()
      if (wlRes.pass_list.length === 0) {
        clearMasteredCache()
        masteredIds.value = new Set()
      } else {
        const cached = getMasteredCache()
        masteredIds.value = new Set([...cached, ...wlRes.pass_list])
      }
    } catch {
      masteredIds.value = new Set(getMasteredCache())
    }

    try {
      const data = await paragraphStudy(paragraphsType.value)
      allWords.value = data.words.map((item: any) => item.word).filter(Boolean)
      console.log("refresh getstudy 416")
      refreshRound()
    } catch (err: any) {
      alert(`Warning ${err?.message || '获取学习内容失败，请检查网络后返回首页重试'}`)
    }
  } catch (err: any) {
    // 后端未实现时 fallback 到 reciting → 直接加载单词
    try {
      const data = await paragraphStudy(paragraphsType.value)
      allWords.value = data.words.map((item: any) => item.word).filter(Boolean)
      console.log("catch 后端未实现时 fallback 到 reciting → 直接加载单词")
      refreshRound()
    } catch (err2: any) {
      alert(`Warning！ ${err2?.message || '获取学习内容失败，请检查网络后返回首页重试'}`)
    }
  }
  isLoading.value = false
}

onMounted(initPage)
onIonViewWillEnter(initPage)
</script>


<style scoped>
.study-container { max-width: 600px; margin: 0 auto; }
.empty-state { margin-top: 40vh; text-align: center; }
.progress-text { font-size: 14px; color: #666; margin-right: 8px; }

/* ---- 猜词 ---- */
.question-area { text-align: center; margin-bottom: 20px; }
.question-label { font-size: 15px; color: #666; margin-bottom: 8px; }
.definition-card { margin: 0; }
.definition-text { font-size: 20px; font-weight: 600; color: #222; margin: 0; line-height: 1.5; }
.answer-reveal { margin-top: 12px; font-size: 16px; }
.correct-reveal { --background: #e8f5e9; }
.wrong-reveal { --background: #fce4ec; }

.word-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
.word-card { margin: 0; transition: transform 0.15s ease; min-height: 120px; }
.word-card:active { transform: scale(0.97); }
.word-card.selected-correct { border: 2px solid #4caf50; --background: #e8f5e9; }
.word-card.selected-wrong { border: 2px solid #f44336; --background: #fce4ec; }
.word-card.disabled { opacity: 0.5; pointer-events: none; }
.word-text { font-size: 22px; font-weight: 700; color: #222; text-align: center; }

.word-phonetics { display: flex; gap: 12px; margin-bottom: 6px; font-size: 13px; color: #888; }
.word-pos { margin-bottom: 6px; }
.pos-badge { display: inline-block; background: #e8f0fe; color: #1967d2; padding: 1px 8px; border-radius: 10px; font-size: 12px; font-weight: 500; }
.word-definition-cn { margin-bottom: 4px; }
.word-definition-cn p { font-size: 14px; color: #333; margin: 0; }
.word-definition-en { margin-bottom: 4px; }
.definition-en-text { font-size: 13px; color: #666; font-style: italic; margin: 0; }
.card-footer { display: flex; justify-content: space-between; align-items: center; padding: 4px 12px 8px; }
.action-area { margin-top: 16px; }

/* ---- LLM 对话 ---- */
.chat-container { max-width: 600px; margin: 0 auto; }
.llm-question-card { margin-bottom: 16px; }
.llm-question-text { font-size: 17px; color: #333; line-height: 1.5; white-space: pre-wrap; }
.llm-reply-card { margin-bottom: 16px; }
.llm-reply-text { font-size: 16px; color: #444; line-height: 1.5; white-space: pre-wrap; }
.chat-input-area { margin-top: 8px; }
</style>
