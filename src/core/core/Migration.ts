
//////////////////////////////////////////////////////////////////
/**
 * `Migration` 負責處理不同版本的檔案格式的遷移，以求向下相容。
 */
//////////////////////////////////////////////////////////////////

namespace Migration {

	export const current: string = "rc1";

	export function process(design: any, onDeprecated?: (title: string) => void): JDesign {
		let deprecate = false;

		// beta 版把原本的 cp 模式改名為 layout 模式，以預留 cp 模式給未來使用
		// 同時從 beta 版開始加上檔案版本代碼
		if(!('version' in design)) {
			if(design.mode == "cp") design.mode = "layout";
			design.layout = design.cp;
			delete design.cp;
			design.version = "beta";
			delete design.layout.stretches;
			deprecate = true;
		}

		// 從 rc0 版本開始要求 intersection 都必須加上 e
		if(design.version == "beta") {
			design.version = "rc0";
			let st = design.layout.stretches as JStretch[];
			if(st) for(let s of st.concat()) {
				let cf: any = s.configuration;
				if(cf && (!cf.overlaps || cf.overlaps.some((o: any) =>
					o.c.some((c: any) => c.type == CornerType.intersection && c.e === undefined)
				))) {
					st.splice(st.indexOf(s), 1);
					deprecate = true;
				}
			}
		}

		// rc1 版本中在資料結構上插入了 partition 和 device 的層次
		if(design.version == "rc0") {
			design.version = "rc1";
			let st = design.layout.stretches;
			if(st) for(let s of st.concat()) {
				let cf = s.configuration;
				if(cf) {
					s.configuration = {
						partitions: toPartition(s.configuration.overlaps, s.configuration.strategy)
					};
					let pt = s.pattern;
					if(pt) {
						// rc0 版本產生出來的 pattern 只有兩種可能：單一 Device，
						// 或是多個 Device 各自只有一個 Gadget
						if(s.configuration.partitions.length == 1) {
							s.pattern = {
								devices: [{
									gadgets: s.pattern.gadgets,
									offset: s.pattern.offsets?.[0]
								}]
							};
						} else {
							s.pattern = {
								devices: s.pattern.gadgets.map((g: any, i: number) => ({
									gadgets: [g],
									offset: s.pattern.offsets?.[i]
								}))
							};
						}
					}
				}
			}
		}

		if(deprecate && onDeprecated) onDeprecated(design.title);

		return design;
	}

	function toPartition(overlaps: JOverlap[], strategy?: Strategy): JPartition[] {
		let partitions: JOverlap[][] = [];
		let partitionMap = new Map<number, number>();
		for(let [i, o] of overlaps.entries()) {
			// 如果當前的這個已經被加入過了就跳過
			if(partitionMap.has(i)) continue;

			// 找出所有重合的錨點
			let coin = o.c.filter(c => c.type == CornerType.coincide);

			let c = coin.find(c => partitionMap.has(-c.e! - 1));
			let j = partitions.length;

			if(c) {
				// 如果重合的之中有任何一個已經被加入過了，就把自己加入同一個分組
				let j = partitionMap.get(-c.e! - 1)!;
				partitionMap.set(i, j);
				partitions[j].push(o);
			} else {
				// 否則自己成為一個新分組的第一個成員
				partitionMap.set(i, j);
				partitions.push([o]);
			}

			// 把重合的之中所有還沒被加入的也加入到自己的分組之中
			coin.forEach(c => {
				i = -c.e! - 1;
				if(!partitionMap.has(i)) {
					partitionMap.set(i, j);
					partitions[j].push(overlaps[i]);
				}
			});
		}
		return partitions.map<JPartition>(p => ({ overlaps: p, strategy }));
	}
}
