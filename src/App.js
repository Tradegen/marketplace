import React, { useState } from 'react'
import { ApolloProvider } from 'react-apollo'
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'
import styled from 'styled-components'

import { client } from './apollo/client'
import GoogleAnalyticsReporter from './components/analytics/GoogleAnalyticsReporter'
import LocalLoader from './components/LocalLoader'
import SideNav from './components/SideNav'
import Header from './components/Header'
import { useGlobalChartData, useGlobalData } from './contexts/GlobalData'
import AccountLookup from './pages/AccountLookup'
import AccountPage from './pages/AccountPage'
import AllNFTPoolsPage from './pages/AllNFTPoolsPage'
import AllPoolsPage from './pages/AllPoolsPage'
import GlobalPage from './pages/GlobalPage'
import PoolPage from './pages/PoolPage'
import NFTPoolPage from './pages/NFTPoolPage'
import { isAddress } from './utils'

const AppWrapper = styled.div`
  position: relative;
  width: 100%;
`
const ContentWrapper = styled.div`
  display: grid;
  grid-template-columns: 220px 1fr;

  @media screen and (max-width: 1400px) {
    grid-template-columns: 220px 1fr;
  }

  @media screen and (max-width: 1080px) {
    grid-template-columns: 1fr;
    max-width: 100vw;
    overflow: hidden;
    grid-gap: 0;
  }
`

const Center = styled.div`
  height: 100%;
  z-index: 9999;
  transition: width 0.25s ease;
  background-color: rgb(14, 14, 35);
`
/**
 * Wrap the component with the header and sidebar pinned tab
 */
const LayoutWrapper = ({ children, savedOpen, setSavedOpen }) => {
  return (
    <>
      <ContentWrapper open={savedOpen}>
        <SideNav />
        <Center id="center">{children}</Center>
      </ContentWrapper>
    </>
  )
}

function App() {
  const [savedOpen, setSavedOpen] = useState(false)

  const globalData = useGlobalData()
  const globalChartData = useGlobalChartData()

  return (
    <ApolloProvider client={client}>
      <AppWrapper>
        {globalData &&
          Object.keys(globalData).length > 0 &&
          globalChartData &&
          Object.keys(globalChartData).length > 0 ? (
          <BrowserRouter>
            <Header></Header>
            <Route component={GoogleAnalyticsReporter} />
            <Switch>
              <Route
                exacts
                strict
                path="/pool/:poolAddress"
                render={({ match }) => {
                  if (
                    isAddress(match.params.poolAddress.toLowerCase())
                  ) {
                    return (
                      <LayoutWrapper savedOpen={savedOpen} setSavedOpen={setSavedOpen}>
                        <PoolPage address={match.params.poolAddress.toLowerCase()} />
                      </LayoutWrapper>
                    )
                  } else {
                    return <Redirect to="/dashboard" />
                  }
                }}
              />
              <Route
                exacts
                strict
                path="/nftpool/:nftPoolAddress"
                render={({ match }) => {
                  if (
                    isAddress(match.params.nftPoolAddress.toLowerCase())
                  ) {
                    return (
                      <LayoutWrapper savedOpen={savedOpen} setSavedOpen={setSavedOpen}>
                        <NFTPoolPage address={match.params.nftPoolAddress.toLowerCase()} />
                      </LayoutWrapper>
                    )
                  } else {
                    return <Redirect to="/dashboard" />
                  }
                }}
              />
              <Route
                exacts
                strict
                path="/account/:accountAddress"
                render={({ match }) => {
                  if (isAddress(match.params.accountAddress.toLowerCase())) {
                    return (
                      <LayoutWrapper savedOpen={savedOpen} setSavedOpen={setSavedOpen}>
                        <AccountPage account={match.params.accountAddress.toLowerCase()} />
                      </LayoutWrapper>
                    )
                  } else {
                    return <Redirect to="/dashboard" />
                  }
                }}
              />

              <Route path="/dashboard">
                <Center>
                  <GlobalPage />
                </Center>
              </Route>

              <Route path="/pools">
                <LayoutWrapper savedOpen={savedOpen} setSavedOpen={setSavedOpen}>
                  <AllPoolsPage />
                </LayoutWrapper>
              </Route>

              <Route path="/nftpools">
                <LayoutWrapper savedOpen={savedOpen} setSavedOpen={setSavedOpen}>
                  <AllNFTPoolsPage />
                </LayoutWrapper>
              </Route>

              <Route path="/accounts">
                <LayoutWrapper savedOpen={savedOpen} setSavedOpen={setSavedOpen}>
                  <AccountLookup />
                </LayoutWrapper>
              </Route>

              <Redirect to="/dashboard" />
            </Switch>
          </BrowserRouter>
        ) : (
          <LocalLoader fill="true" />
        )}
      </AppWrapper>
    </ApolloProvider>
  )
}

export default App
