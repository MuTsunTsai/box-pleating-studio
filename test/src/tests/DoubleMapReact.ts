
function DoubleMapReact() {

	@shrewd class A {
		public map: DoubleMap<string, number> = new DoubleMap();

		@shrewd private has() {
			log.add("has");
			this.map.has("a");
		}
	}

	let log = new Set<string>();
	function getLog() {
		let result = [...log].sort().join(",");
		log.clear();
		return result;
	}

	let a = new A(), s: string;
	console.assert((s = getLog()) == "has", s);

	a.map.set("a", "b", 12);
	Shrewd.commit();

	console.assert((s = getLog()) == "has", s);
}
