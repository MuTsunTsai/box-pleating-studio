
@shrewd class VertexView extends ControlView<Vertex> {

	private _dot: paper.Path.Circle;
	private _circle: paper.Path.Circle;
	private _label: paper.PointText;
	private _glow: paper.PointText;

	constructor(vertex: Vertex) {
		super(vertex);
		
		let option = Object.assign({}, Style.dot, { radius: 4 });
		this.$addItem(Layer.dot, this._dot = new paper.Path.Circle(option));
		this.$addItem(Layer.label, this._glow = new paper.PointText(Style.glow));
		this.$addItem(Layer.label, this._label = new paper.PointText(Style.label));

		this._circle = new paper.Path.Circle({ radius: 0.4 });
	}

	public contains(point: paper.Point): boolean {
		return this._circle.contains(point) ||
			this._glow.hitTest(point.transform(this._glow.layer.matrix.inverted())) != null;
	}

	protected render(): void {
		let ds = this.control.sheet.displayScale;
		let x = this.control.location.x, y = this.control.location.y;

		this._circle.position.set([x, y]);
		this._dot.position.set([x * ds, -y * ds]);

		let lines = this.control.node.edges.map(e => {
			let edgeView = this.control.sheet.design.edges.get(e)!.view;
			edgeView.draw();
			return edgeView.line;
		});

		this._label.content = this.control.node.name;
		LabelUtil.setLabel(this.control.sheet, this._label, this._glow, { x, y }, this._dot, ...lines);
	}

	protected renderSelection(selected: boolean) {
		this._dot.set(selected ? Style.dotSelected : Style.dot);
	}
}
