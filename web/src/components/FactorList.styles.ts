import styled from 'styled-components'

export const Factor = styled.div`
  padding: 10px 0;
  border-bottom: 1px solid var(--brd);

  &:last-child {
    border-bottom: 0;
  }
`

export const FactorTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
`

export const FactorName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--fg);
`

export const FactorVal = styled.span`
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  color: var(--fg-2);
  text-align: right;
  white-space: nowrap;
`

export const FactorBar = styled.div`
  height: 4px;
  margin-top: 8px;
  border-radius: 2px;
  background: var(--ctl-bg-2);
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    border-radius: 2px;
    background: var(--accent);
    transition: width 400ms var(--spring);
  }
`

export const FactorFoot = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
  font-size: 11px;
  color: var(--fg-3);
`
