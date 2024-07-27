// copied from https://github.com/actions/setup-go/tree/v5.0.2/src
export enum State {
  CachePrimaryKey = 'CACHE_KEY',
  CacheMatchedKey = 'CACHE_RESULT'
}

export enum Outputs {
  CacheHit = 'cache-hit'
}
