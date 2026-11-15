/**
 * API 客户端 - 后端通信模块
 *
 * 基于 axios 封装，提供与后端服务的 HTTP 通信。
 * 复用自 EnglishWordSet API 的 auth_router 端点。
 *
 * 设计说明：
 *   - 全局 axios 实例：baseURL / timeout 统一配置
 *   - 请求拦截器：自动注入 JWT Bearer Token，接口层无需再手动传 token
 *   - 响应拦截器：统一处理 401 过期跳转、FastAPI 422 错误消息提取
 *   - 所有接口函数移除 token 参数，签名大幅精简
 */

import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { getToken, clearAuth } from '@/services/auth'
import router from '@/router'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8011'

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

// 请求拦截器：统一注入 JWT
apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * 从 FastAPI 错误响应中提取可读的错误消息。
 * FastAPI 422 响应的 detail 可能是数组 [{loc, msg, type}, ...]。
 */
function extractErrorMessage(data: any, fallback: string): string {
  if (!data) return fallback
  if (typeof data.detail === 'string') {
    return data.detail
  }
  if (Array.isArray(data.detail) && data.detail.length > 0) {
    return data.detail.map((e: any) => e.msg || JSON.stringify(e)).join('; ')
  }
  return fallback
}

// 响应拦截器：统一错误处理
apiClient.interceptors.response.use(
  (response) => response, // 由 http 泛型辅助函数解包 data
  (error: AxiosError) => {
    // 超时：axios 触发 timeout 时 code 为 'ECONNABORTED' 且 message 含 'timeout'
    if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
      error.message = '请求超时，请检查网络后重试'
      return Promise.reject(error)
    }

    // 网络错误：无响应（服务器未到达 / DNS 失败 / 连接被拒）
    if (!error.response) {
      error.message = '网络连接失败，请检查网络'
      return Promise.reject(error)
    }

    const status = error.response?.status

    // 401：JWT 过期或无效 → 统一清除认证并跳转登录
    if (status === 401) {
      clearAuth()
      // 避免在登录页自身触发 401 时循环跳转
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
      error.message = '登录已过期，请重新登录'
      return Promise.reject(error)
    }

    // 其他错误：提取 FastAPI 详情（422 数组 / detail 字符串）作为可读消息
    const message = extractErrorMessage(error.response?.data, error.message || '请求失败，请稍后重试')
    error.message = message
    return Promise.reject(error)
  }
)

/**
 * 泛型 HTTP 辅助函数。
 * 由于响应拦截器不直接解包 data，这里通过 axios 的 R 泛型保证
 * 调用方直接获得 T 类型（Promise<T>）。
 */
const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.get<T, AxiosResponse<T>>(url, config).then((res) => res.data),

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.post<T, AxiosResponse<T>>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiClient.put<T, AxiosResponse<T>>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T, AxiosResponse<T>>(url, config).then((res) => res.data),
}

// ====================================================================
// 类型定义
// ====================================================================

export interface AuthResponse {
  access_token: string
  token_type: string
  user_id: number
  username: string
  role?: string
  is_admin?: boolean
}

export interface MeResponse {
  user_id: number
  username: string
  nickname?: string | null
  email?: string | null
  phone?: string | null
}

export interface ApiError {
  detail: string
}

// ====================================================================
// 认证接口
// ====================================================================

/**
 * 用户注册
 */
export async function register(
  username: string,
  password_hash: string,
  nickname?: string,
): Promise<AuthResponse> {
  const params = new URLSearchParams()
  params.append('username', username)
  params.append('password_hash', password_hash)
  if (nickname) params.append('nickname', nickname)

  return http.post('/api/auth/register', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

/**
 * 用户登录
 */
export async function login(username: string, password_hash: string): Promise<AuthResponse> {
  const params = new URLSearchParams()
  // 注：JS 最新的功能在 Ionic 中支持的是 >= Android 5.0
  params.append('username', username)
  params.append('password_hash', password_hash)

  return http.post('/api/auth/login', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
}

/**
 * 验证 token 并获取用户信息（含联系方式）
 */
export async function getMe(): Promise<MeResponse> {
  return http.get('/api/auth/me')
}

/** 修改联系方式请求体（email / phone 传 null 或空串表示清除） */
export interface ProfileUpdatePayload {
  email?: string | null
  phone?: string | null
}

/** 修改当前用户联系方式 */
export async function updateMyProfile(
  payload: ProfileUpdatePayload,
): Promise<{ code: number; message: string; email: string | null; phone: string | null }> {
  return http.put('/api/auth/profile', payload)
}

// ====================================================================
// 学习相关接口
// ====================================================================

/** 学习单词信息 */
export interface StudyWordInfo {
  word_id: number
  word_text: string
  phonetic_uk?: string
  phonetic_us?: string
  pos?: string
  definition_cn?: string
  definition_en?: string
  word_level?: string
}

/** 开始学习响应（旧接口，保留兼容） */
export interface StudyResponse {
  code: number
  message: string
  words: StudyWordInfo[]
}

/**
 * 开始学习 - 根据用户 ID 和专业语境获取学习单词
 * 预留接口，后端尚未实现，需后续对接
 * @deprecated 改用 paragraphStudy()
 */
export async function startStudy(
  userName: string,
  context: string,
): Promise<StudyResponse> {
  return http.post('/api/wordstudy', { userName, context })
}

// ====================================================================
// 段落学习接口 (GET /api/paragraphs/study)
// ====================================================================

/** 段落学习响应中的单个单词项 */
export interface ParagraphStudyWordItem {
  word: StudyWordInfo | null
  memory_node: Record<string, any> | null
  priority_score: number
  web_english_level: string | null
}

/** 段落学习响应 */
export interface ParagraphStudyResponse {
  code: number
  message: string
  paragraph_id: number
  words: ParagraphStudyWordItem[]
}

/**
 * 段落学习 - 获取当前段落优先学习的单词
 * GET /api/paragraphs/webstudy?paragraphs_type=web
 * Header: Authorization: Bearer <token>（由拦截器自动注入）
 */
export async function paragraphStudy(
  paragraphsType: string = 'web',
): Promise<ParagraphStudyResponse> {
  return http.get('/api/paragraphs/webstudy', {
    params: { paragraphs_type: paragraphsType },
  })
}

// ====================================================================
// 猜词结果上报接口
// ====================================================================
export async function reportAnswer(
  selectedWordId: number,
  correctWordId: number,
  isCorrect: boolean,
  domain: string = 'web_programming',
  responseTimeMs?: number,
): Promise<void> {
  await http.post('/api/word/answer', {
    selected_word_id: selectedWordId,
    correct_word_id: correctWordId,
    is_correct: isCorrect,
    // domain 决定后端更新哪个域的 MemoryNodes（web_programming / _MDPS / _SM2）
    domain,
    // 反应时间用于 SM2 质量评分 q 的推导（快 <5s → 5，中 <10s → 4，慢 → 3）
    response_time_ms: responseTimeMs ?? null,
  })
}

// ====================================================================
// 学习状态 & LLM 对话接口
// ====================================================================

export type StudyStatus = 'reciting' | 'chatting' | 'done'

export interface StudyStatusResponse {
  status: StudyStatus
  question?: string
}

export interface LLMQuestionResponse {
  question: string
}

export interface LLMAnswerResponse {
  reply: string
}

/** 查询当天学习状态 */
export async function getStudyStatus(paragraphsType?: string): Promise<StudyStatusResponse> {
  return http.get('/api/study/status', { params: { paragraphs_type: paragraphsType || 'web' } })
}

export interface CompleteStudyResponse {
  code: number
  message: string
  status: StudyStatus
}

/** 标记当天背诵完成，通知后端；返回后端决定的后续阶段（白名单→chatting，非白名单→done） */
export async function completeStudy(paragraphsType?: string): Promise<CompleteStudyResponse> {
  return http.post('/api/study/complete', {
    paragraphs_type: paragraphsType || 'web',
  })
}

/** LLM 生成一个问题（Hermes/DeepSeek 耗时较长，单独放宽超时） */
export async function getLLMQuestion(paragraphsType?: string): Promise<LLMQuestionResponse> {
  return http.post(
    '/api/llm/question',
    undefined,
    { params: { paragraphs_type: paragraphsType || 'web' }, timeout: 180000 },
  )
}

/** 用户提交回答，LLM 生成回复 */
export async function submitLLMAnswer(
  answer: string,
  paragraphsType?: string,
  roundNum?: number,
  history?: Array<{ role: string; content: string }>,
): Promise<LLMAnswerResponse> {
  return http.post(
    '/api/llm/answer',
    {
      answer,
      paragraphs_type: paragraphsType || 'web',
      round_num: roundNum || 1,
      history: history || [],
    },
    { timeout: 180000 },
  )
}

/** 标记 LLM 对话完成 */
export async function finishStudy(paragraphsType?: string): Promise<void> {
  await http.post('/api/study/finish', {
    paragraphs_type: paragraphsType || 'web',
  })
}

/** 当前用户是否在 Hermes 白名单内（控制「生成专业例句」按钮显隐） */
export async function getHermesEnabled(): Promise<{ enabled: boolean }> {
  return http.get('/api/llm/hermes-enabled')
}

export interface WordSentenceResponse {
  sentence: string
  translation: string
}

/** 为单词生成学习例句（Hermes，仅白名单用户；耗时较长，单独放宽超时） */
export async function generateWordSentence(
  wordId: number,
  wordText: string,
  definitionCn?: string | null,
  paragraphsType?: string,
): Promise<WordSentenceResponse> {
  return http.post(
    '/api/llm/sentence',
    {
      word_id: wordId,
      word_text: wordText,
      definition_cn: definitionCn || null,
      paragraphs_type: paragraphsType || 'web',
    },
    { timeout: 180000 },
  )
}


/** 获取用户的过期时间 */
export async function getExpiredTime(paragraphsType?: string): Promise<{ code: number; expired_time: string | null }> {
  return http.get('/api/study/expired-time', { params: { paragraphs_type: paragraphsType || 'web' } })
}

/** 获取用户的单词列表 */
export async function getWordLists(paragraphsType?: string): Promise<{ code: number; all_tmp_list: number[]; pass_list: number[] }> {
  return http.get('/api/study/word-lists', { params: { paragraphs_type: paragraphsType || 'web' } })
}

/** 分域词汇进度中的单个单词 */
export interface DomainWordProgressItem {
  word_id: number
  word_text: string
  phonetic_uk?: string | null
  phonetic_us?: string | null
  pos?: string | null
  definition_cn?: string | null
  definition_en?: string | null
  word_level?: string | null
  review_count: number
  learned: boolean
}

/** 分域词汇学习进度响应 */
export interface DomainWordProgressResponse {
  code: number
  message: string
  domain: string
  total: number
  learned_count: number
  unlearned_count: number
  words: DomainWordProgressItem[]
}

/** 获取分域词汇学习进度（个人主页展示） */
export async function getDomainWordProgress(
  paragraphsType: string = 'web',
): Promise<DomainWordProgressResponse> {
  return http.get('/api/word/domain-progress', {
    params: { paragraphs_type: paragraphsType },
  })
}

/** 学习日历单日数据（日期为北京时间 YYYY-MM-DD） */
export interface CalendarDayItem {
  date: string
  answers: number
  correct: number
  studied: boolean
  completed: boolean
}

/** 学习日历响应 */
export interface StudyCalendarResponse {
  code: number
  message: string
  days: CalendarDayItem[]
}

/** 获取学习日历（最近 N 个月，默认 3，最多 12） */
export async function getStudyCalendar(months: number = 3): Promise<StudyCalendarResponse> {
  return http.get('/api/study/calendar', { params: { months } })
}

/** 单词搜索（模糊）结果项，仅含基础信息 */
export interface WordSearchItem {
  word_id: number
  word_text: string
}

/** 单词搜索响应：match_type 区分精确（word 完整字段）/ 模糊（results 基础信息） */
export interface WordSearchResponse {
  code: number
  message: string
  match_type: 'exact' | 'fuzzy'
  word?: StudyWordInfo | null
  results: WordSearchItem[]
}

/** 搜索单词：精确命中返回完整字段，否则模糊返回基础信息 */
export async function searchWords(keyword: string): Promise<WordSearchResponse> {
  return http.get('/api/word/search', { params: { keyword } })
}

// ====================================================================
// 搜索历史接口（/api/search/history）
// ====================================================================

export interface SearchHistoryItem {
  keyword: string
  searched_at: string
}

export interface SearchHistoryListResponse {
  code: number
  message: string
  user_id: number
  items: SearchHistoryItem[]
}

/** 记录一次搜索关键词（user_id 由后端从 JWT 解析，UPSERT 去重置顶） */
export async function addSearchHistory(
  keyword: string,
): Promise<{ code: number; message: string; item: SearchHistoryItem }> {
  return http.post('/api/search/history', { keyword })
}

/** 获取当前用户最近搜索历史 */
export async function getSearchHistory(
  limit = 10,
): Promise<SearchHistoryListResponse> {
  return http.get('/api/search/history', { params: { limit } })
}

/** 清空当前用户搜索历史 */
export async function clearSearchHistory(): Promise<{ code: number; message: string }> {
  return http.delete('/api/search/history')
}

// ====================================================================
// 管理员接口（/api/admin/*）
// ====================================================================

export interface AdminColumnMeta {
  name: string
  label: string
  type: string
  editable: boolean
  insertable: boolean
  sensitive: boolean
  required: boolean
  options?: string[] | null
  default?: string | null
  pk: boolean
}

export interface AdminTableMeta {
  name: string
  label: string
  pk: string[]
  auto_pk: boolean
  search: string[]
  columns: AdminColumnMeta[]
}


export interface AdminListResult {
  total: number
  page: number
  page_size: number
  rows: Record<string, any>[]
}

export async function adminGetTables(): Promise<AdminTableMeta[]> {
  const res = await http.get<{ tables: AdminTableMeta[] }>('/api/admin/tables')
  return res.tables
}

export async function adminListRows(
  table: string,
  page: number,
  pageSize: number,
  keyword?: string,
): Promise<AdminListResult> {
  return http.get<AdminListResult>(`/api/admin/${table}/rows`, {
    params: { page, page_size: pageSize, keyword: keyword || undefined },
  })
}

export async function adminInsertRow(
  table: string,
  data: Record<string, any>,
): Promise<Record<string, any>> {
  return http.post(`/api/admin/${table}/rows`, data)
}

export async function adminUpdateRow(
  table: string,
  pk: string,
  data: Record<string, any>,
): Promise<Record<string, any>> {
  return http.put(`/api/admin/${table}/rows/${pk}`, data)
}

export async function adminDeleteRow(table: string, pk: string): Promise<void> {
  await http.delete(`/api/admin/${table}/rows/${pk}`)
}


// ====================================================================
// 反馈接口（/api/feedback/*）
// ====================================================================

export type FeedbackVisibility = 'public' | 'private'

export interface FeedbackItem {
  id: number
  user_id: number
  username: string | null
  visibility: FeedbackVisibility
  content: string
  admin_reply: string | null
  replied_at: string | null
  created_at: string
  updated_at: string
}

export interface FeedbackListResponse {
  code: number
  message: string
  user_id: number
  items: FeedbackItem[]
}

/** 提交反馈（user_id 由后端从 JWT 解析） */
export async function submitFeedback(
  visibility: FeedbackVisibility,
  content: string,
): Promise<{ code: number; message: string; feedback: Record<string, any> }> {
  return http.post('/api/feedback/submit', { visibility, content })
}

/** 用户视角列表：公共反馈 + 本人私人反馈 */
export async function getFeedbackList(): Promise<FeedbackListResponse> {
  return http.get('/api/feedback/list')
}

/** 管理员全量列表 */
export async function adminListFeedback(): Promise<{ code: number; message: string; items: FeedbackItem[] }> {
  return http.get('/api/feedback/admin/list')
}

/** 管理员回复反馈 */
export async function adminReplyFeedback(
  feedbackId: number,
  reply: string,
): Promise<{ code: number; message: string }> {
  return http.post(`/api/feedback/${feedbackId}/reply`, { reply })
}

