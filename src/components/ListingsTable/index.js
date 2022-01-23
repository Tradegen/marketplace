import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import React, { useEffect, useMemo, useState } from 'react'
import { withRouter } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { TYPE } from '../../Theme'
import { formattedNum, formatTime, formattedPercent } from '../../utils'
import { Divider } from '..'
import { ButtonDark, ButtonLight } from '../ButtonStyled'

dayjs.extend(utc)

const PageButtons = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 2em;
  margin-bottom: 2em;
`

const Arrow = styled.div`
  color: ${({ theme }) => theme.primary1};
  opacity: ${(props) => (props.faded ? 0.3 : 1)};
  padding: 0 20px;
  user-select: none;
  :hover {
    cursor: pointer;
  }
`

const List = styled(Box)`
  -webkit-overflow-scrolling: touch;
`

const DashGrid = styled.div`
  display: grid;
  grid-gap: 1em;
  grid-template-columns: 100px 1fr 1fr;
  grid-template-areas: 'name liq vol';
  padding: 0 1.125rem;

  > * {
    justify-content: flex-end;

    &:first-child {
      justify-content: flex-start;
      text-align: left;
      width: 100px;
    }
  }

  @media screen and (min-width: 680px) {
    display: grid;
    grid-gap: 1em;
    grid-template-columns: 180px 1fr 1fr 1fr;
    grid-template-areas: 'name symbol liq vol ';

    > * {
      justify-content: flex-end;
      width: 100%;

      &:first-child {
        justify-content: flex-start;
      }
    }
  }

  @media screen and (min-width: 1080px) {
    display: grid;
    grid-gap: 0.5em;
    grid-template-columns: 1.5fr 0.6fr 1fr 1fr 1fr 1fr 1fr;
    grid-template-areas: 'name symbol liq vol price change actions';
  }
`

const ListWrapper = styled.div``

const ClickableText = styled(Text)`
  text-align: end;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
  user-select: none;
  color: ${({ theme }) => theme.text1} !important;
  @media screen and (max-width: 640px) {
    font-size: 0.85rem;
  }
`

const DataText = styled(Flex)`
  align-items: center;
  text-align: center;
  color: ${({ theme }) => theme.text1} !important;

  & > * {
    font-size: 14px;
  }

  @media screen and (max-width: 600px) {
    font-size: 12px;
  }
`

// @TODO rework into virtualized list
function ListingsTable({ listings, newTokenPrice, itemMax = 10, useTracked = false }) {
    // page state
    const [page, setPage] = useState(1)
    const [maxPage, setMaxPage] = useState(1)

    const below1080 = useMedia('(max-width: 1080px)')
    const below680 = useMedia('(max-width: 680px)')
    const below600 = useMedia('(max-width: 600px)')

    useEffect(() => {
        setMaxPage(1) // edit this to do modular
        setPage(1)
    }, [listings])

    const formattedListings = useMemo(() => {
        return (
            listings &&
            Object.keys(listings)
                .map((key) => listings[key])
                .filter((listing) => listing.numberOfTokens > 0)
        )
    }, [listings])

    useEffect(() => {
        if (listings && formattedListings) {
            let extraPages = 1
            if (formattedListings.length % itemMax === 0) {
                extraPages = 0
            }
            setMaxPage(Math.floor(formattedListings.length / itemMax) + extraPages)
        }
    }, [listings, formattedListings, itemMax])

    const ListItem = ({ item, index }) => {
        console.log(item)

        let difference = 100 * (Number(item.tokenPrice.toString()) - Number(newTokenPrice.toString())) / Number(newTokenPrice.toString())
        console.log(difference)

        return (
            <DashGrid style={{ height: '48px' }} focus={true}>
                <DataText area="name" fontWeight="500">
                 {item.seller && item.seller.id.slice(0, 6) + '...' + item.seller.id.slice(38, 42)}
                </DataText>
                {!below1080 && (
                    <DataText area="tokenClass">{item.tokenClass.toString()}</DataText>
                )}
                {!below1080 && (
                    <DataText area="price">{formattedNum(item.tokenPrice / 1e18, true)}</DataText>
                )}
                <DataText area="quantity" color="text" fontWeight="500">
                    {item.numberOfTokens.toString()} tokens
                </DataText>
                <DataText area="difference">{formattedPercent(difference)}</DataText>
                <DataText area="time">{formatTime(item.lastUpdated)}</DataText>
                <DataText area="actions" onClick={(e) => {}}>Purchase</DataText>
            </DashGrid>
        )
    }

    return (
        <ListWrapper>
            <DashGrid center={true} style={{ height: 'fit-content', padding: '0 1.125rem 1rem 1.125rem' }}>
                <Flex alignItems="center" justifyContent="flexStart">
                    <ClickableText
                        color="text"
                        area="name"
                        fontWeight="500"
                        onClick={(e) => {
                        }}
                    >
                        Seller
                    </ClickableText>
                </Flex>
                {!below1080 && (
                    <Flex alignItems="center">
                        <ClickableText
                            area="tvl"
                            onClick={(e) => {
                            }}
                        >
                            Token Class
                        </ClickableText>
                    </Flex>
                )}
                {!below1080 && (
                    <Flex alignItems="center">
                        <ClickableText
                            area="fee"
                            onClick={() => {
                            }}
                        >
                            Price
                        </ClickableText>
                    </Flex>
                )}
                <Flex alignItems="center">
                    <ClickableText
                        area="price"
                        onClick={(e) => {
                        }}
                    >
                        Quantity
                    </ClickableText>
                </Flex>
                {!below1080 && (
                    <Flex alignItems="center">
                        <ClickableText
                            area="change"
                            onClick={(e) => {
                            }}
                        >
                            % vs. Mint Price
                        </ClickableText>
                    </Flex>
                )}
                <Flex alignItems="center">
                    <ClickableText
                        area="roi"
                        onClick={(e) => {
                        }}
                    >
                        Time
                    </ClickableText>
                </Flex>
                <Flex alignItems="center">
                    <ClickableText
                        area="roi"
                        onClick={(e) => {
                        }}
                    >
                        Actions
                    </ClickableText>
                </Flex>
            </DashGrid>
            <Divider />
            <List p={0}>
                {listings &&
                    listings.map((item, index) => {
                        return (
                            <div key={index}>
                                <ListItem key={index} index={(page - 1) * itemMax + index + 1} item={item} />
                                <Divider />
                            </div>
                        )
                    })}
            </List>
            {maxPage > 1 && (
                <PageButtons>
                    <div onClick={() => setPage(page === 1 ? page : page - 1)}>
                        <Arrow faded={page === 1 ? true : false}>←</Arrow>
                    </div>
                    <TYPE.body>{'Page ' + page + ' of ' + maxPage}</TYPE.body>
                    <div onClick={() => setPage(page === maxPage ? page : page + 1)}>
                        <Arrow faded={page === maxPage ? true : false}>→</Arrow>
                    </div>
                </PageButtons>
            )}
        </ListWrapper>
    )
}

export default withRouter(ListingsTable)
