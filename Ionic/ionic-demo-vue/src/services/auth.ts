/**
 * 认证状态管理模块
 *
 * 管理 JWT token 和用户信息的存储与读取。
 * 使用 localStorage 持久化，配合 Vue 3 reactive API 实现响应式。
 *
 * 新增功能：
 *   - initStorageListener(): 监听其他标签页的 localStorage 变化，
 *     实现跨标签页的认证状态同步和优雅踢出提示。
 */

import { ref, computed } from 'vue'

const TOKEN_KEY = 'auth_token'
const USER_ID_KEY = 'user_id'
const USERNAME_KEY = 'username'
const ROLE_KEY = 'role'
const CHAT_HISTORY_KEY = 'chat_history'
const MASTERED_CACHE_KEY = 'mastered_ids_cache'

const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const userId = ref(Number(localStorage.getItem(USER_ID_KEY)) || 0)
const username = ref(localStorage.getItem(USERNAME_KEY) || '')
const role = ref(localStorage.getItem(ROLE_KEY) || 'vistor')

/** 是否已登录 */
export const isAuthenticated = computed(() => !!token.value)

/** 是否为管理员 */
export const isAdmin = computed(() => role.value === 'admin')

/** 获取当前 token */
export function getToken(): string {
  return token.value
}

/** 获取当前用户 ID */
export function getUserId(): number {
  return userId.value
}

/** 获取当前用户名 */
export function getUsername(): string {
  return username.value
}

/** 登录成功后保存认证信息 */
export function setAuth(data: { access_token: string; user_id: number; username: string; role?: string }) {
  console.log('setAuth')
  token.value = data.access_token
  userId.value = Number(data.user_id) || 0
  username.value = data.username
  role.value = data.role || 'visitor'
  localStorage.setItem(TOKEN_KEY, data.access_token)
  localStorage.setItem(USER_ID_KEY, String(userId.value))
  localStorage.setItem(USERNAME_KEY, data.username)
  localStorage.setItem(ROLE_KEY, role.value)
}

/** 登出，清除认证信息 */
export function clearAuth() {
  token.value = ''
  userId.value = 0
  username.value = ''
  role.value = ''
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(USERNAME_KEY)
  localStorage.removeItem(ROLE_KEY)
  clearMasteredCache()
  clearChatHistoryCache()
}

// ====================================================================
// masteredIds 即时缓存（localStorage 叠加层）
// --------------------------------------------------------------------
// 设计动机:
//   后端猜词上报采用"内存队列批量 flush"（延迟 2 秒入库），若用户在
//   答对后 2 秒内离开并重进 StudyPage，后端 pass_list 尚未更新，会导致
//   "已答对的单词再次出现"。本缓存将 masteredIds 即时写入 localStorage，
//   重进页面时与后端 pass_list 取并集恢复，弥补 flush 延迟窗口。
//
// 清空时机（三处）:
//   - finish_study 成功后（后端已 clean + 段落推进）
//   - getStudyStatus 返回 'done' 时（第二天重进兜底）
//   - clearAuth() 注销时（本处）
// ====================================================================

/** 生成按学习域隔离的缓存 key（避免多学习入口互相污染） */
function masteredCacheKey(domain: string): string {
  return `${MASTERED_CACHE_KEY}_${domain}`
}

/** 读取已答对单词 ID 缓存（localStorage 叠加层，按 domain 隔离） */
export function getMasteredCache(domain: string): number[] {
  try {
    const raw = localStorage.getItem(masteredCacheKey(domain))
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((n: any) => typeof n === 'number') : []
  } catch {
    return []
  }
}

/** 写入已答对单词 ID 缓存（按 domain 隔离） */
export function setMasteredCache(ids: number[], domain: string) {
  localStorage.setItem(masteredCacheKey(domain), JSON.stringify(ids))
}

/** 清空已答对单词 ID 缓存；不传 domain 时清除所有学习域的缓存 */
export function clearMasteredCache(domain?: string) {
  if (domain) {
    localStorage.removeItem(masteredCacheKey(domain))
    return
  }
  const prefix = `${MASTERED_CACHE_KEY}_`
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(prefix)) keys.push(key)
  }
  keys.forEach((k) => localStorage.removeItem(k))
  // 兼容旧版无 domain 后缀的 key
  localStorage.removeItem(MASTERED_CACHE_KEY)
}

// ====================================================================
// LLM 对话历史缓存（localStorage 持久化）
// --------------------------------------------------------------------
// 设计动机:
//   用户在 chatting 状态返回首页再进入时，内存中的 chatHistory 会丢失。
//   通过 localStorage 持久化，恢复对话显示，并作为后端 LLM 上下文。
//
// 清空时机:
//   - finishChat() 成功后（对话结束，当日学习完成）
//   - clearAuth() 注销时
// ====================================================================

interface ChatCacheMessage {
  role: 'user' | 'assistant'
  content: string
}

/** 生成按学习域隔离的对话历史缓存 key（避免多学习入口互相污染） */
function chatHistoryCacheKey(domain: string): string {
  return `${CHAT_HISTORY_KEY}_${domain}`
}

/** 读取缓存的 LLM 对话历史（按 domain 隔离） */
export function getChatHistoryCache(domain: string): ChatCacheMessage[] {
  try {
    const raw = localStorage.getItem(chatHistoryCacheKey(domain))
    const arr = raw ? JSON.parse(raw) : []
    if (!Array.isArray(arr)) return []
    return arr.filter(
      (m: any) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant')
    )
  } catch {
    return []
  }
}

/** 保存 LLM 对话历史到缓存（按 domain 隔离） */
export function setChatHistoryCache(history: ChatCacheMessage[], domain: string) {
  localStorage.setItem(chatHistoryCacheKey(domain), JSON.stringify(history))
}

/** 清空 LLM 对话历史缓存；不传 domain 时清除所有学习域 + 兼容旧版无后缀 key */
export function clearChatHistoryCache(domain?: string) {
  if (domain) {
    localStorage.removeItem(chatHistoryCacheKey(domain))
    return
  }
  const prefix = `${CHAT_HISTORY_KEY}_`
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(prefix)) keys.push(key)
  }
  keys.forEach((k) => localStorage.removeItem(k))
  // 兼容旧版无 domain 后缀的 key
  localStorage.removeItem(CHAT_HISTORY_KEY)
}

/** 获取 Authorization header 格式的 token */
export function getAuthHeaders(): Record<string, string> {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {}
}

// ====================================================================
// 跨标签页认证状态监听
// ====================================================================

type AuthChangeCallback = (reason: 'logged_out' | 'user_switched') => void

let listenerRegistered = false

/**
 * 初始化跨标签页认证状态监听。
 * 当其他标签页修改了 localStorage 中的 token 时，当前标签页会收到通知，
 * 实现跨标签页的登录状态同步和优雅踢出。
 *
 * 场景：
 *   - logged_out:     token 被清除 → 其他标签页执行了注销
 *   - user_switched:  token 变更为不同值 → 其他标签页切换了账号
 */
export function initStorageListener(onAuthChange: AuthChangeCallback) {
  if (listenerRegistered) return
  listenerRegistered = true

  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key !== TOKEN_KEY) return

    const newToken = e.newValue

    if (!newToken) {
      // token 被清除 → 其他标签页注销了
      token.value = ''
      userId.value = 0
      username.value = ''
      onAuthChange('logged_out')
    } else if (newToken !== token.value) {
      // token 变更为不同值 → 其他标签页切换了账号
      token.value = newToken
      userId.value = Number(localStorage.getItem(USER_ID_KEY)) || 0
      username.value = localStorage.getItem(USERNAME_KEY) || ''
      onAuthChange('user_switched')
    }
  })
}
