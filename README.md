# go-github-action-cache-example

- cache/saveにalwaysをつける理由
- cache key (mod) について
- cache key (build) について
- mainへのpushだけcache saveする理由
- delete cache
  - [GitHub Actions overwrite cache example repo](https://github.com/azu/github-actions-overwrite-cache-example)

## References

- [cache/save action](https://github.com/actions/cache/blob/main/save/README.md)
- [cache/restore action](https://github.com/actions/cache/blob/main/restore/README.md)
- [GitHub Actions overwrite cache example repo](https://github.com/azu/github-actions-overwrite-cache-example)
  - 同じkeyのcacheを上書きする方法の例
- [Caching dependencies to speed up workflows](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
  - cache keyのマッチルールについて
- [golangci-lint cache](https://golangci-lint.run/usage/configuration/#cache)
  - golangci-lintのcacheについて
