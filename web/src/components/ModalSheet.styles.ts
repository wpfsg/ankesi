import styled from 'styled-components'
import { motion } from 'framer-motion'
import { glass } from '../styles/shared'

export const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 30;
  background: rgba(0, 0, 0, 0.28);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;

  @media (min-width: 720px) {
    align-items: center;
    padding: 24px;
  }
`

export const ModalCard = styled(motion.div)`
  ${glass}
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 24px);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: 16px 20px calc(env(safe-area-inset-bottom, 0px) + 24px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (min-width: 720px) {
    border-radius: var(--radius-lg);
    padding-bottom: 24px;
  }
`

export const ModalHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

export const ModalTitle = styled.span`
  font-size: 18px;
  font-weight: 600;
`
