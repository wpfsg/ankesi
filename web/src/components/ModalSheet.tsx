import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IconBtn } from '../styles/shared'
import { Overlay, ModalCard, ModalHead, ModalTitle } from './ModalSheet.styles'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
}

export function ModalSheet({ title, onClose, children }: Props) {
  const { t } = useTranslation()
  return (
    <Overlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      role="presentation"
    >
      <ModalCard
        role="dialog"
        aria-modal="true"
        aria-label={title}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHead>
          <ModalTitle>{title}</ModalTitle>
          <IconBtn type="button" onClick={onClose} aria-label={t('sheet.close')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </IconBtn>
        </ModalHead>
        {children}
      </ModalCard>
    </Overlay>
  )
}
