import { getArticles, softDeleteArticle } from "@/app/actions/articles";
import { revalidatePath } from "next/cache";
import { fmtDate } from "@/lib/format-date";

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const cursor = typeof searchParams.cursor === "string" ? searchParams.cursor : undefined;
  const search = typeof searchParams.search === "string" ? searchParams.search : undefined;

  const { items, nextCursor } = await getArticles({ cursor, limit: 25, search });

  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await softDeleteArticle(id);
    revalidatePath("/admin/articles");
  }

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Manage Articles</h1>
        <form className="flex gap-2">
          <input 
            type="search" 
            name="search"
            defaultValue={search}
            placeholder="Search articles..." 
            className="px-4 py-2 bg-muted rounded-md border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button type="submit" className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium">Search</button>
        </form>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No articles found.
                </td>
              </tr>
            ) : (
              items.map((article) => (
                <tr key={article.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{article.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {article.tags.map(tag => (
                        <span key={tag} className="bg-secondary text-secondary-foreground text-[10px] px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(article.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={handleDelete}>
                      <input type="hidden" name="id" value={article.id} />
                      <button type="submit" className="text-destructive hover:underline text-xs font-medium">Delete</button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
