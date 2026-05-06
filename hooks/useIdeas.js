import useSWR from 'swr'
import { ideaService } from '../services/idea.service'

const PAGE_LIMIT = Number(process.env.NEXT_PUBLIC_PAGE_LIMIT) || 10

function buildKey(params) {
  if (!params) return null
  return ['ideas', JSON.stringify(params)]
}

export function useIdeas(params = {}) {
  const mergedParams = { limit: PAGE_LIMIT, page: 1, sort: '-date', ...params }

  const { data, error, isLoading, mutate } = useSWR(
    buildKey(mergedParams),
    () => ideaService.getIdeas(mergedParams),
    { revalidateOnFocus: false }
  )

  return {
    ideas: data?.ideas || [],
    meta: data?.meta || {},
    isLoading,
    error,
    mutate,
  }
}

export function useIdea(id) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ['idea', id] : null,
    () => ideaService.getIdea(id),
    { revalidateOnFocus: false }
  )

  return {
    idea: data || null,
    isLoading,
    error,
    mutate,
  }
}
