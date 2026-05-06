'use client'

import { useCallback, useRef, useState } from 'react'
import { useLocale } from '../../hooks/useLocale'
import { useWebSocketEvent } from '../../hooks/useWebSocket'
import { useIdeas } from '../../hooks/useIdeas'
import IdeaCard from '../IdeaCard/IdeaCard'
import styles from './IdeaList.module.css'

const PAGE_LIMIT = Number(process.env.NEXT_PUBLIC_PAGE_LIMIT) || 10
const SORT_OPTIONS = ['-date', 'date', '-votes', 'votes']

export default function IdeaList() {
  const { t } = useLocale()
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('-date')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const searchTimeout = useRef(null)

  const { ideas, meta, isLoading, error, mutate } = useIdeas({
    page,
    limit: PAGE_LIMIT,
    sort,
    search,
    tags,
  })

  const getSortLabel = (value) => {
    if (value === '-date') return t('newest')
    if (value === 'date') return t('oldest')
    if (value === '-votes') return t('mostVotes')
    if (value === 'votes') return t('leastVotes')
    return value
  }

  const handleNewIdea = useCallback(() => {
    mutate()
  }, [mutate])
  useWebSocketEvent('NEW_IDEA', handleNewIdea)

  const handleVoteUpdate = useCallback(
    (payload) => {
      mutate((current) => {
        if (!current) return current
        return {
          ...current,
          ideas: current.ideas.map((idea) =>
            idea._id === payload.ideaId
              ? { ...idea, votesCount: payload.votesCount }
              : idea
          ),
        }
      }, false)
    },
    [mutate]
  )
  useWebSocketEvent('VOTE_UPDATE', handleVoteUpdate)

  function handleSearchInput(e) {
    const val = e.target.value
    setSearchInput(val)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setSearch(val)
      setPage(1)
    }, 400)
  }

  function handleSortChange(e) {
    setSort(e.target.value)
    setPage(1)
  }

  function handleAddTag(e) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim().toLowerCase()
      if (!tags.includes(newTag)) {
        setTags((prev) => [...prev, newTag])
      }
      setTagInput('')
      setPage(1)
    }
  }

  function removeTag(tag) {
    setTags((prev) => prev.filter((t) => t !== tag))
    setPage(1)
  }

  function handleDeleteIdea(id) {
    mutate(
      (current) => ({
        ...current,
        ideas: current.ideas.filter((i) => i._id !== id),
        meta: { ...current.meta, total: (current.meta.total || 1) - 1 },
      }),
      false
    )
  }

  const totalPages = meta.totalPages || 1

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder={t('searchIdeas')}
            value={searchInput}
            onChange={handleSearchInput}
            className={styles.searchInput}
            aria-label={t('searchIdeas')}
          />
        </div>

        <select
          value={sort}
          onChange={handleSortChange}
          className={styles.sortSelect}
          aria-label={t('sortIdeas')}
        >
          {SORT_OPTIONS.map((value) => (
            <option key={value} value={value}>{getSortLabel(value)}</option>
          ))}
        </select>
      </div>

      <div className={styles.tagFilter}>
        <input
          type="text"
          placeholder={t('filterByTag')}
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          className={styles.tagInput}
          aria-label={t('addTagFilter')}
        />
        {tags.map((tag) => (
          <span key={tag} className={styles.activeTag}>
            {tag}
            <button onClick={() => removeTag(tag)} className={styles.removeTag} aria-label={`Remove tag ${tag}`}>
              ×
            </button>
          </span>
        ))}
      </div>

      {isLoading && (
        <div className={styles.loading}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <div className={styles.error}>
          {t('ideasLoadError')}
        </div>
      )}

      {!isLoading && !error && ideas.length === 0 && (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>{t('noIdeas')}</p>
          <p className={styles.emptySubtitle}>
            {search || tags.length > 0 ? t('adjustFilters') : t('firstIdea')}
          </p>
        </div>
      )}

      {!isLoading && ideas.length > 0 && (
        <div className={styles.list}>
          {ideas.map((idea) => (
            <IdeaCard
              key={idea._id}
              idea={idea}
              onDelete={handleDeleteIdea}
            />
          ))}
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={styles.pageBtn}
          >
            ← {t('prev')}
          </button>
          <span className={styles.pageInfo}>
            {t('pageOf').replace('{page}', String(page)).replace('{total}', String(totalPages))}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={styles.pageBtn}
          >
            {t('next')} →
          </button>
        </div>
      )}
    </div>
  )
}
