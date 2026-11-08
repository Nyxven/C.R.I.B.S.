// Run: npm run db:seed   (needs DATABASE_URL_UNPOOLED in .env.local; see SETUP_GUIDE.md)
// Loads seed/content.json into Neon. Safe to run again: it updates by id and never deletes.
// It leaves reviewStatus, verifiedAt and source alone once they are set, so expert review is never undone.
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import raw from "../seed/content.json";
import * as schema from "../src/db/schema";
import { buildSeedRows, type SeedFile } from "../src/server/content/seedRows";

try { process.loadEnvFile(".env.local"); } catch { /* no .env.local: use the variables already set */ }

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL_UNPOOLED. Run: vercel env pull .env.local");
  process.exit(1);
}

const db = drizzle(neon(url), { schema });
const rows = buildSeedRows(raw as SeedFile);
const { contentModule, article, faq, professional } = schema;

async function main() {
  await db.insert(contentModule).values(rows.modules).onConflictDoUpdate({
    target: contentModule.id,
    set: { name: sql`excluded.name`, shortName: sql`excluded.short_name`, description: sql`excluded.description`, sortOrder: sql`excluded.sort_order` },
  });
  await db.insert(article).values(rows.articles).onConflictDoUpdate({
    target: article.slug,
    set: { moduleId: sql`excluded.module_id`, title: sql`excluded.title`, readTime: sql`excluded.read_time`, html: sql`excluded.html`, sortOrder: sql`excluded.sort_order`, updatedAt: sql`now()` },
  });
  await db.insert(faq).values(rows.faqs).onConflictDoUpdate({
    target: faq.id,
    set: { question: sql`excluded.question`, answer: sql`excluded.answer`, sortOrder: sql`excluded.sort_order` },
  });
  await db.insert(professional).values(rows.professionals).onConflictDoUpdate({
    target: professional.id,
    set: { name: sql`excluded.name`, role: sql`excluded.role`, location: sql`excluded.location`, note: sql`excluded.note`, sortOrder: sql`excluded.sort_order` },
  });
  console.log(`Seeded ${rows.modules.length} modules, ${rows.articles.length} guides, ${rows.faqs.length} FAQs, ${rows.professionals.length} listings.`);
}

main().catch((e: unknown) => {
  console.error("Seed failed:", e instanceof Error ? e.message : String(e));
  process.exit(1);
});
