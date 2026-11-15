/**
 * 搜索历史模块 —— 本地 localStorage 即时显示 + 服务端跨设备同步。
 *
 * 设计：
 *   - 本地层：键名 `search_history_<userId>`，按用户隔离（同设备多账号不串数据），
 *     写入即时、离线可用；服务端不可用时本地兜底。
 *   - 服务端层：见 api.ts 的 addSearchHistory / getSearchHistory / clearSearchHistory，
 *     用于跨设备同步，进入页面时拉取合并。
 */
import { getUserId } from '@/services/auth'

const HISTORY_PREFIX = 'search_history_'
const HISTORY_LIMIT = 10

function key(): string {
  return `${HISTORY_PREFIX}${getUserId() || 'guest'}`
}

/** 读取本地搜索历史（最新在前）*/
export function getLocalSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(key())
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((s: any) => typeof s === 'string') : []
  } catch {
    return []
  }
}

/** 覆盖写入本地搜索历史（用于合并后回写） */
export function setLocalSearchHistory(list: string[]): void {
  try {
    localStorage.setItem(key(), JSON.stringify(list.slice(0, HISTORY_LIMIT)))
  } catch {
    // localStorage 不可用（隐私模式/超限）时静默忽略
  }
}

/** 写入一条本地搜索历史：去重（大小写不敏感）置顶，上限 10 条 */
export function addLocalSearchHistory(keyword: string): string[] {
  const kw = keyword.trim()
  if (!kw) return getLocalSearchHistory()
  const norm = kw.toLowerCase()
  const list = [kw, ...getLocalSearchHistory().filter((s) => s.toLowerCase() !== norm)]
  const capped = list.slice(0, HISTORY_LIMIT)
  setLocalSearchHistory(capped)
  return capped
}

/** 清空本地搜索历史 */
export function clearLocalSearchHistory(): void {
  try {
    localStorage.removeItem(key())
  } catch {
    // 忽略
  }
}

/** 合并本地 + 服务端历史：服务端顺序优先，去重（大小写不敏感），上限 10 条 */
export function mergeSearchHistory(server: string[], local: string[]): string[] {
  const merged: string[] = []
  const seen = new Set<string>()
  for (const kw of [...server, ...local]) {
    const norm = kw.trim().toLowerCase()
    if (!norm || seen.has(norm)) continue
    seen.add(norm)
    merged.push(kw.trim())
  }
  return merged.slice(0, HISTORY_LIMIT)
}
