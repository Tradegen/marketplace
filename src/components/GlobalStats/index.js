import React, { useState, useCallback } from 'react'
import { useMedia } from 'react-use'
import styled from 'styled-components'

import { useGlobalData } from '../../contexts/GlobalData'
import { TYPE } from '../../Theme'
import { formattedNum, localNumber } from '../../utils'
import { RowBetween, RowFixed } from '../Row'
import { ButtonTransparent } from '../ButtonStyled'

const Header = styled.div`
  width: 100%;
  position: sticky;
  top: 0;
  background-color: rgb(41, 41, 65);
  border-width: 5px;
  border-radius: 10px;
`

const Medium = styled.span`
  font-weight: 550;
  color: white;
  font-size: 20px;
`

const FirstRow = styled.div`
  width: 100%;
  color: white;
  padding-left: 20px;
  padding-top: 20px;
  display: flex;
`

const FirstRowLeft = styled.div`
  width: 20%;
  font-size: 30px;
`

const FirstRowRight = styled.div`
  width: 75%;
  padding-top: 5px;
  font-size: 18px;
  display: flex;
`

function getData(data, timeframe, field)
{
    if (timeframe == "24h")
    {
      if (field == "sale")
      {
        return localNumber(data.oneDayVolumeTokens);
      }
      else if (field == "volume")
      {
        return localNumber(data.oneDayVolumeUSD);
      }
      else if (field == "transactions")
      {
        return localNumber(data.oneDayTxns);
      }
    }
    else if (timeframe == "7d")
    {
      if (field == "sale")
      {
        return localNumber(data.oneWeekVolumeTokens);
      }
      else if (field == "volume")
      {
        return localNumber(data.oneWeekVolumeUSD);
      }
      else if (field == "transactions")
      {
        return localNumber(data.oneWeekTxns);
      }
    }
    else if (timeframe == "30d")
    {
      if (field == "sale")
      {
        return localNumber(data.oneMonthVolumeTokens);
      }
      else if (field == "volume")
      {
        return localNumber(data.oneMonthVolumeUSD);
      }
      else if (field == "transactions")
      {
        return localNumber(data.oneMonthTxns);
      }
    }
    else if (timeframe == "all")
    {
      if (field == "sale")
      {
        return localNumber(data.allTimeVolumeTokens);
      }
      else if (field == "volume")
      {
        return localNumber(data.allTimeVolumeUSD);
      }
      else if (field == "transactions")
      {
        return localNumber(data.allTimeTxns);
      }
    }

    return "0";
}

export default function GlobalStats() {
  const below1180 = useMedia('(max-width: 1180px)')
  const below1024 = useMedia('(max-width: 1024px)')
  const below400 = useMedia('(max-width: 400px)')
  const below816 = useMedia('(max-width: 816px)')

  const data = useGlobalData()
  const [timeframe, setTimeframe] = useState("24h");

  const handleTimeframeChange = useCallback((newTimeframe) => {
    setTimeframe(newTimeframe);
}, [])

  return (
    <Header>
      <FirstRow>
        <FirstRowLeft>
          Overall Stats
        </FirstRowLeft>
        <FirstRowRight>
          <ButtonTransparent onClick={() => {handleTimeframeChange("24h")}}>
            Last 24h
          </ButtonTransparent>
          <ButtonTransparent onClick={() => {handleTimeframeChange("7d")}}>
            7 days
          </ButtonTransparent>
          <ButtonTransparent onClick={() => {handleTimeframeChange("30d")}}>
            30 days
          </ButtonTransparent>
          <ButtonTransparent onClick={() => {handleTimeframeChange("all")}}>
            All time
          </ButtonTransparent>
        </FirstRowRight>
      </FirstRow>
      <RowBetween style={{ padding: '20px' }}>
        <RowFixed>
          {!below1180 && (
            <TYPE.main mr={'1rem'} color={'rgb(195, 197, 203)'} fontSize={'18px'}>
              Total Sale: <Medium>{getData(data, timeframe, "sale")}</Medium> tokens
            </TYPE.main>
          )}
          {!below1024 && (
            <TYPE.main mr={'1rem'} color={'rgb(195, 197, 203)'} fontSize={'18px'} marginLeft={'15px'}>
              Volume: <Medium>{getData(data, timeframe, "volume")}</Medium> mcUSD
            </TYPE.main>
          )}
          {!below1024 && (
            <TYPE.main mr={'1rem'} color={'rgb(195, 197, 203)'} fontSize={'18px'} marginLeft={'15px'}>
              Txn Count: <Medium>{getData(data, timeframe, "transactions")}</Medium> transactions
            </TYPE.main>
          )}
        </RowFixed>
      </RowBetween>
    </Header>
  )
}
