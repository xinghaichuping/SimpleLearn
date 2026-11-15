<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="goBack">← 返回</ion-button>
        </ion-buttons>
        <ion-title>单词查询</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="search-page">
        <ion-searchbar
          :value="searchKeyword"
          placeholder="输入英文单词"
          :debounce="400"
          enterkeyhint="search"
          @ionInput="onSearchInput"
        />

        <!-- 最近搜索（初始 / 无结果时展示） -->
        <div
          v-if="searchHistory.length && !searchLoading && !searchError && !searchExact && !searchResults.length"
          class="history-block"
        >
          <div class="history-head">
            <span class="history-title">🕘 最近搜索</span>
            <button class="history-clear" @click="onClearHistory">清空</button>
          </div>
          <div class="history-chips">
            <span
              v-for="kw in searchHistory"
              :key="kw"
              class="history-chip"
              @click="onPickHistory(kw)"
            >{{ kw }}</span>
          </div>
        </div>

        <!-- 加载中 -->
        <div v-if="searchLoading" class="search-status">
          <ion-spinner name="dots" />
          <span>查询中…</span>
        </div>

        <!-- 精确命中：完整词卡 -->
        <div v-else-if="searchExact" class="word-card">
          <div class="word-head">
            <span class="word-text">{{ searchExact.word_text }}</span>
            <span v-if="searchExact.pos" class="word-pos">{{ searchExact.pos }}</span>
          </div>
          <div
            v-if="searchExact.phonetic_uk || searchExact.phonetic_us"
            class="word-phonetic"
          >
            <span v-if="searchExact.phonetic_uk">英 [{{ searchExact.phonetic_uk }}]</span>
            <span v-if="searchExact.phonetic_us">美 [{{ searchExact.phonetic_us }}]</span>
          </div>
          <div v-if="searchExact.definition_cn" class="word-def">{{ searchExact.definition_cn }}</div>
          <div v-if="searchExact.definition_en" class="word-def-en">{{ searchExact.definition_en }}</div>
        </div>

        <!-- 模糊命中：候选词列表 -->
        <ion-list v-else-if="searchResults.length" class="word-list">
          <ion-item
            v-for="w in searchResults"
            :key="w.word_id"
            button
            @click="pickSuggestion(w.word_text)"
          >
            <ion-label>{{ w.word_text }}</ion-label>
          </ion-item>
        </ion-list>

        <!-- 服务不可用（接口未部署 / 网络异常），与「无结果」区分 -->
        <div v-else-if="searchError" class="search-status error">搜索服务暂不可用，请稍后再试</div>

        <!-- 无结果 -->
        <div v-else-if="searched" class="search-status">未找到匹配的单词</div>

        <!-- 初始提示 -->
        <div v-else class="search-status hint">输入英文单词进行查询</div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { searchWords, addSearchHistory, getSearchHistory, clearSearchHistory } from '@/services/api'
import type { StudyWordInfo, WordSearchItem } from '@/services/api'
import {
  getLocalSearchHistory,
  addLocalSearchHistory,
  setLocalSearchHistory,
  clearLocalSearchHistory,
  mergeSearchHistory,
} from '@/services/searchHistory'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonSearchbar, IonSpinner, IonList, IonItem, IonLabel,
} from '@ionic/vue'

const router = useRouter()

const searchKeyword = ref('')
const searchLoading = ref(false)
const searched = ref(false)
const searchError = ref(false)
const searchExact = ref<StudyWordInfo | null>(null)
const searchResults = ref<WordSearchItem[]>([])
const searchHistory = ref<string[]>([])

async function onSearch() {
  const kw = searchKeyword.value.trim()
  searchExact.value = null
  searchResults.value = []
  searchError.value = false
  if (!kw) {
    searched.value = false
    return
  }
  searchLoading.value = true
  try {
    const res = await searchWords(kw)
    if (res.match_type === 'exact' && res.word) {
      searchExact.value = res.word
      recordHistory(res.word.word_text)
    } else {
      searchResults.value = res.results || []
    }
    searched.value = true
  } catch (e) {
    // 请求失败（接口未部署 / 网络异常）与「无结果」区分，避免误报未找到
    searched.value = false
    searchError.value = true
  } finally {
    searchLoading.value = false
  }
}

function onSearchInput(ev: any) {
  searchKeyword.value = ev.detail.value || ''
  onSearch()
}

/** 点击模糊结果：回填搜索框并重新触发（走精确匹配） */
function pickSuggestion(wordText: string) {
  searchKeyword.value = wordText
  onSearch()
}

/** 记录搜索历史（本地即时 + 服务端 fire-and-forget 同步） */
function recordHistory(keyword: string) {
  const kw = keyword.trim()
  if (!kw) return
  searchHistory.value = addLocalSearchHistory(kw)
  addSearchHistory(kw).catch(() => {})
}

/** 点击历史词：回填并重新触发搜索 */
function onPickHistory(kw: string) {
  searchKeyword.value = kw
  onSearch()
}

/** 清空搜索历史（本地 + 服务端） */
function onClearHistory() {
  searchHistory.value = []
  clearLocalSearchHistory()
  clearSearchHistory().catch(() => {})
}

/** 进入页面：本地即时显示 + 拉服务端历史合并同步 */
onMounted(async () => {
  searchHistory.value = getLocalSearchHistory()
  try {
    const res = await getSearchHistory(10)
    const serverKws = (res.items || []).map((i) => i.keyword)
    const merged = mergeSearchHistory(serverKws, searchHistory.value)
    searchHistory.value = merged
    setLocalSearchHistory(merged)
  } catch {
    // 服务端不可用：仅用本地历史兜底
  }
})

/** 返回上一页 */
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.replace('/home')
  }
}
</script>

<style scoped>
.search-page {
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;
}

.search-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #8c8c8c;
  padding: 12px 0;
  font-size: 14px;
}

.search-status.error {
  color: #eb445a;
}

.search-status.hint {
  color: #8c8c8c;
}

.word-card {
  background: #f7f7f7;
  border-radius: 10px;
  padding: 14px 16px;
  margin-top: 8px;
}

.word-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.word-text {
  font-size: 1.4rem;
  font-weight: 700;
}

.word-pos {
  color: #666;
  font-size: 0.9rem;
}

.word-phonetic {
  color: #888;
  font-size: 0.85rem;
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.word-def {
  margin-top: 8px;
  font-size: 0.95rem;
}

.word-def-en {
  margin-top: 4px;
  color: #666;
  font-size: 0.9rem;
}

.word-list {
  margin-top: 4px;
  background: transparent;
}

.history-block {
  margin-top: 12px;
}

.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.history-title {
  font-size: 0.9rem;
  color: #666;
}

.history-clear {
  background: none;
  border: none;
  color: #3880ff;
  font-size: 0.85rem;
  padding: 0;
  cursor: pointer;
}

.history-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-chip {
  padding: 6px 12px;
  background: #f2f3f5;
  border-radius: 16px;
  font-size: 0.85rem;
  color: #333;
  cursor: pointer;
  transition: background 0.2s;
}

.history-chip:active {
  background: #e0e2e6;
}
</style>
