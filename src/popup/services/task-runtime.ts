import { TrafficTracker } from "../ui/trafficTracker.ts";

export type QueueKind = "fifo" | "latest-only" | "drop-if-running";

/** ホスト単位のリクエスト頻度制限です。 */
export type RateLimitConfig = {
	/** 直近の実行から次の実行までに空ける最小間隔です（ミリ秒）。 */
	cooldown: number | (() => number);
};

/** createFetchClient に渡すホスト設定です。 */
export type FetchClientConfig = {
	/** TrafficTracker などの表示に使う識別名です。 */
	displayName: string;
	/** 接続先の制限を兼ねるベースURLです。配下以外はエラーになります。 */
	baseUrl?: string;
	/** すべてのリクエストに共通で付与する RequestInit です。 */
	init?: RequestInit | (() => RequestInit);
	/** 既定で非表示にしたい場合に true を指定します。 */
	hidden?: boolean;
	/** poll のトリガーをどう積むかのポリシーです（ホスト単位）。 */
	queue?: QueueKind;
	/** ホスト単位のリクエスト頻度制限です。 */
	rateLimit?: RateLimitConfig;
};

export type ResponseFormat = "text" | "arraybuffer" | "json" | "xml";

/** poll の実行設定です。 */
export type PollOptions = {
	/** 実行間隔です（ミリ秒）。 */
	interval: number;
	/** レスポンスの読み取り形式です。 */
	format: ResponseFormat;
	/** true の場合、HTTP エラーでも例外にしません。 */
	allowNonOk?: boolean;
	/** Request の cache 指定です。 */
	cache?: RequestCache;
	/** poll 単体の RequestInit です。 */
	init?: RequestInit | ((url: string) => RequestInit);
	/** true の場合、開始直後に 1 回実行します。 */
	immediate?: boolean;
};

/** request の実行設定です。 */
export type RequestOptions = {
	/** レスポンスの読み取り形式です。 */
	format: ResponseFormat;
	/** true の場合、HTTP エラーでも例外にしません。 */
	allowNonOk?: boolean;
	/** Request の cache 指定です。 */
	cache?: RequestCache;
	/** request 単体の RequestInit です。 */
	init?: RequestInit | ((url: string) => RequestInit);
};

/** poll が流すイベントです（成功/失敗で型を分ける）。 */
export type PollEvent<T> = PollEventSuccess<T> | PollEventError;

/** poll の成功イベントです。 */
export type PollEventSuccess<T> = {
	/** 取得成功フラグ（例外が発生しなかった場合は true）。 */
	ok: true;
	/** 成功時のデータです。 */
	value: T;
	/** HTTP ステータスコードです。 */
	status: number;
	/** 取得時刻です。 */
	fetchedAt: number;
};

/** poll の失敗イベントです。 */
export type PollEventError = {
	/** 成功フラグ（false）。 */
	ok: false;
	/** 失敗時の例外です。 */
	error: unknown;
	/** HTTP ステータスコード（エラーがある場合）。 */
	status?: number;
};

export type PollStream<T> = AsyncIterable<PollEvent<T>>;

/** poll を操作するハンドルです。 */
export type PollHandle<T> = {
	/** 即時に実行キューへ積みます。 */
	trigger: () => void;
	/** 定期スケジュールを停止します（ストリームは継続）。 */
	stop: () => void;
	/** 停止した上でストリームを完了させます。 */
	finish: () => void;
	/** 実行中のリクエストをキャンセルします。 */
	abort: () => void;
	/** poll が流すイベントストリームです。 */
	stream: PollStream<T>;
};

/** createFetchClient が返す API です。 */
export type FetchClient = {
	/** 指定 interval で実行される poll を作成します。 */
	poll: <T>(pathOrUrl: string, options: PollOptions) => PollHandle<T>;
	/** 1 回だけ実行する request です。 */
	request: <T>(pathOrUrl: string, options: RequestOptions) => Promise<T>;
};

/**
 * FetchClient を生成します。
 *
 * @param _config - ホスト設定です。
 * @returns poll / request を持つクライアントを返します。
 */
export const createFetchClient = (_config: FetchClientConfig): FetchClient => {
	const baseUrl = _config.baseUrl;
	const resolveUrl = (pathOrUrl: string) => resolveClientUrl(baseUrl, pathOrUrl);
	const hostInit = _config.init;
	const queueKind = _config.queue ?? "latest-only";
	const rateLimit = _config.rateLimit;
	const tracker = new TrafficTracker(_config.displayName, !_config.hidden);
	let lastRequestAt = 0;
	let cooldownPromise: Promise<void> | null = null;

	/**
	 * ホストのクールダウン制限を待機します。
	 *
	 * @returns 待機が終わったら解決します。
	 */
	const waitForCooldown = async () => {
		if (!rateLimit) return;
		const cooldown = typeof rateLimit.cooldown === "function"
			? rateLimit.cooldown()
			: rateLimit.cooldown;
		const now = Date.now();
		const waitMs = Math.max(0, cooldown - (now - lastRequestAt));
		if (waitMs === 0) {
			lastRequestAt = now;
			return;
		}
		if (!cooldownPromise) {
			cooldownPromise = delay(waitMs).then(() => {
				lastRequestAt = Date.now();
				cooldownPromise = null;
			});
		}
		await cooldownPromise;
	};

	/**
	 * 1 回の request を実行します。
	 *
	 * @param pathOrUrl - baseUrl を考慮したパスまたは URL です。
	 * @param options - request の実行設定です。
	 * @returns パース済みデータを返します。
	 */
	const performRequest = async <T>(
		pathOrUrl: string,
		options: RequestOptions
	): Promise<T> => {
		const url = resolveUrl(pathOrUrl);
		await waitForCooldown();
		const init = mergeInit(hostInit, options.init, url, options.cache);
		const response = await fetch(url, init);
		tracker.update();
		return parseResponse<T>(response, options.format, options.allowNonOk === true);
	};

	return {
		/**
		 * 指定 interval で実行される poll を作成します。
		 *
		 * @param pathOrUrl - baseUrl を考慮したパスまたは URL です。
		 * @param options - poll の実行設定です。
		 * @returns poll を制御するハンドルを返します。
		 */
		poll: <T>(pathOrUrl: string, options: PollOptions) => {
			const url = resolveUrl(pathOrUrl);
			const stream = createEventStream<PollEvent<T>>();
			let running = true;
			let inFlight = false;
			let timer: ReturnType<typeof setTimeout> | null = null;
			let pendingCount = 0;
			let hasPendingLatest = false;
			let currentAbortController: AbortController | null = null;

			const enqueue = () => {
				switch (queueKind) {
					case "fifo":
						pendingCount += 1;
						break;
					case "drop-if-running":
						if (!inFlight) pendingCount += 1;
						break;
					case "latest-only":
					default:
						hasPendingLatest = true;
						// 古いリクエストをキャンセル
						if (inFlight && currentAbortController) {
							currentAbortController.abort();
						}
						break;
				}
				void drain();
			};

			const drain = async () => {
				if (!running || inFlight) return;
				if (!hasPendingLatest && pendingCount === 0) return;

				if (hasPendingLatest) {
					hasPendingLatest = false;
				} else if (pendingCount > 0) {
					pendingCount -= 1;
				}

				inFlight = true;
				currentAbortController = new AbortController();
				try {
					await waitForCooldown();
					const baseInit = mergeInit(hostInit, options.init, url, options.cache);
					// ユーザーの signal と merge
					const userSignal = (baseInit as any).signal as AbortSignal | undefined;
					const mergedInit: RequestInit = {
						...baseInit,
						signal: mergeAbortSignals(currentAbortController.signal, userSignal)
					};
					const response = await fetch(url, mergedInit);
					tracker.update();
					const data = await parseResponse<T>(response, options.format, options.allowNonOk === true);
					const successEvent: PollEventSuccess<T> = {
						ok: true,
						value: data,
						status: response.status,
						fetchedAt: Date.now()
					};
					stream.push(successEvent);
				} catch (error) {
					if (isAbortError(error)) return;
					const errorEvent: PollEventError = {
						ok: false,
						error,
						...(error instanceof HttpError && { status: error.status })
					};
					stream.push(errorEvent);
				} finally {
					inFlight = false;
					currentAbortController = null;
					if (running) void drain();
				}
			};

			const scheduleNext = () => {
				if (!running) return;
				if (timer) clearTimeout(timer);
				timer = setTimeout(() => {
					timer = null;
					enqueue();
					scheduleNext();
				}, Math.max(0, Math.floor(options.interval)));
			};

			if (options.immediate) enqueue();
			scheduleNext();

			const stop = () => {
				running = false;
				if (timer) clearTimeout(timer);
				timer = null;
				pendingCount = 0;
				hasPendingLatest = false;
				if (currentAbortController) {
					currentAbortController.abort();
					currentAbortController = null;
				}
			};

			const abort = () => {
				if (currentAbortController) {
					currentAbortController.abort();
					currentAbortController = null;
				}
			};

			const finish = () => {
				stop();
				stream.finish();
			};

			return {
				trigger: enqueue,
				stop,
				finish,
				abort,
				stream: stream.stream
			};
		},
		/**
		 * 1 回だけ実行する request です。
		 *
		 * @param pathOrUrl - baseUrl を考慮したパスまたは URL です。
		 * @param options - request の実行設定です。
		 * @returns パース済みデータを返します。
		 */
		request: performRequest
	};
};

/**
 * baseUrl と pathOrUrl を結合し、baseUrl 配下であることを検証して返します。
 *
 * @param baseUrl - 制限対象の baseUrl です。
 * @param pathOrUrl - 解決対象のパスまたは URL です。
 * @returns 解決済みの URL 文字列を返します。
 */
export const resolveClientUrl = (baseUrl: string | undefined, pathOrUrl: string): string => {
	if (!baseUrl) return pathOrUrl;

	const normalizedBase = normalizeBaseUrl(baseUrl);
	const resolved = resolveWithBase(normalizedBase, pathOrUrl);
	assertWithinBaseUrl(normalizedBase, resolved);
	return resolved.toString();
};

/**
 * baseUrl を正規化します。
 *
 * - 末尾に / を必ず付与
 * - search/hash は除去
 *
 * @param baseUrl - 正規化対象の baseUrl です。
 * @returns 正規化済み URL を返します。
 */
const normalizeBaseUrl = (baseUrl: string): URL => {
	const parsed = new URL(baseUrl);
	parsed.hash = "";
	parsed.search = "";
	if (!parsed.pathname.endsWith("/")) {
		parsed.pathname = `${parsed.pathname}/`;
	}
	return parsed;
};

/**
 * baseUrl と pathOrUrl を URL として解決します。
 *
 * @param baseUrl - 正規化済み baseUrl です。
 * @param pathOrUrl - 解決対象のパスまたは URL です。
 * @returns 解決済み URL を返します。
 */
const resolveWithBase = (baseUrl: URL, pathOrUrl: string): URL => {
	try {
		const absolute = new URL(pathOrUrl);
		return absolute;
	} catch {
		return new URL(pathOrUrl, baseUrl);
	}
};

/**
 * 解決された URL が baseUrl 配下にあることを検証します。
 *
 * @param baseUrl - 正規化済み baseUrl です。
 * @param resolved - 解決済み URL です。
 * @throws Origin が一致しない場合や pathname が scope 外の場合
 */
const assertWithinBaseUrl = (baseUrl: URL, resolved: URL): void => {
	if (resolved.origin !== baseUrl.origin) {
		throw new Error(`BaseUrl origin mismatch: expected ${baseUrl.origin}, got ${resolved.origin}`);
	}

	const basePath = baseUrl.pathname.endsWith("/")
		? baseUrl.pathname.slice(0, -1)
		: baseUrl.pathname;
	if (resolved.pathname === basePath) return;
	if (!resolved.pathname.startsWith(baseUrl.pathname)) {
		throw new Error(`BaseUrl path out of scope: ${basePath}/ required, got ${resolved.pathname}`);
	}
};

/**
 * RequestInit を合成します。
 *
 * - host 側の init をベースに、request 側の init で上書き
 * - headers はマージ
 *
 * @param hostInit - ホスト側の RequestInit です。
 * @param requestInit - request 側の RequestInit です。
 * @param url - 解決済み URL です。
 * @param cache - 明示された cache 指定です。
 * @returns 合成済み RequestInit を返します。
 */
const mergeInit = (
	hostInit: RequestInit | (() => RequestInit) | undefined,
	requestInit: RequestInit | ((url: string) => RequestInit) | undefined,
	url: string,
	cache: RequestCache | undefined
): RequestInit => {
	const resolvedHostInit = typeof hostInit === "function" ? hostInit() : hostInit;
	const resolvedRequestInit = typeof requestInit === "function"
		? requestInit(url)
		: requestInit;

	const mergedHeaders = mergeHeaders(resolvedHostInit?.headers, resolvedRequestInit?.headers);
	return {
		...resolvedHostInit,
		...resolvedRequestInit,
		cache: cache ?? resolvedRequestInit?.cache ?? resolvedHostInit?.cache,
		headers: mergedHeaders
	};
};

/**
 * headers をマージします（request 側が優先）。
 *
 * @param baseHeaders - ベースの headers です。
 * @param requestHeaders - request 側の headers です。
 * @returns マージ済み headers を返します。
 */
const mergeHeaders = (
	baseHeaders: HeadersInit | undefined,
	requestHeaders: HeadersInit | undefined
): HeadersInit | undefined => {
	if (!baseHeaders && !requestHeaders) return undefined;
	const merged = new Headers(baseHeaders ?? {});
	if (requestHeaders) {
		new Headers(requestHeaders).forEach((value, key) => {
			merged.set(key, value);
		});
	}
	return merged;
};

/**
 * 2 つの AbortSignal をマージします。
 * いずれかが abort されたら、merged signal に反映されます。
 *
 * @param ownSignal - 内部管理の signal です。
 * @param userSignal - ユーザーが指定した signal です。
 * @returns マージ済み signal を返します。
 */
const mergeAbortSignals = (ownSignal: AbortSignal, userSignal?: AbortSignal): AbortSignal => {
	if (!userSignal) return ownSignal;
	if (userSignal.aborted) return userSignal;
	if (ownSignal.aborted) return ownSignal;

	// AbortController.any() が利用可能な場合はそれを使用
	if (AbortSignal.any) {
		return AbortSignal.any([ownSignal, userSignal]);
	}

	// Fallback: 手動でマージ
	const controller = new AbortController();
	const abort = () => controller.abort();
	ownSignal.addEventListener("abort", abort);
	userSignal.addEventListener("abort", abort);
	return controller.signal;
};

/**
 * Response を format 指定に従ってパースします。
 *
 * @param response - Response オブジェクトです。
 * @param format - 読み取り形式です。
 * @param allowNonOk - true の場合、非 2xx でも例外にしません。
 * @returns パース済みデータを返します。
 * @throws HTTP エラーステータス（4xx/5xx）時に例外をスロー
 */
const parseResponse = async <T>(
	response: Response,
	format: ResponseFormat,
	allowNonOk: boolean
): Promise<T> => {
	if (!response.ok && !allowNonOk) {
		throw new HttpError(response.status, response.statusText);
	}
	switch (format) {
		case "text":
			return (await response.text()) as T;
		case "arraybuffer":
			return (await response.arrayBuffer()) as T;
		case "xml": {
			const text = await response.text();
			try {
				const parser = new DOMParser();
				return parser.parseFromString(text, "application/xml") as T;
			} catch (error) {
				throw new Error(`XML parse error: ${error instanceof Error ? error.message : String(error)}`);
			}
		}
		case "json":
		default:
			return (await response.json()) as T;
	}
};

class HttpError extends Error {
	readonly status: number;
	readonly statusText: string;

	constructor(status: number, statusText: string) {
		super(`HTTP ${status} ${statusText}`);
		this.name = "HttpError";
		this.status = status;
		this.statusText = statusText;
	}
}

const isAbortError = (error: unknown): boolean => {
	if (error instanceof DOMException) return error.name === "AbortError";
	return error instanceof Error && error.name === "AbortError";
};

/**
 * setTimeout を Promise 化します。
 *
 * @param ms - 待機時間（ミリ秒）です。
 * @returns 指定時間後に解決する Promise を返します。
 */
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * AsyncIterable を作るための簡易キューです。
 *
 * @returns stream/push/finish を持つヘルパーを返します。
 */
const createEventStream = <T>() => {
	let closed = false;
	const queue: T[] = [];
	const waiters: Array<(value: IteratorResult<T>) => void> = [];

	const push = (value: T) => {
		if (closed) return;
		const waiter = waiters.shift();
		if (waiter) {
			waiter({ value, done: false });
			return;
		}
		queue.push(value);
	};

	const finish = () => {
		if (closed) return;
		closed = true;
		for (const waiter of waiters.splice(0)) {
			waiter({ value: undefined as never, done: true });
		}
	};

	const stream: AsyncIterable<T> = {
		[Symbol.asyncIterator]: async function* () {
			while (true) {
				if (queue.length > 0) {
					yield queue.shift() as T;
					continue;
				}
				if (closed) return;
				const value = await new Promise<IteratorResult<T>>(resolve => {
					waiters.push(resolve);
				});
				if (value.done) return;
				yield value.value;
			}
		}
	};

	return { stream, push, finish };
};

/**
 * FetchClient の利用例です。
 *
 * @returns 何も返しません。
 */
export const fetchClientExample = (): void => {
	const api = createFetchClient({
		displayName: "Example API",
		baseUrl: "https://api.example.com/",
		init: () => ({
			headers: {
				Authorization: "Bearer <token>"
			}
		}),
		rateLimit: {
			cooldown: 1000
		}
	});

	const polling = api.poll<{ items: string[] }>("/feed", {
		interval: 5000,
		format: "json",
		cache: "no-store",
		immediate: true,
		init: url => ({
			headers: {
				"X-Request-Url": url
			}
		})
	});

	polling.trigger();

	void (async () => {
		for await (const event of polling.stream) {
			if (event.ok) {
				console.log(`Success [${event.status}]:`, event.value);
			} else {
				console.error(`Poll error${event.status ? ` [${event.status}]` : ""}:`, event.error);
			}
		}
	})();

	// 3 秒後にキャンセル
	setTimeout(() => polling.abort(), 3000);

	void api.request<{ id: string }>("/detail/123", {
		format: "json",
		cache: "no-store"
	});
};
