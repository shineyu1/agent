import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen px-6 py-14 md:px-8 md:py-18">
      <div className="app-panel mx-auto grid max-w-3xl gap-6 rounded-[36px] p-8">
        <p className="app-kicker">Agent Service Layer</p>
        <div className="grid gap-3">
          <h1 className="text-4xl font-semibold leading-tight text-white">
            没有找到这个页面或服务
          </h1>
          <p className="max-w-2xl text-base leading-8 text-[var(--muted)]">
            你访问的链接可能已经失效，或者这项服务当前没有公开展示。你可以先回到服务目录继续浏览，或者从服务商接入入口重新检查接入状态。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/directory"
            className="app-primary-button rounded-full px-5 py-3 text-sm font-semibold no-underline transition hover:translate-y-[-1px]"
          >
            返回服务目录
          </Link>
          <Link
            href="/providers/new"
            className="app-secondary-button rounded-full px-5 py-3 text-sm font-semibold no-underline transition hover:border-[var(--accent)] hover:text-white"
          >
            服务商接入
          </Link>
        </div>
      </div>
    </main>
  );
}
