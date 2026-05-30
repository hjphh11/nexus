import Link from "next/link";
import {
  FileText, Database, Code, Image, Video, Music, Archive,
  Eye, Download, MessageSquare, Search,
} from "lucide-react";
import { db } from "@/lib/db";

const typeLabels: Record<string, string> = {
  DOCUMENT: "文档", DATASET: "数据集", CODE: "代码", IMAGE: "图片",
  VIDEO: "视频", AUDIO: "音频", ARCHIVE: "压缩包", OTHER: "其他",
};
const typeOptions = ["ALL", "DOCUMENT", "DATASET", "CODE", "IMAGE", "VIDEO", "AUDIO", "OTHER"];

function TypeIcon({ type }: { type: string }) {
  const cls = "w-5 h-5 text-primary";
  switch (type) {
    case "IMAGE": return <Image className={cls} />;
    case "VIDEO": return <Video className={cls} />;
    case "AUDIO": return <Music className={cls} />;
    case "CODE": return <Code className={cls} />;
    case "DATASET": return <Database className={cls} />;
    case "ARCHIVE": return <Archive className={cls} />;
    default: return <FileText className={cls} />;
  }
}

function Filters({ type, sort }: { type: string; sort: string }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0">
      {typeOptions.map((t) => (
        <Link
          key={t}
          href={`/resources?type=${t}&sort=${sort}`}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            type === t ? "bg-primary/15 text-primary border border-primary/20" : "bg-surface border border-border/40 text-muted-foreground hover:text-foreground"
          }`}
        >
          {t === "ALL" ? "全部" : typeLabels[t] || t}
        </Link>
      ))}
    </div>
  );
}

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; type?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const type = params.type || "ALL";
  const sort = params.sort || "newest";
  const page = parseInt(params.page || "1");
  const limit = 12;

  const where: Record<string, unknown> = { status: "published" };
  if (type && type !== "ALL") where.type = type;
  if (search) where.OR = [{ title: { contains: search } }, { description: { contains: search } }, { tags: { contains: search } }];

  const orderBy: Record<string, string> =
    sort === "popular" ? { views: "desc" } : sort === "downloads" ? { downloads: "desc" } : { createdAt: "desc" };

  const [resources, total] = await Promise.all([
    db.resource.findMany({
      where: where as never, orderBy: orderBy as never,
      skip: (page - 1) * limit, take: limit,
      include: { author: { select: { id: true, name: true } }, _count: { select: { comments: true } } },
    }),
    db.resource.count({ where: where as never }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
        <span className="text-primary">//</span> 资源广场
      </h1>
      <p className="text-muted-foreground mb-8">浏览和搜索所有公开资源</p>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <form className="relative flex-1" action="/resources">
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="sort" value={sort} />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input type="text" name="search" defaultValue={search} placeholder="搜索资源..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface border border-border/50 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all" />
        </form>
        <Filters type={type} sort={sort} />
        <div className="flex gap-2 shrink-0">
          {["newest", "popular", "downloads"].map((s) => (
            <Link key={s} href={`/resources?type=${type}&sort=${s}&search=${search}`}
              className={`px-3 py-3 rounded-xl text-xs font-medium transition-all ${
                sort === s ? "bg-primary/15 text-primary border border-primary/20" : "bg-surface border border-border/40 text-muted-foreground hover:text-foreground"
              }`}>
              {s === "newest" ? "最新" : s === "popular" ? "最热" : "下载"}
            </Link>
          ))}
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="glass rounded-2xl p-20 text-center">
          <Database className="w-12 h-12 text-primary/20 mx-auto mb-4" />
          <h3 className="text-lg font-heading font-semibold text-foreground mb-2">暂无资源</h3>
          <p className="text-sm text-muted-foreground mb-6">
            {search ? "没有找到匹配的资源" : "还没有人上传资源"}
          </p>
          {!search && (
            <Link href="/upload" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all text-sm font-medium">
              上传资源
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {resources.map((r) => {
              const tags = JSON.parse(r.tags || "[]") as string[];
              const images = JSON.parse((r as any).images || "[]") as string[];
              return (
                <Link key={r.id} href={`/resources/${r.id}`}>
                  <div className="group relative rounded-xl bg-surface border border-border/40 p-6 h-full hover:border-primary/20 hover:bg-surface-hover transition-all duration-300 overflow-hidden">
                    <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {images.length > 0 && (
                      <div className="relative rounded-lg overflow-hidden mb-4 aspect-video bg-surface-hover border border-border/20">
                        <img src={images[0]} alt={r.title} className="w-full h-full object-cover" />
                        {images.length > 1 && (
                          <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white/80">+{images.length - 1}</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <TypeIcon type={r.type} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {(r as any).driveUrl && (
                          <span className="text-[10px] font-mono text-secondary/60 px-1.5 py-0.5 rounded bg-secondary/5 border border-secondary/10">网盘</span>
                        )}
                        <span className="text-[10px] font-mono text-muted-foreground/60 px-2 py-0.5 rounded bg-surface-hover border border-border/30">
                          {typeLabels[r.type] || r.type}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-heading font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">{r.title}</h3>
                    {r.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{r.description}</p>}

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-primary/5 border border-primary/10 text-primary/70">#{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground mt-auto">
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {r.views}</span>
                      <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {r.downloads}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {r._count.comments}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {Array.from({ length: totalPages }).map((_, i) => (
                <Link key={i} href={`/resources?type=${type}&sort=${sort}&search=${search}&page=${i + 1}`}
                  className={`w-9 h-9 rounded-lg text-xs font-mono transition-all flex items-center justify-center ${
                    page === i + 1 ? "bg-primary/15 text-primary border border-primary/20" : "bg-surface border border-border/40 text-muted-foreground hover:text-foreground"
                  }`}>
                  {i + 1}
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
