export const toBytes = (raw: string): Bytes => raw as Bytes
export const toBigInt = (raw: string): GBigInt => raw as GBigInt
export const toBigDecimal = (raw: string): BigDecimal => raw as BigDecimal

export const toFloat = (bd?: BigDecimal | null): number => (bd ? parseFloat(bd.toString()) : 0)
export const toInt = (bd?: GBigInt | null): number => (bd ? parseInt(bd.toString()) : 0)
