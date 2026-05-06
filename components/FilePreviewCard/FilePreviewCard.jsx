'use client'

import { toApiAssetUrl } from '../../services/api'
import styles from './FilePreviewCard.module.css'

const imageMimePrefix = 'image/'

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  const idx = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / 1024 ** idx
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`
}

function fileTypeLabel(mimeType = '', fileName = '') {
  if (mimeType.startsWith(imageMimePrefix)) return 'Image'
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.includes('word')) return 'Word'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Sheet'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'Slides'
  if (mimeType.includes('zip')) return 'ZIP'
  const ext = fileName.split('.').pop()
  return ext ? ext.toUpperCase() : 'File'
}

export default function FilePreviewCard({
  file,
  removable = false,
  isMarked = false,
  onToggleRemove,
  t = (v) => v,
}) {
  const name = file.originalName || file.name || 'file'
  const mimeType = file.mimeType || file.type || ''
  const size = file.size || 0
  const src = file.url ? toApiAssetUrl(file.url) : file.previewUrl || ''
  const isImage = mimeType.startsWith(imageMimePrefix)

  return (
    <article className={`${styles.card} ${isMarked ? styles.cardMarked : ''}`}>
      <div className={styles.thumb}>
        {isImage && src ? (
          <img src={src} alt={name} className={styles.image} />
        ) : (
          <span className={styles.fileIcon}>{fileTypeLabel(mimeType, name)}</span>
        )}
      </div>
      <div className={styles.content}>
        <p className={styles.name} title={name}>{name}</p>
        <p className={styles.meta}>
          {fileTypeLabel(mimeType, name)}
          {size ? ` • ${formatBytes(size)}` : ''}
        </p>
        <div className={styles.actions}>
          {src && (
            <a href={src} target="_blank" rel="noreferrer" className={styles.link}>
              {t('browse')}
            </a>
          )}
          {removable && (
            <button type="button" onClick={onToggleRemove} className={styles.removeBtn}>
              {isMarked ? t('cancel') : t('delete')}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
