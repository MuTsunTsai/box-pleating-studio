<template>
	<div>
		<button id="note" class="btn btn-light text-warning" v-on:click="note">
			<i class="fas fa-exclamation-triangle h1"></i>
		</button>
		<div class="modal fade" ref="mdl">
			<div class="modal-dialog modal-dialog-centered">
				<div class="modal-content">
					<div class="modal-body" v-t="'message.patternNotFound'"></div>
					<div class="modal-footer">
						<button type="button" class="btn btn-primary" data-bs-dismiss="modal" v-t="'keyword.ok'"></button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import * as bootstrap from 'bootstrap';

	import { Component, Vue } from 'vue-property-decorator';


	@Component
	export default class Note extends Vue {
		private modal: bootstrap.Modal;

		mounted(): void {
			libReady.then(() =>
				this.modal = new bootstrap.Modal(this.$refs.mdl as HTMLElement)
			);
		}

		private async note(): Promise<void> {
			await libReady;
			this.modal.show();
			let bt = this.$el.querySelector("[data-bs-dismiss]") as HTMLButtonElement;
			this.$el.addEventListener('shown.bs.modal', () => bt.focus(), { once: true });
			gtag('event', 'screen_view', { screen_name: 'Note' });
		}
	}
</script>
