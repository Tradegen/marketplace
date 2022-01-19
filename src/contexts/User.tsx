import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react'

import { client, tradegenClient } from '../apollo/client'
import {
  LiquidityPositionsQuery,
  LiquidityPositionsQueryVariables,
  UserHistoryQuery,
  UserHistoryQueryVariables,
  UserTransactionsQuery,
  UserTransactionsTradegenQuery,
  InvestmentPositionsQuery,
  InvestmentPositionsQueryVariables,
  ManagedInvestmentsQuery,
  ManagedInvestmentsQueryVariables
} from '../apollo/generated/types'
import { USER_TRANSACTIONS_TRADEGEN, USER_POSITIONS_TRADEGEN, MANAGED_INVESTMENTS } from '../apollo/queries'

dayjs.extend(utc)

const UPDATE_TRANSACTIONS = 'UPDATE_TRANSACTIONS'
const UPDATE_POSITIONS = 'UPDATE_POSITIONS '
const UPDATE_MANAGED_INVESTMENTS = 'UPDATE_MANAGED_INVESTMENTS'

const TRANSACTIONS_KEY = 'TRANSACTIONS_KEY'
const POSITIONS_KEY = 'POSITIONS_KEY'
const MANAGED_INVESTMENTS_KEY = 'MANAGED_INVESTMENTS_KEY'

type IUserContext = [
  any,
  { updateTransactions; updatePositions; updateManagedInvestments }
]

const UserContext = createContext<IUserContext | undefined>(undefined)

function useUserContext() {
  return useContext(UserContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE_TRANSACTIONS: {
      const { account, transactions } = payload
      return {
        ...state,
        [account]: {
          ...state?.[account],
          [TRANSACTIONS_KEY]: transactions,
        },
      }
    }
    case UPDATE_POSITIONS: {
      const { account, positions } = payload
      return {
        ...state,
        [account]: { ...state?.[account], [POSITIONS_KEY]: positions },
      }
    }
    case UPDATE_MANAGED_INVESTMENTS: {
      const { account, managedInvestments } = payload
      return {
        ...state,
        [account]: { ...state?.[account], [MANAGED_INVESTMENTS_KEY]: managedInvestments },
      }
    }

    default: {
      throw Error(`Unexpected action type in DataContext reducer: '${type}'.`)
    }
  }
}

const INITIAL_STATE = {}

export default function Provider({ children }: { children?: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)

  const updateTransactions = useCallback((account, transactions) => {
    dispatch({
      type: UPDATE_TRANSACTIONS,
      payload: {
        account,
        transactions,
      },
    })
  }, [])

  const updatePositions = useCallback((account, positions) => {
    dispatch({
      type: UPDATE_POSITIONS,
      payload: {
        account,
        positions,
      },
    })
  }, [])

  const updateManagedInvestments = useCallback((account, managedInvestments) => {
    dispatch({
      type: UPDATE_MANAGED_INVESTMENTS,
      payload: {
        account,
        managedInvestments,
      },
    })
  }, [])

  return (
    <UserContext.Provider
      value={useMemo(
        () => [
          state,
          { updateTransactions, updatePositions, updateManagedInvestments },
        ],
        [state, updateTransactions, updatePositions, updateManagedInvestments]
      )}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUserTransactions(account) {
  const [state, { updateTransactions }] = useUserContext()
  const transactions = state?.[account]?.[TRANSACTIONS_KEY]
  useEffect(() => {
    async function fetchData(account) {
      try {
        const result = await tradegenClient.query<UserTransactionsTradegenQuery>({
          query: USER_TRANSACTIONS_TRADEGEN,
          variables: {
            user: account,
          },
          fetchPolicy: 'no-cache',
        })
        if (result?.data) {
          updateTransactions(account, result?.data)
        }
      } catch (e) {
        console.log(e)
      }
    }
    if (!transactions && account) {
      fetchData(account)
    }
  }, [account, transactions, updateTransactions])

  return transactions || {}
}

export function useUserPositions(account) {
  const [state, { updatePositions }] = useUserContext()
  const positions = state?.[account]?.[POSITIONS_KEY]

  useEffect(() => {
    async function fetchData(account) {
      try {
        const result = await tradegenClient.query<InvestmentPositionsQuery, InvestmentPositionsQueryVariables>({
          query: USER_POSITIONS_TRADEGEN,
          variables: {
            user: account,
          },
          fetchPolicy: 'no-cache',
        })
        let formattedPositions = [];
        if (result?.data?.poolPositions) {
          result?.data?.poolPositions.map(async (positionData) => {
            return formattedPositions.push({
              address: positionData.pool.id,
              type: "Pool",
              name: positionData.pool.name,
              USDValue: positionData.USDValue
            })
          })
        }
        if (result?.data?.nftpoolPositions) {
          result?.data?.nftpoolPositions.map(async (positionData) => {
            return formattedPositions.push({
              address: positionData.NFTPool.id,
              type: "NFT Pool",
              name: positionData.NFTPool.name,
              USDValue: positionData.USDValue
            })
          })
        }
        console.log(formattedPositions)
        updatePositions(account, formattedPositions)
      } catch (e) {
        console.log(e)
      }
    }
    if (!positions && account) {
      fetchData(account)
    }
  }, [account, positions, updatePositions])

  return positions
}

export function useManagedInvestments(account) {
  const [state, { updateManagedInvestments }] = useUserContext()
  const managedInvestments = state?.[account]?.[MANAGED_INVESTMENTS_KEY]

  useEffect(() => {
    async function fetchData(account) {
      try {
        const result = await tradegenClient.query<ManagedInvestmentsQuery, ManagedInvestmentsQueryVariables>({
          query: MANAGED_INVESTMENTS,
          variables: {
            manager: account,
          },
          fetchPolicy: 'no-cache',
        })
        let formattedManagedInvestments = [];
        if (result?.data?.managedInvestments) {
          result?.data?.managedInvestments.map(async (investmentData) => {
            if (investmentData.pool) {
              return formattedManagedInvestments.push({
                address: investmentData.pool.id,
                type: "Pool",
                name: investmentData.pool.name,
                USDValue: investmentData.pool.totalValueLockedUSD
              })
            }
            if (investmentData.NFTPool) {
              return formattedManagedInvestments.push({
                address: investmentData.NFTPool.id,
                type: "NFT Pool",
                name: investmentData.NFTPool.name,
                USDValue: investmentData.NFTPool.totalValueLockedUSD
              })
            }
          })
        }
        console.log(formattedManagedInvestments)
        updateManagedInvestments(account, formattedManagedInvestments)
      } catch (e) {
        console.log(e)
      }
    }
    if (!managedInvestments && account) {
      fetchData(account)
    }
  }, [account, managedInvestments, updateManagedInvestments])

  return managedInvestments
}
