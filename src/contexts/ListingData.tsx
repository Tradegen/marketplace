import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react'

import { marketplaceClient } from '../apollo/client'
import {
  ListingDataLatestQuery
} from '../apollo/generated/types'
import {
  LISTING_DATA_LATEST
} from '../apollo/marketplaceQueries'

const UPDATE = 'UPDATE'

// format dayjs with the libraries that we need
dayjs.extend(utc)
dayjs.extend(weekOfYear)

interface IListingDataState {
  listingData?: IListingData
}

interface IListingDataActions {
  update: (data: IListingData) => void
}

const ListingDataContext = createContext<[IListingDataState, IListingDataActions]>(null)

function useListingDataContext() {
  return useContext(ListingDataContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { data } = payload
      return {
        ...state,
        listingData: data,
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

  return (
    <ListingDataContext.Provider
      value={useMemo(
        () => [
          state,
          {
            update
          },
        ],
        [
          state,
          update
        ]
      )}
    >
      {children}
    </ListingDataContext.Provider>
  )
}

type IListingData = ListingDataLatestQuery['listings'][number]

/**
 * Hook that fetches listings for a given NFT pool
 */
export function useListingData(address: string): Partial<IListingData> {
  const [state, { update }] = useListingDataContext()

  const data: IListingData | undefined = state?.listingData

  const fetchData = useCallback(async () => {
    const listingData = await getListingData(address)

    if (listingData && listingData.length > 0) {
      update(listingData)
    }
  }, [update])

  useEffect(() => {
    if (!data) {
      fetchData()
    }
  }, [data, fetchData, state])

  return data ?? undefined
}

async function getListingData(address: string) {
    try {
        const result = await marketplaceClient.query({
          query: LISTING_DATA_LATEST,
          variables: {
            assetAddressID: address,
          },
          fetchPolicy: 'cache-first',
        })
        let listings = result?.data?.listings
        if (!listings) {
          return []
        }
        listings = listings.filter((x) => {
          return x.exists
        })
        return listings
      } catch (e) {
        console.log(e)
      }
    
      return []
}