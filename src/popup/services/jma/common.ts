import { TrafficTracker } from "../../ui/traffic-tracker.ts";

export type AreaOperator = {
	url: string;
	data: any;
	load: () => Promise<any>;
	getData: () => Promise<any>;
};

export const createAreaOperator = (): AreaOperator => ({
	url: "https://www.jma.go.jp/bosai/common/const/area.json",
	data: null,
	async load (){ return this.data = await fetch(this.url).then(res => res.json()); },
	async getData (){
		if (this.data === null) await this.load();
		return this.data;
	}
});

export const zen2han = (stdin: string) => {
	return stdin.replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
};

export const translateMaxHeight = (tsunamiHeight: string, condition: string, about?: boolean): { jp: string; en: string } => {
	const condList = condition.trim().split(/\s+/g);
	let maxHeightJP = "";
	let maxHeightEN = "";
	if (tsunamiHeight){
		const maxHtemp = tsunamiHeight.replace("+", "").replace("<", "").replace(">", "").replace("≧", "");
		maxHeightJP = maxHtemp + "m";
		maxHeightEN = maxHtemp + " meter(s)";
		if (tsunamiHeight.includes("<")){
			maxHeightJP = maxHeightJP + "未満";
			maxHeightEN = "Under " + maxHeightEN;
		} else if (tsunamiHeight.includes(">")){
			maxHeightJP = maxHeightJP + "超";
			maxHeightEN = "Over " + maxHeightEN;
		} else if (tsunamiHeight.includes("≧")){
			maxHeightJP = maxHeightJP + "以上";
			maxHeightEN = maxHeightEN + " or higher";
		} else {
			if (tsunamiHeight.includes("+")){
				maxHeightJP = maxHeightJP + "（上昇中）";
				maxHeightEN = maxHeightEN + " (rising)";
			}
			maxHeightEN = (about ? "About " : "") + maxHeightEN;
		}
		if (condList.includes("欠測")){
			maxHeightJP += " （欠測）";
			maxHeightEN += " (Data Failure)";
		}
	} else {
		if (condList.includes("微弱")){
			maxHeightJP = "微弱";
			maxHeightEN = "A weak level";
		}
		if (condList.includes("高い")){
			maxHeightJP = "高い";
			maxHeightEN = "A high level";
		}
		if (condList.includes("巨大")){
			maxHeightJP = "巨大";
			maxHeightEN = "A huge level";
		}
		if (condList.includes("観測中")){
			maxHeightJP = "観測中";
			maxHeightEN = "Reached Already";
		}
		if (condList.includes("推定中")){
			maxHeightJP = "推定中";
			maxHeightEN = "Estimated";
		}
		if (condList.includes("欠測")){
			maxHeightJP = "欠測";
			maxHeightEN = "Data Failure";
		}
	}
	return {
		jp: maxHeightJP,
		en: maxHeightEN
	};
};

export const AdditionalComments: Record<string, { jp: string; en: string }> = {
	"0101": { jp: "今後若干の海面変動があるかもしれません。", en: "There may be slight sea-level changes in the future." },
	"0102": { jp: "今後若干の海面変動があるかもしれませんが、被害の心配はありません。", en: "There may be slight sea-level changes in the future, but there is no concern for damage." },
	"0103": { jp: "今後もしばらく海面変動が続くと思われます。", en: "Sea-level changes are expected to continue for a while." },
	"0104": { jp: "今後もしばらく海面変動が続くと思われますので、海水浴や磯釣り等を行う際は注意してください。", en: "Sea-level changes are expected to continue, so please use caution when engaging in activities such as swimming or fishing." },
	"0105": { jp: "今後もしばらく海面変動が続くと思われますので、磯釣り等を行う際は注意してください。", en: "Sea-level changes are expected to continue, so please use caution when engaging in activities such as fishing." },
	"0107": { jp: "現在、大津波警報・津波警報・津波注意報を発表している沿岸はありません。", en: "There are currently no coastal areas under a major tsunami warning, tsunami warning, or tsunami advisory." },
	"0109": { jp: "津波と満潮が重なると、津波はより高くなりますので一層厳重な警戒が必要です。", en: "When tsunamis coincide with high tides, they can be higher, so extra caution is needed." },
	"0110": { jp: "津波と満潮が重なると、津波はより高くなりますので十分な注意が必要です。", en: "When tsunamis coincide with high tides, they can be even higher, so please take extra precautions." },
	"0111": { jp: "場所によっては、観測した津波の高さよりさらに大きな津波が到達しているおそれがあります。", en: "In some locations, there is a possibility of larger tsunamis reaching than those observed." },
	"0112": { jp: "今後、津波の高さは更に高くなることも考えられます。", en: "Tsunami heights may continue to increase in the future." },
	"0113": { jp: "沖合での観測値をもとに津波が推定されている沿岸では、早いところでは、既に津波が到達していると推定されます。", en: "In coastal areas where tsunamis are estimated based on offshore measurements, it is estimated that tsunamis have already arrived in some places." },
	"0114": { jp: "津波による潮位変化が観測されてから最大波が観測されるまでに数時間以上かかることがあります。", en: "It may take several hours or longer from the observation of tidal changes due to tsunamis to the observation of maximum waves." },
	"0115": { jp: "沖合での観測値であり、沿岸では津波はさらに高くなります。", en: "These are offshore observations, and tsunamis will be even higher along the coast." },
	"0121": { jp: "＜大津波警報＞ 大きな津波が襲い甚大な被害が発生します。沿岸部や川沿いにいる人はただちに高台や避難ビルなど安全な場所へ避難してください。津波は繰り返し襲ってきます。警報が解除されるまで安全な場所から離れないでください。", en: "[MAJOR TSUNAMI WARNING] A destructive tsunami will strike and cause widespread damage. People in coastal areas and along rivers must evacuate immediately to higher ground or safe buildings. Tsunamis will hit repeatedly, so do not leave safe areas until the warning is lifted." },
	"0122": { jp: "＜津波警報＞ 津波による被害が発生します。沿岸部や川沿いにいる人はただちに高台や避難ビルなど安全な場所へ避難してください。津波は繰り返し襲ってきます。警報が解除されるまで安全な場所から離れないでください。", en: "[Tsunami Warning] Tsunami damage is expected. People in coastal areas and along rivers should evacuate immediately to higher ground or safe buildings. Tsunamis will strike repeatedly, so not leave safe areas until the warning is lifted." },
	"0123": { jp: "＜津波注意報＞ 海の中や海岸付近は危険です。海の中にいる人はただちに海から上がって、海岸から離れてください。潮の流れが速い状態が続きますので、注意報が解除されるまで海に入ったり海岸に近づいたりしないようにしてください。", en: "[Tsunami Advisory] The sea and coastal areas are dangerous. People in the water should get out of the water immediately and stay away from the coast. Strong currents persist, so do not enter the sea or approach the coast until the advisory is lifted." },
	"0124": { jp: "＜津波予報（若干の海面変動）＞ 若干の海面変動が予想されますが、被害の心配はありません。", en: "[Tsunami Forecast] Slight sea-level changes in sea are expected, but there is no concern for damage." },
	"0131": { jp: "警報が発表された沿岸部や川沿いにいる人はただちに高台や避難ビルなど安全な場所へ避難してください。到達予想時刻は、予報区のなかで最も早く津波が到達する時刻です。場所によっては、この時刻よりもかなり遅れて津波が襲ってくることがあります。到達予想時刻から津波が最も高くなるまでに数時間以上かかることがありますので、観測された津波の高さにかかわらず、警報が解除されるまで安全な場所から離れないでください。", en: "People in coastal areas and along rivers where warnings have been issued should immediately evacuate to higher ground or safe buildings. The estimated time of arrival reflects the earliest point where tsunamis can hit the forecast area. In some locations, tsunamis may arrive much later than estimated. It can take a few hours or more from the estimated arrival time for tsunamis to reach their maximum height, so do not leave safe areas until the warning is lifted, regardless of observed tsunami heights." },
	"0132": { jp: "場所によっては津波の高さが「予想される津波の高さ」より高くなる可能性があります。", en: "Tsunamis may exceed the expected height in some areas." },
	"0141": { jp: "東日本大震災クラスの津波が来襲します。", en: "A tsunami of the scale of the Great East Japan Earthquake is approaching." },
	"0142": { jp: "沖合で高い津波を観測したため大津波警報・津波警報に切り替えました。", en: "Tsunami warnings have been upgraded due to high tsunamis observed offshore." },
	"0143": { jp: "沖合で高い津波を観測したため大津波警報・津波警報を切り替えました。", en: "Tsunami warnings have been switched due to high tsunamis observed offshore." },
	"0144": { jp: "沖合で高い津波を観測したため大津波警報に切り替えました。", en: "Tsunami warnings have been upgraded to major tsunami warnings due to huge tsunamis observed offshore." },
	"0145": { jp: "沖合で高い津波を観測したため大津波警報を切り替えました。", en: "Major tsunami warnings have been switched due to high tsunamis observed offshore." },
	"0146": { jp: "沖合で高い津波を観測したため津波警報に切り替えました。", en: "Tsunami warnings have been upgraded to tsunami warnings due to high tsunamis observed offshore." },
	"0147": { jp: "沖合で高い津波を観測したため津波警報を切り替えました。", en: "Tsunami warnings have been switched due to high tsunamis observed offshore." },
	"0148": { jp: "沖合で高い津波を観測したため予想される津波の高さを切り替えました。", en: "Tsunami height forecasts have been revised due to high tsunamis observed offshore." },
	"0149": { jp: "ただちに避難してください。", en: "EVACUATE IMMEDIATELY" },
	"0150": { jp: "南海トラフ地震臨時情報を発表しています。", en: "Currently, Nankai Trough Earthquake Extra Information has been issued." },
	"0201": { jp: "強い揺れに警戒してください。", en: "Use caution for strong shaking." },
	"0211": { jp: "津波警報等（大津波警報・津波警報あるいは津波注意報）を発表中です。", en: "Tsunami warnings or tsunami advisories are currently in effect." },
	"0212": { jp: "この地震により、日本の沿岸では若干の海面変動があるかもしれませんが、被害の心配はありません。", en: "Due to this earthquake, there may be slight sea-level changes along Japan's coast, but there is no concern for damage." },
	"0213": { jp: "今後もしばらく海面変動が続くと思われますので、海水浴や磯釣り等を行う際は注意してください。", en: "Sea-level changes are expected to continue for a while, so please use caution when engaging in activities such as swimming or fishing." },
	"0214": { jp: "今後もしばらく海面変動が続くと思われますので、磯釣り等を行う際は注意してください。", en: "Sea-level changes are expected to continue for a while, so please use caution when engaging in activities such as fishing." },
	"0215": { jp: "この地震による津波の心配はありません。", en: "There is no concern for tsunamis due to this earthquake." },
	"0216": { jp: "震源が海底の場合、津波が発生するおそれがあります。", en: "If the epicenter is underwater, there is a possibility of a tsunami." },
	"0217": { jp: "今後の情報に注意してください。", en: "Please pay attention to further information." },
	"0221": { jp: "太平洋の広域に津波発生の可能性があります。", en: "There is a possibility of a widespread tsunami in the Pacific Ocean." },
	"0222": { jp: "太平洋で津波発生の可能性があります。", en: "There is a possibility of tsunami generation in the Pacific Ocean." },
	"0223": { jp: "北西太平洋で津波発生の可能性があります。", en: "There is a possibility of tsunami generation in the northwest Pacific Ocean." },
	"0224": { jp: "インド洋の広域に津波発生の可能性があります。", en: "There is a possibility of a widespread tsunami in the Indian Ocean." },
	"0225": { jp: "インド洋で津波発生の可能性があります。", en: "There is a possibility of tsunami generation in the Indian Ocean." },
	"0226": { jp: "震源の近傍で津波発生の可能性があります。", en: "There is a possibility of tsunami generation near the epicenter." },
	"0227": { jp: "震源の近傍で小さな津波発生の可能性がありますが、被害をもたらす津波の心配はありません。", en: "Small tsunamis may occur near the epicenter, but there is no need to worry about any significant or destructive tsunamis." },
	"0228": { jp: "一般的に、この規模の地震が海域の浅い領域で発生すると、津波が発生することがあります。", en: "Generally, earthquakes of this magnitude in shallow sea areas can trigger tsunamis." },
	"0229": { jp: "日本への津波の有無については現在調査中です。", en: "It is currently being investigated whether there are tsunamis in Japan or not." },
	"0230": { jp: "この地震による日本への津波の影響はありません。", en: "This earthquake poses no tsunami risk to Japan." },
	"0241": { jp: "この地震について、緊急地震速報を発表しています。", en: "Earthquake Early Warning has been issued for this earthquake." },
	"0242": { jp: "この地震について、緊急地震速報を発表しています。この地震の最大震度は２でした。", en: "Earthquake Early Warning has been issued for this earthquake. The maximum seismic intensity of this earthquake was 2." },
	"0243": { jp: "この地震について、緊急地震速報を発表しています。この地震の最大震度は１でした。", en: "Earthquake Early Warning has been issued for this earthquake. The maximum seismic intensity of this earthquake was 1." },
	"0244": { jp: "この地震について、緊急地震速報を発表しています。この地震で震度１以上は観測されていません。", en: "Earthquake Early Warning has been issued for this earthquake. No seismic intensity of 1 or higher was observed in this earthquake." },
	"0245": { jp: "この地震で緊急地震速報を発表しましたが、強い揺れは観測されませんでした。", en: "Earthquake Early Warning was issued for this earthquake, but strong shaking was not observed." },
	"0256": { jp: "震源要素を訂正します。", en: "The epicenter information is being corrected." },
	"0262": { jp: "＊印は気象庁以外の震度観測点についての情報です。", en: "The asterisk (*) indicates information about seismic intensity observations from sources other than the Japan Meteorological Agency." },
	"0263": { jp: "＊印は気象庁以外の長周期地震動観測点についての情報です。", en: "The asterisk (*) indicates information about long-period seismic motion observations from sources other than the Japan Meteorological Agency." }
};

export const createTrafficTracker = (viewName: string, visible = true) => new TrafficTracker(viewName, visible);
