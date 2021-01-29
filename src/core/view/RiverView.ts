
@shrewd class RiverView extends ControlView<River> {

	private _hinge: paper.CompoundPath;
	private _shade: paper.CompoundPath;
	private _ridge: paper.CompoundPath;

	/** 目前這條河的閉包邊界；用於下一條河的扣除 */
	public boundary: paper.CompoundPath;

	constructor(river: River) {
		super(river);

		this.$addItem(Layer.shade, this._shade = new paper.CompoundPath(Style.shade));
		this.$addItem(Layer.hinge, this._hinge = new paper.CompoundPath(Style.hinge));
		this.$addItem(Layer.ridge, this._ridge = new paper.CompoundPath(Style.ridge));

		this.boundary = new paper.CompoundPath({});
	}

	public contains(point: paper.Point) {
		return this.control.sheet.view.contains(point) && this._shade.contains(point);
	}

	/** 跟當前的河有關的基本資訊；這些除非樹的結構有改變，不然不用重新計算 */
	@shrewd public get info(): RiverInfo {
		if(this.disposed) return { adjacent: [], length: 0, components: [] };

		let edge = this.control.edge;
		let a: readonly TreeEdge[];
		let c: readonly string[];

		if(edge.wrapSide == 0) {
			c = this.toComponents(edge.l1, edge.n1).concat(this.toComponents(edge.l2, edge.n2));
			a = edge.a1.concat(edge.a2);
		} else if(edge.wrapSide == 2) {
			c = this.toComponents(edge.l2, edge.n2); a = edge.a2;
		} else {
			c = this.toComponents(edge.l1, edge.n1); a = edge.a1;
		}

		return { adjacent: a, length: edge.length, components: c };
	}

	private toComponents(l: readonly TreeNode[], n: TreeNode): string[] {
		return l.map(l => l.id + "," + n.id);
	}

	public get design(): Design {
		return this.control.sheet.design;
	}

	/** 建立一系列監視元件 */
	private readonly components = new Mapping(
		() => this.info.components,
		key => new RiverComponent(this, key)
	);

	protected onDispose() {
		Shrewd.terminate(this.components);
		super.onDispose();
	}

	/** 計算當前河的閉包 */
	@segment("closure") private get closure(): PolyBool.Segments {
		this.disposeEvent();
		return PolyBool.union([...this.components.values()].map(c => c.contour));
	}

	@segment("interior") private get interior(): PolyBool.Segments {
		this.disposeEvent();
		let segments: PolyBool.Segments[] = [];
		let design = this.control.sheet.design;
		for(let e of this.info.adjacent) {
			if(e.isRiver) {
				let r = design.rivers.get(e)!;
				segments.push(r.view.closure);
			} else {
				let f = design.flaps.get(e.n1.degree == 1 ? e.n1 : e.n2)!;
				segments.push(f.view.hingeSegments);
			}
		}
		return PolyBool.union(segments);
	}

	@shrewd private get closurePath(): paper.CompoundPath {
		return new paper.CompoundPath({
			children: PaperUtil.fromSegments(this.closure)
		});
	}

	/** 扣除掉內部的河的閉包，得到當前河的正確路徑；其中外側會以逆時鐘定向、內側以順時鐘定向 */
	@shrewd private get actualPath(): paper.CompoundPath {
		this.disposeEvent();
		let closure = this.closurePath.children;
		let interior = PaperUtil.fromSegments(this.interior);
		let actual = new paper.CompoundPath({
			children: closure.concat(interior).map(p => p.clone())
		})
		actual.reorient(false, true);
		return actual;
	}

	private _rendered = false;
	protected render() {
		PaperUtil.replaceContent(this.boundary, this.closurePath, false);
		PaperUtil.replaceContent(this._shade, this.actualPath, false);
		PaperUtil.replaceContent(this._hinge, this.actualPath, false);
		this._rendered = true;
	}

	/** 收集所有自身的內直角資訊；這部份與 openAnchors 無關，分開計算以增加效能 */
	@shrewd private get corners(): [Point, Point, boolean][] {
		this.disposeEvent();

		// paper.js 的 Point 類別可能會有計算偏差，因此這邊都轉換成有理數型物件
		let path = this.actualPath;
		let p_paths = (path.children ?? [path]) as paper.Path[];
		let r_paths = p_paths.map(path => path.segments.map(p => new Point(p.point)));
		if(r_paths[0].length == 0) return [];

		let { paths, map } = PathUtil.collect(r_paths);

		// 整理所有的內直角
		let result: [Point, Point, boolean][] = [];
		for(let p of paths) {
			let l = p.length;
			let prev = p[l - 1];
			let now = p[0];
			let v_in = now.sub(prev);
			for(let i = 0; i < l; i++) {
				let next = p[(i + 1) % l];
				let v_out = next.sub(now);
				if(v_in.dot(v_out) == 0 && v_in.rotate90().dot(v_out) > 0) { // 如果走了左轉
					let v = new Vector(
						Math.sign(v_out.x) - Math.sign(v_in.x),
						Math.sign(v_out.y) - Math.sign(v_in.y)
					).scale(this.control.length);
					let target = now.add(v);
					result.push([now, target, map.has(target.toString())]);
				}
				prev = now;
				now = next;
				v_in = v_out;
			}
		}
		return result;
	}

	@shrewd private renderRidge() {
		// 建立相依性
		let oa = this.control.sheet.design.openAnchors;

		// 如果同一回合裡面 draw() 沒有真的被執行（即沒有發生形狀的改變），那就跳過後面的動作
		this.draw();
		if(!this._rendered) return;
		this._rendered = false;

		this._ridge.removeChildren();

		for(let [from, to, self] of this.corners) {
			// 優先尋找 Pattern 的開放角落
			let line = new Line(from, to);
			let f = line.slope.value, key = f + "," + (from.x - f * from.y);
			let arr = oa.get(key) ?? [];
			let p = arr.find(p => line.contains(p, true));

			if(p) PaperUtil.addLine(this._ridge, from, p);
			else if(self) {
				// 如果結果也是自己的一個角就直接連線
				PaperUtil.addLine(this._ridge, from, to);
			}
		}
	}

	protected renderSelection(selected: boolean) {
		this._shade.visible = selected;
	}
}

interface RiverInfo {
	readonly adjacent: readonly TreeEdge[];
	readonly length: number;
	readonly components: readonly string[];
}
