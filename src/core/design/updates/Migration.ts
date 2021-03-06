
type PseudoValue<T> =
	T extends (infer U)[] ? PseudoValue<U>[] :
	T extends object ? Pseudo<T> : T;
type OtherKeys<T, V> = Record<Exclude<string, keyof T>, V>;
type PartialPseudo<T> = { [key in keyof T]?: PseudoValue<T[key]> };
type Pseudo<T> = (T | PartialPseudo<T>) & OtherKeys<T, unknown>;

interface IMigration {
	$process(design: Pseudo<JDesign>): boolean;
}

//////////////////////////////////////////////////////////////////
/**
 * {@link Migration} 負責處理不同版本的檔案格式的遷移，以求向下相容。
 */
//////////////////////////////////////////////////////////////////

namespace Migration {

	const migrations: [IMigration, string][] = [];

	export function $add(migration: IMigration, version: string): void {
		migrations.push([migration, version]);
	}

	export function $getCurrentVersion(): string {
		return migrations[migrations.length - 1][1];
	}

	export function $getSample(): JDesign {
		return {
			title: "",
			version: $getCurrentVersion(),
			mode: "layout",
			layout: {
				sheet: { width: 16, height: 16 },
				flaps: [],
				stretches: [],
			},
			tree: {
				sheet: { width: 20, height: 20 },
				nodes: [],
				edges: [],
			},
		};
	}

	export function $process(design: Pseudo<JDesign>, studio: IStudio): JDesign {
		// 判斷移轉的起點
		let i = 0;
		if('version' in design) {
			i = migrations.findIndex(m => m[1] == design.version) + 1;
			if(i == 0) throw new Error("Unrecognized version");
		}

		// 進行移轉
		let deprecate = false;
		while(i < migrations.length) {
			deprecate ||= migrations[i++][0].$process(design);
		}
		design.version = $getCurrentVersion();

		if(deprecate && studio.onDeprecate) studio.onDeprecate(design.title);
		return design as JDesign;
	}
}
