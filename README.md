# Go GHA Cache Example

GitHub ActionsでGoのビルドやテストのキャッシュをいい感じに使うために試行錯誤したリポジトリ。

## イケてない例

[イケてない例 by qawatake · Pull Request #4 · qawatake/go-gha-cache-example](https://github.com/qawatake/go-gha-cache-example/pull/4)

素朴なsetup-goを使ったCIの例をPRにして、そのイケてないところをコメントしている。

## 改善例

- .github/workflows/test.yaml, .github/workflows/lint.yaml: [検討](#検討)を既存のactionsで実装した例
  - だいぶ見づらい。
  - 標準のcache/saveがなぜか遅い。
- .github/workflows/test.action.yaml, .github/workflows/lint.action.yaml: [検討](#検討)を自作のactionsで実装した例
  - 見やすくなった。
    - cache keyの生成・利用ロジックを隠蔽できている。
    - post runの仕組みを使うことで、cacheのrestore/saveを1actionにまとめられている。
  - 標準のcache/saveよりなぜか早い。
- .github/workflows/lint.composite.yaml: 自作のactionsをさらにcomposite actionとしてまとめてgo setupをいい感じにラップした例
  - easyにはなってる。
  - build cacheとmod cacheのsaveで条件を一部共有してしまっているので、build cache saveの細かい制御がやりづらくなっている。

## 自作のactions

[検討](#検討)を踏まえて自作のcache用actionsを作成した。

- depcache: ライブラリの依存関係をキャッシュすることに特化したactions
  - 毎回restoreは行う。
  - cache saveはcache hitしなかった && `skip-cache-save`がfalseのときのみ行う。
  - cache keyにはdependency pathを使う。
  - cache keyにはgithub.workflowとgithub.jobを使うため、名前が被ったりしなければ他のworkflowとcacheを共有しない。
- runcache: ビルドやテストの結果をキャッシュすることに特化したactions
  - 毎回restoreは行う。
  - cache saveは`skip-cache-save`がfalseのときのみ行う。
  - cache keyにはgithub.workflowとgithub.jobを使うため、名前が被ったりしなければ他のworkflowとcacheを共有しない。
  - cache hitした場合には既存のcacheを削除して作り直す。

なぜか標準の`cache/save`を使うよりもcacheの保存が早いというメリットもある。。

## 検討

- mainへのpushだけcache saveする理由
  - PRごとにcacheは別物になるため容量を圧迫してしまう。容量を超えると自動でcacheが削除されてhitしなくなる。
    - [E2Eテストワークフローを高速化・安定化させる取り組み | ドクセル](https://www.docswell.com/s/r4mimu/ZXYR73-2024-05-16-184345#p13)
  - そもそもmain branchでキャッシュを作れているか？？
    - 作れていないと、どのPRも最初の一回目の実行ではcacheが使えていないかも。
- cache keyをmodとbuildで使い分けている理由
  - modとbuildはcacheの理想的な更新頻度が違うので別々にする。
    - mod: go.modが変わったらcacheを作り直す
      - cache key (mod) について
        - go.sumのhashを使う
        - 完全一致でなくても良いので、restore-keysも設定している。
    - build: できればmain branchに更新が入るたびに作り直したい
      - cache key (build) について
        - 基本はpushのたびとか定期実行をトリガーとしてcacheを作り直すのでファイルのhashとかは使わない。
- cache keyにgithub.workflowやgithub.jobを使う理由
  - cacheが複数のworkflowで共有されるとライフサイクルが追いづらくなるため。
  - またjobによってcacheの内容が大きく異なる場合があるため。
    - 例えば、`go test -race`だけ行うjobと`go build`だけ行うjobがあるとき、cacheの内容は大きく異なるはずだが、同じキーを使ってしまうとcacheが共有されてしまい非効率。
    - 小さいcacheと大きいcacheがあるのに同じkeyを使ってしまうと、運悪く小さいcacheをずっと使い続けるようなことが起こりうる。
  - main branchへのpushでしかcacheをsaveしない運用にすれば、ファイル単位でcacheを切っても作りすぎることはない。
- ビルドキャッシュをdeleteする理由
  - ビルドやテストのcacheは基本的には実行のたびに内容が変わるはずなため。
  - 削除しちゃったほうがcacheの容量の節約にもなるし、分かりやすさも増す気がする。
  - cache keyに2, 3のバリエーションを用意して、restore-keysで対応すれば必ずしも削除しなくていい。
  - [GitHub Actions overwrite cache example repo](https://github.com/azu/github-actions-overwrite-cache-example)
- modのcache/saveにalwaysをつける理由
  - [Always save cache](https://github.com/actions/setup-go/blob/0a12ed9d6a96ab950c8f026ed9f722fe0da7ef32/src/package-managers.ts#L13)
  - 失敗してもcacheは保存したいのでalwaysをつける。
  - ただ、CI通ったあとのmainでしかcache saveしないので別にalwaysをつけなくてもいいかもしれない。
  - buildのcacheはdeleteも走ってしまうので、alwaysではなくsuccessを条件にしている。

## References

- [cache/save action](https://github.com/actions/cache/blob/main/save/README.md)
- [cache/restore action](https://github.com/actions/cache/blob/main/restore/README.md)
- [GitHub Actions overwrite cache example repo](https://github.com/azu/github-actions-overwrite-cache-example)
  - 同じkeyのcacheを上書きする方法の例
- [Caching dependencies to speed up workflows](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
  - cache keyのマッチルールについて
  - キャッシュへのアクセスについての制限（scopeの話）
- [golangci-lint cache](https://golangci-lint.run/usage/configuration/#cache)
  - golangci-lintのcacheについて
- [github actionsのsetup-goのキャッシュは無効にした方がいいかもしれない](https://zenn.dev/goryudyuma/articles/f387dba8838ff7)
  - setup-goは同じcache keyを使い回すので重いjobをcacheできてないかも、という話。
- [E2Eテストワークフローを高速化・安定化させる取り組み](https://www.docswell.com/s/r4mimu/ZXYR73-2024-05-16-184345#p14)
  - main branchでだけcacheをsaveするよ。
