import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react'

import { healthClient } from '../apollo/client'
import { HealthQuery } from '../apollo/generated/types'
import { SUBGRAPH_HEALTH } from '../apollo/queries'
import { SUPPORTED_LIST_URLS__NO_ENS, timeframeOptions } from '../constants'
import getTokenList from '../utils/tokenLists'

dayjs.extend(utc)

const UPDATE = 'UPDATE'
const UPDATE_TIMEFRAME = 'UPDATE_TIMEFRAME'
const UPDATE_SESSION_START = 'UPDATE_SESSION_START'
const UPDATED_SUPPORTED_TOKENS = 'UPDATED_SUPPORTED_TOKENS'
const UPDATE_LATEST_BLOCK = 'UPDATE_LATEST_BLOCK'
const UPDATE_HEAD_BLOCK = 'UPDATE_HEAD_BLOCK'

const SUPPORTED_TOKENS = 'SUPPORTED_TOKENS'
const TIME_KEY = 'TIME_KEY'
const CURRENCY = 'CURRENCY'
const SESSION_START = 'SESSION_START'
const LATEST_BLOCK = 'LATEST_BLOCK'
const HEAD_BLOCK = 'HEAD_BLOCK'

type IApplicationState = {
  CURRENCY: string
  TIME_KEY: string
  [SESSION_START]: number
  [LATEST_BLOCK]?: number
  [HEAD_BLOCK]?: number
} & Record<string, unknown>

type IApplicationContext = [
  IApplicationState,
  {
    update: any
    updateSessionStart: any
    updateTimeframe: any
    updateSupportedTokens: any
    updateLatestBlock: any
    updateHeadBlock: any
  }
]

const ApplicationContext = createContext<IApplicationContext | null>(null)

function useApplicationContext() {
  return useContext(ApplicationContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { currency } = payload
      return {
        ...state,
        [CURRENCY]: currency,
      }
    }
    case UPDATE_TIMEFRAME: {
      const { newTimeFrame } = payload
      return {
        ...state,
        [TIME_KEY]: newTimeFrame,
      }
    }
    case UPDATE_SESSION_START: {
      const { timestamp } = payload
      return {
        ...state,
        [SESSION_START]: timestamp,
      }
    }

    case UPDATE_LATEST_BLOCK: {
      const { block } = payload
      return {
        ...state,
        [LATEST_BLOCK]: block,
      }
    }

    case UPDATE_HEAD_BLOCK: {
      const { block } = payload
      return {
        ...state,
        [HEAD_BLOCK]: block,
      }
    }

    case UPDATED_SUPPORTED_TOKENS: {
      const { supportedTokens } = payload
      return {
        ...state,
        [SUPPORTED_TOKENS]: supportedTokens,
      }
    }

    default: {
      throw Error(`Unexpected action type in DataContext reducer: '${type}'.`)
    }
  }
}

const INITIAL_STATE = {
  CURRENCY: 'USD',
  TIME_KEY: timeframeOptions.ALL_TIME,
}

interface Props {
  children?: React.ReactNode
}

export default function Provider({ children }: Props) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const update = useCallback((currency) => {
    dispatch({
      type: UPDATE,
      payload: {
        currency,
      },
    })
  }, [])

  // global time window for charts - see timeframe options in constants
  const updateTimeframe = useCallback((newTimeFrame) => {
    dispatch({
      type: UPDATE_TIMEFRAME,
      payload: {
        newTimeFrame,
      },
    })
  }, [])

  // used for refresh button
  const updateSessionStart = useCallback((timestamp) => {
    dispatch({
      type: UPDATE_SESSION_START,
      payload: {
        timestamp,
      },
    })
  }, [])

  const updateSupportedTokens = useCallback((supportedTokens) => {
    dispatch({
      type: UPDATED_SUPPORTED_TOKENS,
      payload: {
        supportedTokens,
      },
    })
  }, [])

  const updateLatestBlock = useCallback((block) => {
    dispatch({
      type: UPDATE_LATEST_BLOCK,
      payload: {
        block,
      },
    })
  }, [])

  const updateHeadBlock = useCallback((block) => {
    dispatch({
      type: UPDATE_HEAD_BLOCK,
      payload: {
        block,
      },
    })
  }, [])

  return (
    <ApplicationContext.Provider
      value={useMemo(
        () => [
          state,
          {
            update,
            updateSessionStart,
            updateTimeframe,
            updateSupportedTokens,
            updateLatestBlock,
            updateHeadBlock,
          },
        ],
        [state, update, updateTimeframe, updateSessionStart, updateSupportedTokens, updateLatestBlock, updateHeadBlock]
      )}
    >
      {children}
    </ApplicationContext.Provider>
  )
}

export function useLatestBlocks(): readonly [number | undefined, number | undefined] {
  const [state, { updateLatestBlock, updateHeadBlock }] = useApplicationContext()

  const latestBlock = state?.[LATEST_BLOCK]
  const headBlock = state?.[HEAD_BLOCK]

  useEffect(() => {
    async function fetch() {
      healthClient
        .query<HealthQuery>({
          query: SUBGRAPH_HEALTH,
        })
        .then((res) => {
          const syncedBlock = res.data.indexingStatusForCurrentVersion?.chains[0].latestBlock.number
          const headBlock = res.data.indexingStatusForCurrentVersion?.chains[0].chainHeadBlock.number
          if (syncedBlock && headBlock) {
            updateLatestBlock(syncedBlock)
            updateHeadBlock(headBlock)
          }
        })
        .catch((e) => {
          console.log(e)
        })
    }
    if (!latestBlock) {
      fetch()
    }
  }, [latestBlock, updateHeadBlock, updateLatestBlock])

  return [latestBlock, headBlock]
}

export function useCurrentCurrency(): [string, () => void] {
  const [state, { update }] = useApplicationContext()
  const toggleCurrency = useCallback(() => {
    if (state.currency === 'ETH') {
      update('USD')
    } else {
      update('ETH')
    }
  }, [state, update])
  return [state[CURRENCY], toggleCurrency]
}

export function useTimeframe() {
  const [state, { updateTimeframe }] = useApplicationContext()
  const activeTimeframe = state?.[TIME_KEY]
  return [activeTimeframe, updateTimeframe]
}

export function useStartTimestamp() {
  const [activeWindow] = useTimeframe()
  const [startDateTimestamp, setStartDateTimestamp] = useState<number | undefined>()

  // monitor the old date fetched
  useEffect(() => {
    const startTime =
      dayjs
        .utc()
        .subtract(
          1,
          activeWindow === timeframeOptions.WEEK ? 'week' : activeWindow === timeframeOptions.ALL_TIME ? 'year' : 'year'
        )
        .startOf('day')
        .unix() - 1
    // if we find a new start time less than the current startrtime - update oldest pooint to fetch
    setStartDateTimestamp(startTime)
  }, [activeWindow, startDateTimestamp])

  return startDateTimestamp
}

// keep track of session length for refresh ticker
export function useSessionStart() {
  const [state, { updateSessionStart }] = useApplicationContext()
  const sessionStart = state?.[SESSION_START]

  useEffect(() => {
    if (!sessionStart) {
      updateSessionStart(Date.now())
    }
  })

  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    let interval = null
    interval = setInterval(() => {
      setSeconds(Date.now() - sessionStart ?? Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [seconds, sessionStart])

  return parseInt((seconds / 1000).toString())
}

export function useListedTokens() {
  const [state, { updateSupportedTokens }] = useApplicationContext()
  const supportedTokens = state?.[SUPPORTED_TOKENS]

  useEffect(() => {
    async function fetchList() {
      const allFetched = await SUPPORTED_LIST_URLS__NO_ENS.reduce(async (fetchedTokens, url) => {
        const tokensSoFar = await fetchedTokens
        const newTokens = await getTokenList(url)
        return Promise.resolve([...tokensSoFar, ...newTokens.tokens])
      }, Promise.resolve([]))
      const formatted = allFetched?.map((t) => t.address.toLowerCase())
      updateSupportedTokens(formatted)
    }
    if (!supportedTokens) {
      fetchList()
    }
  }, [updateSupportedTokens, supportedTokens])

  return supportedTokens
}
