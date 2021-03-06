/// <reference path="Migration.ts" />
/// <reference path="migrations/BetaMigration.ts" />
/// <reference path="migrations/Rc0Migration.ts" />
/// <reference path="migrations/Rc1Migration.ts" />
/// <reference path="migrations/TrivialMigration.ts" />

Migration.$add(BetaMigration, "beta");
Migration.$add(Rc0Migration, "rc0");
Migration.$add(Rc1Migration, "rc1");

// 版本 0 與 rc1 完全相同，純粹為了紀念發行而改變號碼
Migration.$add(TrivialMigration, "0");

// 版本 0.4 完全向下相容於版本 0，並不需要作任何修改；所有不同的地方都會自動被忽略
// 差別包括多了 history（不存檔）、棄用 fullscreen、scale 改成 zoom（不存檔）
Migration.$add(TrivialMigration, "0.4");
