<template>
	<div>
		<h5 v-t="'panel.vertices.type'" class="panel-title"></h5>
		<div v-if="subject.some(s=>s.degree==1)">
			<button class="btn btn-primary" v-if="!bp.isMinimal(design)" @click="bp.delete(subject)" v-t="'keyword.delete'"></button>
			<span v-else v-t="'message.min3vertex'"></span>
		</div>
		<div class="mt-3">
			<button class="btn btn-primary" @click="bp.goToDual(selections)" v-t="'panel.vertices.goto'"></button>
		</div>
	</div>
</template>

<script lang="ts">
	import { Component } from 'vue-property-decorator';

	import BP from '../import/BPStudio';
	import BaseComponent from '../mixins/baseComponent';

	@Component
	export default class Vertices extends BaseComponent {
		protected get subject(): BP.Vertex[] { return this.selections as BP.Vertex[]; }
	}
</script>
