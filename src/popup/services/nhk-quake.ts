import { RequestURL } from "../config/request-url.ts";
import { createFetchClient, type PollHandle } from "./task-runtime.ts";

const eiListElement = document.getElementById("eiList") as HTMLDivElement;

let quakeOffsetCount = 0;

type QuakeInfoEntry = {
	event_id: string;
	event_date: string;
	max_shindo: string;
	hypocenter: { name: string };
};

type QuakeListResponse = {
	quake: QuakeInfoEntry[];
};

type NhkQuakePollingDeps = {
	getIntervalMs: () => number;
	refreshView: () => void;
	loadQuakeEvent: (eventId: string) => void;
};

export const setQuakeInfoOffset = (value: number) => {
	quakeOffsetCount = value;
};

export const getQuakeInfoOffset = () => quakeOffsetCount;

const createQuakeListRenderer = (
	deps: NhkQuakePollingDeps,
	handle: PollHandle<QuakeListResponse>
) => {
	let lastListSignature = "";

	return (data: QuakeListResponse) => {
		const selectedIndex = getQuakeInfoOffset();
		const earthquakeIntensityList: Record<string, string> = { "S1": "1", "S2": "2", "S3": "3", "S4": "4", "S5-": "5弱", "S5+": "5強", "S6-": "6弱", "S6+": "6強", "S7": "7", "LS5-": "5弱(推定)", "LS5+": "5強(推定)", "LS6-": "6弱(推定)", "LS6+": "6強(推定)", "LS7": "7(推定)" };
		const earthquakeIntensityColor: Record<string, string> = { "S1": "#f2f2ff", "S2": "#68c8fd", "S3": "#869ffd", "S4": "#fae696", "S5-": "#faf500", "S5+": "#febb6f", "S6-": "#ff2800", "S6+": "#a50021", "S7": "#b40068", "LS5-": "#faf500", "LS5+": "#febb6f", "LS6-": "#ff2800", "LS6+": "#a50021", "LS7": "#b40068" };
		let quakeinfoListHtml = "";
		for (const [index, quake] of data.quake.entries()){
			const eventDate = new Date(quake.event_date);
			quakeinfoListHtml += '<button type="button" data-e=' + index;
			quakeinfoListHtml += ' name="elo' + index + '" id="el' + quake.event_id;
			quakeinfoListHtml += '" style="background-color:';
			quakeinfoListHtml += earthquakeIntensityColor[quake.max_shindo as keyof typeof earthquakeIntensityColor] || "#ffffff";
			quakeinfoListHtml += '; color:#000; ';
			if (index === selectedIndex) quakeinfoListHtml += 'animation: 2s animation_current_quake_view 0s infinite;';
			quakeinfoListHtml += '" class="eiList-button">';
			if (quake.hypocenter.name === "") quakeinfoListHtml += '<span style="color:#fff; background-color:#000 padding:2px;">　';
			quakeinfoListHtml += quake.hypocenter.name === "" ? "震源未確定" : quake.hypocenter.name;
			quakeinfoListHtml += '　最大震度' + earthquakeIntensityList[quake.max_shindo as keyof typeof earthquakeIntensityList];
			quakeinfoListHtml += '　' + eventDate.getDate() + "日" + eventDate.getHours() + "時" + eventDate.getMinutes() + "分頃発生";
			if (quake.hypocenter.name === "") quakeinfoListHtml += "　</span>";
			quakeinfoListHtml += '</button>';
		}

		const listSignature = JSON.stringify(data.quake) + selectedIndex;
		if (lastListSignature === listSignature) return;
		lastListSignature = listSignature;

		const listElement = eiListElement;
		if (!listElement) return;
		listElement.innerHTML = quakeinfoListHtml;
		Array.from(listElement.getElementsByClassName("eiList-button")).forEach(element => {
			element.addEventListener("click", event => {
				const target = event.currentTarget as HTMLElement;
				const itemAttr = target.getAttribute("data-e");
				const itemOffset = itemAttr ? Number(itemAttr) : NaN;
				if (Number.isNaN(itemOffset)) return;
				if (itemOffset !== getQuakeInfoOffset()) {
					setQuakeInfoOffset(itemOffset);
					deps.refreshView();
				}
				handle.trigger();
			});
		});
	};
};

const startResultsConsumer = (
	deps: NhkQuakePollingDeps,
	handle: PollHandle<QuakeListResponse>
) => {
	const renderQuakeList = createQuakeListRenderer(deps, handle);
	void (async () => {
		for await (const event of handle.stream){
			if (!event.ok) {
				console.error("Loading Error (nhkQuakeList)", event.error);
				continue;
			}
			renderQuakeList(event.value);
			const eventId = event.value.quake[getQuakeInfoOffset()]?.event_id;
			if (eventId) deps.loadQuakeEvent(eventId);
		}
	})();
};

/**
 * NHK 地震情報一覧の polling タスクを組み立てます。
 */
export const createNhkQuakePollingService = (deps: NhkQuakePollingDeps) => {
	const client = createFetchClient({
		displayName: "NHK / 地震情報一覧",
		baseUrl: "https://news.web.nhk",
		queue: "latest-only"
	});
	const handle = client.poll<QuakeListResponse>(RequestURL.nhkQuake1 + "&_=" + Date.now(), {
		interval: deps.getIntervalMs(),
		format: "json",
		cache: "no-store",
		immediate: true
	});
	startResultsConsumer(deps, handle);
	return handle;
};