import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react'

import { marketplaceClient, tradegenClient } from '../apollo/client'
import {
  GlobalDataMarketplaceLatestQuery,
  GlobalDataMarketplaceLatestQueryVariables,
  GlobalDataMarketplaceQuery,
  GlobalDataMarketplaceQueryVariables,
  GlobalTransactionsTradegenQuery,
} from '../apollo/generated/types'
import {
  GLOBAL_DATA_MARKETPLACE,
  GLOBAL_DATA_MARKETPLACE_LATEST,
  ALL_LISTINGS,
  ALL_NFT_POOLS
} from '../apollo/marketplaceQueries'
import { MARKETPLACE_ADDRESS } from '../constants'
import {
  get2DayPercentChange,
  getBlockFromTimestamp,
  getBlocksFromTimestamps,
  getPercentChange,
  getTimeframe,
} from '../utils'
import { useTimeframe } from './Application'
import { useAllNFTPoolData } from './NFTPoolData'

const UPDATE = 'UPDATE'
const UPDATE_ALL_LISTINGS_IN_MARKETPLACE = 'UPDATE_ALL_LISTINGS_IN_MARKETPLACE'
const UPDATE_ALL_NFT_POOLS_IN_TRADEGEN = 'UPDATE_ALL_NFT_POOLS_IN_TRADEGEN'

const offsetVolumes = [
  // '0x9ea3b5b4ec044b70375236a281986106457b20ef',
  // '0x05934eba98486693aaec2d00b0e9ce918e37dc3f',
  // '0x3d7e683fc9c86b4d653c9e47ca12517440fad14e',
  // '0xfae9c647ad7d89e738aba720acf09af93dc535f7',
  // '0x7296368fe9bcb25d3ecc19af13655b907818cc09',
]

// format dayjs with the libraries that we need
dayjs.extend(utc)
dayjs.extend(weekOfYear)

interface IGlobalDataState {
  globalData?: IGlobalDataMarketplace
  allListings: unknown
  allNFTPools: unknown
}

interface IGlobalDataActions {
  update: (data: IGlobalDataMarketplace) => void
  updateAllListingsInMarketplace: (tokens: unknown[]) => void
  updateAllNFTPoolsInTradegen: (tokens: unknown[]) => void
}

const GlobalDataContext = createContext<[IGlobalDataState, IGlobalDataActions]>(null)

function useGlobalDataContext() {
  return useContext(GlobalDataContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { data } = payload
      return {
        ...state,
        globalData: data,
      }
    }
    case UPDATE_ALL_LISTINGS_IN_MARKETPLACE: {
      const { allListings } = payload
      return {
        ...state,
        allListings,
      }
    }

    case UPDATE_ALL_NFT_POOLS_IN_TRADEGEN: {
      const { allNFTPools } = payload
      return {
        ...state,
        allNFTPools,
      }
    }

    default: {
      throw Error(`Unexpected action type in DataContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {})
  const update = useCallback((data) => {
    dispatch({
      type: UPDATE,
      payload: {
        data,
      },
    })
  }, [])
  const updateAllListingsInMarketplace = useCallback((allListings) => {
    dispatch({
      type: UPDATE_ALL_LISTINGS_IN_MARKETPLACE,
      payload: {
        allListings,
      },
    })
  }, [])

  const updateAllNFTPoolsInTradegen = useCallback((allNFTPools) => {
    dispatch({
      type: UPDATE_ALL_NFT_POOLS_IN_TRADEGEN,
      payload: {
        allNFTPools,
      },
    })
  }, [])

  return (
    <GlobalDataContext.Provider
      value={useMemo(
        () => [
          state,
          {
            update,
            updateAllListingsInMarketplace,
            updateAllNFTPoolsInTradegen
          },
        ],
        [
          state,
          update,
          updateAllListingsInMarketplace,
          updateAllNFTPoolsInTradegen
        ]
      )}
    >
      {children}
    </GlobalDataContext.Provider>
  )
}

type IGlobalDataMarketplace = GlobalDataMarketplaceQuery['marketplaces'][number] &
  Partial<{
    oneDayVolumeUSD: number
    oneWeekVolumeUSD: number
    oneMonthVolumeUSD: number
    dailyVolumeChangeUSD: number
    weeklyVolumeChangeUSD: number
    monthlyVolumeChangeUSD: number
    oneDayVolumeTokens: number
    oneWeekVolumeTokens: number
    oneMonthVolumeTokens: number
    dailyVolumeChangeTokens: number
    weeklyVolumeChangeTokens: number
    monthlyVolumeChangeTokens: number
    oneDayTxns: number
    oneWeekTxns: number
    oneMonthTxns: number
    dailyTxnChange: number
    weeklyTxnChange: number
    monthlyTxnChange: number
  }>

/**
 * Hook that fetches overview data, plus all listings and NFT pools for search
 */
export function useGlobalData(): Partial<IGlobalDataMarketplace> {
  const [state, { update, updateAllNFTPoolsInTradegen }] = useGlobalDataContext()

  const data: IGlobalDataMarketplace | undefined = state?.globalData

  const fetchData = useCallback(async () => {
    const globalDataMarketplace = await getGlobalDataMarketplace()

    if (globalDataMarketplace) {
      update(globalDataMarketplace)
    }

    const allNFTPools = await getAllNFTPoolsOnTradegen()
    if (allNFTPools) {
      updateAllNFTPoolsInTradegen(allNFTPools)
    }
  }, [update, updateAllNFTPoolsInTradegen])

  useEffect(() => {
    if (!data) {
      fetchData()
    }
  }, [data, fetchData, state])

  return data ?? {}
}

async function getGlobalDataMarketplace(): Promise<IGlobalDataMarketplace | null> {
  // data for each day , historic data used for % changes
  let data: IGlobalDataMarketplace | null = null
  let oneDayData: GlobalDataMarketplaceQuery['marketplaces'][number] | null = null
  let twoDayData: GlobalDataMarketplaceQuery['marketplaces'][number] | null = null

  try {
    // get timestamps for the days
    const utcCurrentTime = dayjs()
    const utcOneDayBack = utcCurrentTime.subtract(1, 'day').unix()
    const utcTwoDaysBack = utcCurrentTime.subtract(2, 'day').unix()
    const utcOneWeekBack = utcCurrentTime.subtract(1, 'week').unix()
    const utcTwoWeeksBack = utcCurrentTime.subtract(2, 'week').unix()
    const utcOneMonthBack = utcCurrentTime.subtract(30, 'day').unix()
    const utcTwoMonthsBack = utcCurrentTime.subtract(60, 'day').unix()

    // get the blocks needed for time travel queries
    const [oneDayBlock, twoDayBlock, oneWeekBlock, twoWeekBlock, oneMonthBlock, twoMonthBlock] = await getBlocksFromTimestamps([
      utcOneDayBack,
      utcTwoDaysBack,
      utcOneWeekBack,
      utcTwoWeeksBack,
      utcOneMonthBack,
      utcTwoMonthsBack
    ])

    // fetch the global data
    const result = await marketplaceClient.query<GlobalDataMarketplaceLatestQuery, GlobalDataMarketplaceLatestQueryVariables>({
      query: GLOBAL_DATA_MARKETPLACE_LATEST,
      variables: {
        marketplaceAddress: MARKETPLACE_ADDRESS,
      },
      fetchPolicy: 'cache-first',
    })
    data = result.data.marketplaces[0]

    // fetch the historical data
    const oneDayResult = await marketplaceClient.query<GlobalDataMarketplaceLatestQuery, GlobalDataMarketplaceQueryVariables>({
      query: GLOBAL_DATA_MARKETPLACE,
      variables: {
        block: oneDayBlock?.number,
        marketplaceAddress: MARKETPLACE_ADDRESS,
      },
      fetchPolicy: 'cache-first',
    })
    oneDayData = oneDayResult.data.marketplaces[0]

    const twoDayResult = await marketplaceClient.query<GlobalDataMarketplaceLatestQuery, GlobalDataMarketplaceQueryVariables>({
      query: GLOBAL_DATA_MARKETPLACE,
      variables: {
        block: twoDayBlock?.number,
        marketplaceAddress: MARKETPLACE_ADDRESS,
      },
      fetchPolicy: 'cache-first',
    })
    twoDayData = twoDayResult.data.marketplaces[0]

    const oneWeekResult = await marketplaceClient.query<GlobalDataMarketplaceLatestQuery, GlobalDataMarketplaceQueryVariables>({
      query: GLOBAL_DATA_MARKETPLACE,
      variables: {
        block: oneWeekBlock?.number,
        marketplaceAddress: MARKETPLACE_ADDRESS,
      },
      fetchPolicy: 'cache-first',
    })
    const oneWeekData = oneWeekResult.data.marketplaces[0]

    const twoWeekResult = await marketplaceClient.query<GlobalDataMarketplaceQuery>({
      query: GLOBAL_DATA_MARKETPLACE,
      variables: {
        block: twoWeekBlock?.number,
        marketplaceAddress: MARKETPLACE_ADDRESS,
      },
      fetchPolicy: 'cache-first',
    })
    const twoWeekData = twoWeekResult.data.marketplaces[0]

    const oneMonthResult = await marketplaceClient.query<GlobalDataMarketplaceLatestQuery, GlobalDataMarketplaceQueryVariables>({
      query: GLOBAL_DATA_MARKETPLACE,
      variables: {
        block: oneMonthBlock?.number,
        marketplaceAddress: MARKETPLACE_ADDRESS,
      },
      fetchPolicy: 'cache-first',
    })
    const oneMonthData = oneMonthResult.data.marketplaces[0]

    const twoMonthResult = await marketplaceClient.query<GlobalDataMarketplaceQuery>({
      query: GLOBAL_DATA_MARKETPLACE,
      variables: {
        block: twoMonthBlock?.number,
        marketplaceAddress: MARKETPLACE_ADDRESS,
      },
      fetchPolicy: 'cache-first',
    })
    const twoMonthData = twoMonthResult.data.marketplaces[0]

    if (data && oneDayData && twoDayData && oneWeekData && twoWeekData && oneMonthData && twoMonthData) {
      //Get volume in USD
      const [oneDayVolumeUSD, dailyVolumeChangeUSD] = get2DayPercentChange(
        data.totalVolumeUSD,
        oneDayData.totalVolumeUSD,
        twoDayData.totalVolumeUSD
      )
      const [oneWeekVolumeUSD, weeklyVolumeChangeUSD] = get2DayPercentChange(
        data.totalVolumeUSD,
        oneWeekData.totalVolumeUSD,
        twoWeekData.totalVolumeUSD
      )
      const [oneMonthVolumeUSD, monthlyVolumeChangeUSD] = get2DayPercentChange(
        data.totalVolumeUSD,
        oneMonthData.totalVolumeUSD,
        twoMonthData.totalVolumeUSD
      )

      //Get volume in tokens
      const [oneDayVolumeTokens, dailyVolumeChangeTokens] = get2DayPercentChange(
        data.totalTokensSold,
        oneDayData.totalTokensSold,
        twoDayData.totalTokensSold
      )
      const [oneWeekVolumeTokens, weeklyVolumeChangeTokens] = get2DayPercentChange(
        data.totalTokensSold,
        oneWeekData.totalTokensSold,
        twoWeekData.totalTokensSold
      )
      const [oneMonthVolumeTokens, monthlyVolumeChangeTokens] = get2DayPercentChange(
        data.totalTokensSold,
        oneMonthData.totalTokensSold,
        twoMonthData.totalTokensSold
      )

      //Get transaction count
      const [oneDayTxns, dailyTxnChange] = get2DayPercentChange(
        data.txCount,
        oneDayData.txCount ? oneDayData.txCount : '0',
        twoDayData.txCount ? twoDayData.txCount : '0'
      )
      const [oneWeekTxns, weeklyTxnChange] = get2DayPercentChange(
        data.txCount,
        oneWeekData.txCount ? oneWeekData.txCount : '0',
        twoWeekData.txCount ? twoWeekData.txCount : '0'
      )
      const [oneMonthTxns, monthlyTxnChange] = get2DayPercentChange(
        data.txCount,
        oneMonthData.txCount ? oneMonthData.txCount : '0',
        twoMonthData.txCount ? twoMonthData.txCount : '0'
      )

      const additionalData = {
        // add relevant fields with the calculated amounts
        oneDayVolumeUSD: oneDayVolumeUSD,
        oneWeekVolumeUSD: oneWeekVolumeUSD,
        oneMonthVolumeUSD: oneMonthVolumeUSD,
        dailyVolumeChangeUSD: dailyVolumeChangeUSD,
        weeklyVolumeChangeUSD: weeklyVolumeChangeUSD,
        monthlyVolumeChangeUSD: monthlyVolumeChangeUSD,
        oneDayVolumeTokens: oneDayVolumeTokens,
        oneWeekVolumeTokens: oneWeekVolumeTokens,
        oneMonthVolumeTokens: oneMonthVolumeTokens,
        dailyVolumeChangeTokens: dailyVolumeChangeTokens,
        weeklyVolumeChangeTokens: weeklyVolumeChangeTokens,
        monthlyVolumeChangeTokens: monthlyVolumeChangeTokens,
        oneDayTxns: oneDayTxns,
        oneWeekTxns: oneWeekTxns,
        oneMonthTxns: oneMonthTxns,
        dailyTxnChange: dailyTxnChange,
        weeklyTxnChange: weeklyTxnChange,
        monthlyTxnChange: monthlyTxnChange,
      }
      return { ...data, ...additionalData }
    }
  } catch (e) {
    console.log(e)
  }

  return data
}

export function useAllNFTPoolsInTradegen() {
  const [state] = useGlobalDataContext()
  const allNFTPools = state?.allNFTPools

  return allNFTPools || []
}

const NFT_POOLS_TO_FETCH = 500;
/**
 * Loop through every NFT pool on Tradegen, used for search
 */
async function getAllNFTPoolsOnTradegen() {
  try {
    let allFound = false
    let skipCount = 0
    let NFTPools = []
    while (!allFound) {
      const result = await tradegenClient.query({
        query: ALL_NFT_POOLS,
        variables: {
          skip: skipCount,
        },
        fetchPolicy: 'cache-first',
      })
      NFTPools = NFTPools.concat(result?.data?.nftpools)
      if (result?.data?.nftpools?.length < NFT_POOLS_TO_FETCH || NFTPools.length > NFT_POOLS_TO_FETCH) {
        allFound = true
      }
      skipCount = skipCount += NFT_POOLS_TO_FETCH
    }
    return NFTPools
  } catch (e) {
    console.log(e)
  }
}