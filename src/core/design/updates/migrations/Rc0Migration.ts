
/** 從 rc0 版本開始要求 {@link JIntersection} 都必須加上 e */
namespace Rc0Migration {

	export function $process(design: Pseudo<JDesign>): boolean {
		let st = design.layout?.stretches as Pseudo<JStretch>[];
		if(st) {
			for(let s of st.concat()) {
				let cf = s.configuration as Pseudo<JConfiguration>;
				if(cf && (!cf.overlaps || (cf.overlaps as JOverlap[]).some(overlapFilter))) {
					st.splice(st.indexOf(s), 1);
					return true;
				}
			}
		}
		return false;
	}

	function overlapFilter(o: JOverlap): boolean {
		return o.c.some(
			(c: JCorner) => c.type == CornerType.$intersection && c.e === undefined
		);
	}
}
