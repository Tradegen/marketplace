type Bytes = string & { readonly _isBytes?: true }
type GBigInt = string & { readonly _isBigInt?: true }
type BigDecimal = string & {
  readonly _isBigDecimal?: true
}
