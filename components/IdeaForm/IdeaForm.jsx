'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useLocale } from '../../hooks/useLocale'
import { getApiErrorMessage } from '../../lib/api-error'
import { ideaService } from '../../services/idea.service'
import FilePreviewCard from '../FilePreviewCard/FilePreviewCard'
import styles from './IdeaForm.module.css'

export default function IdeaForm({ idea }) {
  const isEdit = !!idea
  const router = useRouter()
  const { t } = useLocale()

  const [form, setForm] = useState({
    title: idea?.title || '',
    description: idea?.description || '',
    tagsStr: idea?.tags?.join(', ') || '',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [removeFileUrls, setRemoveFileUrls] = useState([])

  const selectedFilePreviews = useMemo(
    () =>
      selectedFiles.map((file) => ({
        name: file.name,
        originalName: file.name,
        type: file.type,
        mimeType: file.type,
        size: file.size,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      })),
    [selectedFiles]
  )

  useEffect(() => {
    return () => {
      selectedFilePreviews.forEach((preview) => {
        if (preview.previewUrl) URL.revokeObjectURL(preview.previewUrl)
      })
    }
  }, [selectedFilePreviews])

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }))
    setError('')
  }

  function parseTags(str) {
    return str
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 10)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const { title, description, tagsStr } = form
    const tags = parseTags(tagsStr)

    const errors = {}
    if (title.length < 5) errors.title = `${t('title')} >= 5`
    if (title.length > 120) errors.title = `${t('title')} <= 120`
    if (description.length < 10) errors.description = `${t('description')} >= 10`
    if (description.length > 2000) errors.description = `${t('description')} <= 2000`
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsLoading(true)
    try {
      if (isEdit) {
        await ideaService.updateIdea(idea._id, {
          title,
          description,
          tags,
          files: selectedFiles,
          removeFileUrls,
        })
        toast.success(t('ideaUpdated'))
        router.push(`/ideas/${idea._id}`)
      } else {
        const newIdea = await ideaService.createIdea({ title, description, tags, files: selectedFiles })
        toast.success(t('ideaCreated'))
        router.push(`/ideas/${newIdea._id}`)
      }
    } catch (err) {
      const message = getApiErrorMessage(err, t('failedAction'))
      if (err.status === 422) {
        setError(message)
      } else {
        setError(message)
      }
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  function handleFileChange(event) {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(files.slice(0, 5))
  }

  function toggleRemoveExistingFile(url) {
    setRemoveFileUrls((prev) =>
      prev.includes(url) ? prev.filter((item) => item !== url) : [...prev, url]
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{isEdit ? t('editIdea') : t('shareNewIdea')}</h1>
          <p className={styles.subtitle}>
            {isEdit ? t('updateIdeaSubtitle') : t('describeIdeaSubtitle')}
          </p>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="title" className={styles.label}>
              {t('title')} <span className={styles.charCount}>{form.title.length}/120</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder={t('conciseTitlePlaceholder')}
              value={form.title}
              onChange={handleChange}
              maxLength={120}
              className={`${styles.input} ${fieldErrors.title ? styles.inputError : ''}`}
            />
            {fieldErrors.title && <span className={styles.fieldError}>{fieldErrors.title}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="description" className={styles.label}>
              {t('description')} <span className={styles.charCount}>{form.description.length}/2000</span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              placeholder={t('ideaDescriptionPlaceholder')}
              value={form.description}
              onChange={handleChange}
              maxLength={2000}
              rows={6}
              className={`${styles.textarea} ${fieldErrors.description ? styles.inputError : ''}`}
            />
            {fieldErrors.description && <span className={styles.fieldError}>{fieldErrors.description}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="tagsStr" className={styles.label}>
              {t('tags')} <span className={styles.hint}>({t('tagsHint')})</span>
            </label>
            <input
              id="tagsStr"
              name="tagsStr"
              type="text"
              placeholder={t('tagsPlaceholder')}
              value={form.tagsStr}
              onChange={handleChange}
              className={styles.input}
            />
            {form.tagsStr && (
              <div className={styles.tagPreview}>
                {parseTags(form.tagsStr).map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="files" className={styles.label}>
              {t('files')} <span className={styles.hint}>({t('filesHint')})</span>
            </label>
            <input
              id="files"
              type="file"
              multiple
              onChange={handleFileChange}
              className={styles.input}
            />

            {isEdit && idea?.files?.length > 0 && (
              <div className={styles.fileGrid}>
                {idea.files.map((file) => {
                  const marked = removeFileUrls.includes(file.url)
                  return (
                    <FilePreviewCard
                      key={file.url}
                      file={file}
                      removable
                      isMarked={marked}
                      onToggleRemove={() => toggleRemoveExistingFile(file.url)}
                      t={t}
                    />
                  )
                })}
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className={styles.fileGrid}>
                {selectedFilePreviews.map((file) => (
                  <FilePreviewCard key={file.name} file={file} t={t} />
                ))}
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => router.back()}
              className={styles.cancelBtn}
            >
              {t('cancel')}
            </button>
            <button type="submit" disabled={isLoading} className={styles.submitBtn}>
              {isLoading ? (
                <span className={styles.spinner} />
              ) : isEdit ? t('saveChanges') : t('submitIdea')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
