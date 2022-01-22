import { transparentize } from 'polished'
import React, { useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { useMedia } from 'react-use'
import styled from 'styled-components'

import { ContentWrapper, PageWrapper } from '../components'
import { AutoColumn } from '../components/Column'
import Panel from '../components/Panel'
import { AutoRow, RowBetween } from '../components/Row'
import TopPoolList from '../components/PoolList'
import RecentlyPurchasedList from '../components/RecentlyPurchasedList'
import TxnList from '../components/TxnList'
import { useGlobalData, useGlobalTransactionsTradegen } from '../contexts/GlobalData'
import { useAllPoolData } from '../contexts/PoolData'
import { useAllNFTPoolData } from '../contexts/NFTPoolData'
import { ThemedBackground, TYPE } from '../Theme'
import GlobalStats from '../components/GlobalStats'

const ListOptions = styled(AutoRow)`
  height: 40px;
  width: 100%;
  font-size: 1.25rem;
  font-weight: 600;

  @media screen and (max-width: 640px) {
    font-size: 1rem;
  }
`

const GridRow = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: 1fr 1fr;
  column-gap: 6px;
  align-items: start;
  justify-content: space-between;
`

function GlobalPage() {
  // get data for lists and totals
  const allPools = useAllPoolData()
  const allNFTPools = useAllNFTPoolData()
  const transactionsTradegen = useGlobalTransactionsTradegen()

  console.log(transactionsTradegen);

  // breakpoints
  const below800 = useMedia('(max-width: 800px)')

  // scrolling refs
  useEffect(() => {
    document.querySelector('body').scrollTo({
      behavior: 'smooth',
      top: 0,
    })
  }, [])

  return (
    <PageWrapper>
      <ThemedBackground
        backgroundColor={transparentize(0.6, '#5271FF')}
        endColor={transparentize(1, '#212429')}
      />
      <ContentWrapper>
        <div>
          <AutoColumn gap="24px" style={{ paddingBottom: below800 ? '0' : '24px' }}>
          </AutoColumn>
          <GlobalStats></GlobalStats>
          <ListOptions gap="10px" style={{ marginTop: '2rem', marginBottom: '.5rem' }}>
            <RowBetween>
              <TYPE.main fontSize={'1.125rem'}>Recently Listed</TYPE.main>
            </RowBetween>
          </ListOptions>
          <Panel style={{ marginTop: '6px', padding: '1.125rem 0 ' }}>
            <TopPoolList pools={allPools} />
          </Panel>
          <ListOptions gap="10px" style={{ marginTop: '2rem', marginBottom: '.5rem' }}>
            <RowBetween>
              <TYPE.main fontSize={'1rem'}>Recently Purchased</TYPE.main>
            </RowBetween>
          </ListOptions>
          <Panel style={{ marginTop: '6px', padding: '1.125rem 0 ' }}>
            <RecentlyPurchasedList purchases={transactionsTradegen ? transactionsTradegen.purchases : []} useTracked={true} />
          </Panel>
          <span>
            <TYPE.main fontSize={'1.125rem'} style={{ marginTop: '2rem' }}>
              Transactions
            </TYPE.main>
          </span>
          <Panel style={{ margin: '1rem 0' }}>
            <TxnList transactions={transactionsTradegen} />
          </Panel>
        </div>
      </ContentWrapper>
    </PageWrapper>
  )
}

export default withRouter(GlobalPage)
