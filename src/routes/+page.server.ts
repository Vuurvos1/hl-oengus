// import { schedule } from '$lib/schedule.js';
import type { Run } from '$lib/types';
import { error } from '@sveltejs/kit';

export async function load({ fetch }) {
	try {
		// return schedule as never as { id: number; lines: Run[] };

		const res = await fetch(`https://oengus.io/api/v1/marathons/sourceruns/schedule`);
		return (await res.json()) as { id: number; lines: Run[] };
	} catch (err) {
		console.error(err);
		error(404, 'Not found');
	}
}
