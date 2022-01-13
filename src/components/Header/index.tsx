import { darken } from 'polished'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'
import { ExternalLink } from '../../Theme/components'

import LogoDark from '../../assets/name.png'
import Row, { RowFixed } from '../Row'

const HeaderFrame = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px;
  align-items: left;
  justify-content: space-between;
  flex-direction: row;
  width: 100%;
  top: 0;
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1rem;
  z-index: 2;
  background-color: rgb(14, 14, 35);
`

const HeaderRow = styled(RowFixed)`
width: 100%;
`

const HeaderLinks = styled(Row)`
  justify-content: left;
`

const Title = styled(NavLink)`
  display: flex;
  align-items: center;
  pointer-events: auto;
  justify-self: flex-start;
  margin-right: 12px;
`

const TradegenIcon = styled.div`
  transition: transform 0.3s ease;
  :hover {
    transform: rotate(-5deg);
  }
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName,
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  margin: 0 12px;
  font-weight: 500;
  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.text1};
  }
  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`

const StyledExternalLink = styled(ExternalLink).attrs({
  activeClassName,
})<{ isActive?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  margin: 0 12px;
  font-weight: 500;
  &.${activeClassName} {
    border-radius: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.text1};
  }
  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`

export const StyledMenuButton = styled.button`
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 35px;
  background-color: ${({ theme }) => theme.bg3};
  margin-left: 8px;
  padding: 0.15rem 0.5rem;
  border-radius: 0.5rem;
  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.bg4};
  }
  svg {
    margin-top: 2px;
  }
  > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

export default function Header() {
  return (
    <HeaderFrame>
      <HeaderRow>
        <Title to="/">
          <TradegenIcon>
            <img width={'180px'} src={LogoDark} alt="logo" />
          </TradegenIcon>
        </Title>
        <HeaderLinks>
          <StyledNavLink
            id={`dashboard-nav-link`}
            to={'/dashboard'}
          >
            Dashboard
          </StyledNavLink>
          <StyledNavLink id="marketplace-nav-link" to="/marketplace">
            Marketplace
          </StyledNavLink>
          <StyledExternalLink id={`stake-nav-link`} href={'https://app.tradegen.io'}>
            App <span style={{ fontSize: '11px' }}>↗</span>
          </StyledExternalLink>
          <StyledExternalLink id={`stake-nav-link`} href={'https://info.tradegen.io'}>
            Charts <span style={{ fontSize: '11px' }}>↗</span>
          </StyledExternalLink>
          <StyledExternalLink id={`stake-nav-link`} href={'https://docs.tradegen.io'}>
            Docs <span style={{ fontSize: '11px' }}>↗</span>
          </StyledExternalLink>
          <StyledExternalLink id={`stake-nav-link`} href={'https://app.moola.market'}>
            Get mcUSD <span style={{ fontSize: '11px' }}>↗</span>
          </StyledExternalLink>
        </HeaderLinks>
      </HeaderRow>
    </HeaderFrame>
  )
}