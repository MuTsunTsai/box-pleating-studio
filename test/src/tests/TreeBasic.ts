function TreeBasic() {

	let t = new Tree();
	t.addEdge(1, 0, 2);
	t.addEdge(0, 2, 1);
	Shrewd.commit();
	let A = t.node.get(1)!, B = t.node.get(2)!, a = t.node.get(0)!;

	console.assert(t.node.size == 3 && A != undefined && B != undefined && a != undefined, t.node);
	console.assert(t.leaf.size == 2 && t.leaf.has(A) && t.leaf.has(B), t.leaf);
	console.assert(a.degree == 2, a);
	console.assert(t.edge.get(a, B)!.length == 1, a);
	console.assert(t.edge.size == 2, t);
	console.assert(t.dist(A, B) == 3, t.path.get(A, B));

	t.addEdge(0, 2, 4); // 故意加入重複的邊看看
	t.addEdge(0, 3, 3);
	let C = t.node.get(3)!;
	Shrewd.commit();
	console.assert(t.node.size == 4 && t.leaf.size == 3);
	console.assert(a.degree == 3, "度數正確", a.degree);
	console.assert(t.edge.get(a, B)!.length == 4, "應該要更新為新的長度");
	console.assert(t.edge.size == 3);
	console.assert(t.dist(A, B) == 6, "AB 長度為 6", t.path.get(A, B));

	UnitTest.consoleHack = true;
	t.addEdge(1, 2, 5); // 加入不合法的邊
	t.addEdge(4, 5, 1); // 加入不合法的邊
	a.dispose();
	Shrewd.commit();
	console.assert(UnitTest.warnings.length == 3);
	console.assert(UnitTest.warnings[0] == "Adding edge (1,2) will cause circuit.");
	console.assert(UnitTest.warnings[1] == "Adding edge (4,5) disconnects the graph.");
	console.assert(UnitTest.warnings[2] == "Node [0] is not a leaf.");

	// 測試刪除點
	let P = t.path.get(A, C)!;
	let E = t.edge.get(C, a)!;
	console.assert(!P.disposed && !E.disposed && !C.disposed);
	C.dispose();
	Shrewd.commit();
	console.assert(C.disposed && P.disposed && E.disposed, "要正確解構", C.disposed, P.disposed, E.disposed);
	console.assert(t.node.size == 3 && t.leaf.size == 2, t);

	t.dispose();
}
