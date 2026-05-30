import Link from "next/link";
import { MessageSquare, BookOpen, Terminal, BarChart3, Code, Wrench } from "lucide-react";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function BoardIcon({ name }: { name: string }) {
  const map: Record<string, React.ElementType> = {
    BookOpen, Terminal, BarChart3, Code, MessageSquare, Wrench,
  };
  const I = map[name] || MessageSquare;
  return name === "BookOpen" ? <BookOpen className="w-6 h-6 text-primary" /> :
    name === "Terminal" ? <Terminal className="w-6 h-6 text-primary" /> :
    name === "BarChart3" ? <BarChart3 className="w-6 h-6 text-primary" /> :
    name === "Code" ? <Code className="w-6 h-6 text-primary" /> :
    name === "Wrench" ? <Wrench className="w-6 h-6 text-primary" /> :
    <MessageSquare className="w-6 h-6 text-primary" />;
}

export default async function ForumPage() {
  const boards = await db.board.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  const totalPosts = boards.reduce((sum, b) => sum + b._count.posts, 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
          <span className="text-primary">//</span> 技术论坛
        </h1>
        <p className="text-muted-foreground">板块化技术讨论社区</p>
        <div className="flex gap-6 mt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-primary font-mono font-bold">{boards.length}</span> 个板块
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-primary font-mono font-bold">{totalPosts}</span> 个帖子
          </div>
        </div>
      </div>

      {boards.length === 0 ? (
        <div className="glass rounded-2xl p-20 text-center">
          <MessageSquare className="w-12 h-12 text-primary/20 mx-auto mb-4" />
          <h3 className="text-lg font-heading font-semibold text-foreground mb-2">暂无板块</h3>
          <p className="text-sm text-muted-foreground">论坛板块将在数据库初始化后自动创建</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {boards.map((board) => (
            <Link key={board.id} href={`/forum/${board.slug}`}>
              <div className="group relative rounded-xl bg-surface border border-border/40 p-6 h-full hover:border-primary/20 hover:bg-surface-hover transition-all duration-300 overflow-hidden">
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:neon-border transition-all">
                    <BoardIcon name={board.icon || ""} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors truncate">{board.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{board._count.posts} 个帖子</p>
                  </div>
                </div>
                {board.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{board.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
