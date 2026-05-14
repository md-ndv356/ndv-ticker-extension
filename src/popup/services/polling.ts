/**
 * 単一のポーリング処理の定義です。
 *
 * `results` は 1 本のストリームとして設計しています。
 * 複数箇所で同時に `for await` すると結果が分配される（ブロードキャストされない）点に注意してください。
 */
export type PollingTaskDefinition<T = unknown> = {
  id: string;
  displayTitle: string;
  url: string | (() => string);
  options?: RequestInit | ((url: string) => RequestInit);
  
  interval: number;
  immediate?: boolean;
  enabled?: boolean | (() => boolean);
  parse?: (response: Response) => Promise<T> | T;
  onError?: (error: unknown) => void;
};

export type PollingResult<T> = {
  data: T;
  fetchedAt: number;
  response: Response;
};

/**
 * 登録されたタスクを操作するハンドルです。
 *
 * 仕様:
 * - `start()` は繰り返し実行を開始します。
 * - `stop()` は繰り返し実行を停止し、`results` の待機中イテレータを完了させます。
 *   - 再開したい場合は `start()` 後に新しいイテレータを作り直してください。
 * - `trigger()` は停止中でも 1 回だけ実行できます（ただし `enabled` が false の場合は実行しません）。
 * - `dispose()` は `stop()` + リソース解放（`results` 完了）です。
 */
export type PollingHandle<T = unknown> = {
  readonly id: string;
  readonly running: boolean;
  readonly results: AsyncIterable<PollingResult<T>>;

  start(immediate?: boolean): void;
  stop(): void;
  trigger(): void;
  dispose(): void;
};

export class PollingService {
  private tasks = new Map<string, InternalTask<any>>();

  register<T>(def: PollingTaskDefinition<T>): PollingHandle<T> {
    if (this.tasks.has(def.id)) {
      throw new Error(`Task already registered: ${def.id}`);
    }

    const task = new InternalTask(def);
    this.tasks.set(def.id, task);
    return task;
  }

  unregister(id: string): void {
    const task = this.tasks.get(id);
    if (!task) return;
    task.dispose();
    this.tasks.delete(id);
  }

  start(id: string, immediate?: boolean): void {
    this.tasks.get(id)?.start(immediate);
  }

  stop(id: string): void {
    this.tasks.get(id)?.stop();
  }

  trigger(id: string): void {
    this.tasks.get(id)?.trigger();
  }
}

class InternalTask<T> implements PollingHandle<T> {
  private isRunning = false;
  private isStopped = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private inFlight = false;
  private waiters: Array<(value: IteratorResult<PollingResult<T>>) => void> = [];
  private queue: PollingResult<T>[] = [];
  private def: PollingTaskDefinition<T>;

  constructor(
    def: PollingTaskDefinition<T>
  ) {
    this.def = def;
  }

  get id() {
    return this.def.id;
  }

  get running (){
    return this.isRunning;
  }

  start(immediate = this.def.immediate ?? false): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isStopped = false;
    this.clearTimer();
    if (immediate) void this.executeCycle();
    else this.scheduleNext();
  }

  stop(): void {
    this.isRunning = false;
    this.isStopped = true;
    this.clearTimer();
    this.queue = [];
    this.flushDone();
  }

  trigger(): void {
    if (this.isRunning) void this.executeCycle();
    else void this.executeOnce();
  }

  dispose(): void {
    this.stop();
  }

  get results(): AsyncIterable<PollingResult<T>> {
    return {
      [Symbol.asyncIterator]: () => this.iterator(),
    };
  }

  private async *iterator(): AsyncGenerator<PollingResult<T>> {
    while (!this.isStopped) {
      const item = await this.nextResult();
      if (!item) return;
      yield item;
    }
  }

  private nextResult(): Promise<PollingResult<T> | null> {
    const queued = this.queue.shift();
    if (queued) return Promise.resolve(queued);

    return new Promise((resolve) => {
      this.waiters.push((res) => {
        resolve(res.done ? null : res.value);
      });
    });
  }

  private pushResult(result: PollingResult<T>) {
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter({ value: result, done: false });
      return;
    }
    this.queue.push(result);
  }

  private flushDone() {
    for (const waiter of this.waiters.splice(0)) {
      waiter({ value: undefined as never, done: true });
    }
  }

  private clearTimer(): void {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = null;
  }

  private scheduleNext(): void {
    if (!this.isRunning) return;
    if (this.inFlight) return;
    if (!this.resolveEnabled()) return;

    const interval = Math.max(0, Math.floor(this.def.interval));
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.executeCycle();
    }, interval);
  }

  private resolveUrl(): string {
    return typeof this.def.url === "function" ? this.def.url() : this.def.url;
  }
  
  private resolveOptions(url: string): RequestInit | undefined {
    return typeof this.def.options === "function" ? this.def.options(url) : this.def.options;
  }

  private resolveEnabled(): boolean {
    const enabled = this.def.enabled;
    return typeof enabled === "function" ? enabled() : enabled ?? true;
  }

  /**
   * 1 回だけ実行します。
   *
   * - スケジューリング（次回予約）は行いません。
   * - `enabled=false` の場合は何もしません。
   */
  private async executeOnce(): Promise<void> {
    if (this.inFlight) return;
    if (!this.resolveEnabled()) return;

    this.inFlight = true;
    this.clearTimer();
    try {
      const url = this.resolveUrl();
      if (!url) throw new Error("URL is empty");
      if (typeof url !== "string") throw new Error("URL must be a string");
      
      const response = await fetch(url, this.resolveOptions(url));
      if (!response.ok) throw new HttpError(response);
      const data = this.def.parse ? await this.def.parse(response) : await response.json();

      this.pushResult({
        data,
        response,
        fetchedAt: Date.now(),
      });
    } catch (error) {
      this.def.onError?.(error);
    } finally {
      this.inFlight = false;
    }
  }

  /**
   * 1 回実行し、動作中であれば次回を予約します。
   *
   * `start()` / タイマーから呼ぶ「ポーリングの1サイクル」です。
   */
  private async executeCycle(): Promise<void> {
    await this.executeOnce();
    if (this.isRunning) this.scheduleNext();
  }
}

class HttpError extends Error {
  readonly response: Response;

  constructor(response: Response) {
    super(`HTTP error: ${response.status} ${response.statusText}`);
    this.name = "HttpError";
    this.response = response;
  }
}
