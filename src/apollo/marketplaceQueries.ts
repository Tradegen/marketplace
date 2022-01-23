import { DocumentNode } from 'graphql'
import gql from 'graphql-tag'

export const GET_BLOCK = gql`
  query GetBlock($timestampFrom: BigInt!, $timestampTo: BigInt!) {
    blocks(
      first: 1
      orderBy: timestamp
      orderDirection: asc
      where: { timestamp_gt: $timestampFrom, timestamp_lt: $timestampTo }
    ) {
      id
      number
      timestamp
    }
  }
`

export const GET_BLOCKS = (timestamps: readonly number[]): DocumentNode => {
    let queryString = 'query blocks {'
    queryString += timestamps.map((timestamp) => {
      return `t${timestamp}:blocks(first: 1, orderBy: timestamp, orderDirection: desc, where: { timestamp_gt: ${timestamp}, timestamp_lt: ${timestamp + 600
        } }) {
        number
      }`
    })
    queryString += '}'
    return gql(queryString)
  }

export const GLOBAL_DATA_MARKETPLACE_LATEST = gql`
  query GlobalDataMarketplaceLatest($marketplaceAddress: ID!) {
    marketplaces(where: { id: $marketplaceAddress }) {
      id
      listingCount
      totalVolumeUSD
      totalTokensSold
      txCount
    }
  }
`

export const GLOBAL_DATA_MARKETPLACE = gql`
  query GlobalDataMarketplace($block: Int!, $marketplaceAddress: ID!) {
    marketplaces(block: { number: $block }, where: { id: $marketplaceAddress }) {
      id
      listingCount
      totalVolumeUSD
      totalTokensSold
      txCount
    }
  }
`

const ListingFields = gql`
  fragment ListingFields on Listing {
    id
    exists
    seller {
      id
    }
    assetAddress
    tokenClass
    numberOfTokens
    tokenPrice
    lastUpdated
  }
`

export const LISTINGS_CURRENT = gql`
  ${ListingFields}
  query ListingsCurrent {
    listings(first: 200, orderBy: tokenPrice, orderDirection: asc) {
      ...ListingFields
    }
  }
`

export const LISTINGS_DYNAMIC = gql`
  query ListingsDynamic($block: Int!) {
    listings(block: { number: $block }, first: 200, orderBy: tokenPrice, orderDirection: asc) {
      ...ListingFields
    }
  }
  ${ListingFields}
`

export const LISTING_DATA_LATEST = gql`
  query ListingDataLatest($assetAddressID: String!) {
    listings(where: { assetAddress: $assetAddressID }) {
      ...ListingFields
    }
  }
  ${ListingFields}
`

export const LISTING_DATA = gql`
  query ListingData($block: Int, $assetAddressID: ID!) {
    listings(block: { number: $block }, where: { id: $assetAddressID }) {
      ...ListingFields
    }
  }
  ${ListingFields}
`

export const FILTERED_TRANSACTIONS_TRADEGEN = gql`
  query FilteredTransactionsTradegen($allNFTPools: [String!]!) {
    createListings(first: 20, where: { assetAddress_in: $allNFTPools }, orderBy: timestamp, orderDirection: desc) {
      id
      timestamp
      seller
      assetAddress
      tokenClass
      numberOfTokens
      tokenPrice
    }
    purchases(first: 20, where: { assetAddress_in: $allNFTPools }, orderBy: timestamp, orderDirection: desc) {
      id
      timestamp
      buyer
      assetAddress
      tokenClass
      numberOfTokens
      tokenPrice
    }
  }
`

export const GLOBAL_TXNS_TRADEGEN = gql`
  query GlobalTransactionsTradegen {
    transactions(first: 20, orderBy: timestamp, orderDirection: desc) {
      createListing {
        id
        timestamp
        seller
        assetAddress
        tokenClass
        numberOfTokens
        tokenPrice
      }
      purchase {
        id
        timestamp
        buyer
        assetAddress
        tokenClass
        numberOfTokens
        tokenPrice
      }
    }
  }
`

export const NFT_POOL_SEARCH = gql`
  query NFTPoolSearch($value: String, $id: ID) {
    asName: nftpools(where: { name_contains: $value }, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      name
      totalValueLockedUSD
    }
    asAddress: nftpools(where: { id: $id }, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id
      name
      totalValueLockedUSD
    }
  }
`

export const ALL_NFT_POOLS = gql`
  query AllNFTPools($skip: Int!) {
    nftpools(first: 500, skip: $skip) {
      id
      name
      totalValueLockedUSD
    }
  }
`

export const ALL_LISTINGS = gql`
  query AllListings($skip: Int!) {
    listings(first: 500, skip: $skip) {
      id
      lastUpdated
      assetAddress
      tokenClass
      tokenPrice
      numberOfTokens
      seller {
        id
      }
    }
  }
`

export const USER_TRANSACTIONS_TRADEGEN = gql`
  query UserTransactionsTradegen($user: String) {
    createListings(first: 20, where: { seller: $user }, orderBy: timestamp, orderDirection: desc) {
      id
      timestamp
      seller
      assetAddress
      tokenClass
      numberOfTokens
      tokenPrice
    }
    purchases(first: 20, where: { buyer: $user }, orderBy: timestamp, orderDirection: desc) {
      id
      timestamp
      buyer
      assetAddress
      tokenClass
      numberOfTokens
      tokenPrice
    }
  }
`

export const USER_LISTINGS_TRADEGEN = gql`
  query UserListings($user: String!) {
    listings(where: { seller: $user }) {
      exists
      seller {
        id
      }
      assetAddress
      tokenClass
      numberOfTokens
      tokenPrice
    }
  }
`

export const RECENT_LISTINGS = gql`
  query RecentListings {
    listings(first: 50, orderBy: lastUpdated, orderDirection: desc) {
        id
        exists
        lastUpdated
        seller {
          id
        }
        assetAddress
        tokenClass
        numberOfTokens
        tokenPrice
    }
  }
`