import { Search } from "lucide-react";

export default function SearchPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-heading font-bold text-foreground mb-8">
        <span className="text-primary">//</span> 全局搜索
      </h1>
      <div className="glass rounded-2xl p-32 text-center">
        <Search className="w-16 h-16 text-primary/30 mx-auto mb-6" />
        <h2 className="text-xl font-heading font-semibold text-foreground mb-3">
          搜索功能构建中
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          资源全文搜索、帖子搜索功能即将上线。
        </p>
      </div>
    </div>
  );
}
