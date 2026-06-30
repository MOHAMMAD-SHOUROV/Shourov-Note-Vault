import { Router } from "express";
import { db, vaultItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateItemBody, DeleteItemParams } from "@workspace/api-zod";

const router = Router();

const OWNER_TOKEN = process.env.OWNER_TOKEN ?? "247898";

router.get("/items", async (req, res) => {
  try {
    const items = await db
      .select()
      .from(vaultItemsTable)
      .orderBy(vaultItemsTable.createdAt);
    res.json(
      items.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        content: item.content,
        color: item.color,
        createdAt: item.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list items");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/items/stats", async (req, res) => {
  try {
    const items = await db.select().from(vaultItemsTable);
    const byType = { link: 0, code: 0, javascript: 0, text: 0 } as Record<string, number>;
    for (const item of items) {
      if (item.type in byType) byType[item.type]++;
    }
    res.json({ total: items.length, byType });
  } catch (err) {
    req.log.error({ err }, "Failed to get stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/items", async (req, res) => {
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const { ownerToken, name, type, content, color } = parsed.data;
  if (ownerToken !== OWNER_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const [item] = await db
      .insert(vaultItemsTable)
      .values({ name, type, content, color })
      .returning();
    res.status(201).json({
      id: item.id,
      name: item.name,
      type: item.type,
      content: item.content,
      color: item.color,
      createdAt: item.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/items/:id", async (req, res) => {
  const parsed = DeleteItemParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const ownerToken = req.headers["x-owner-token"] as string | undefined;
  if (ownerToken !== OWNER_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const deleted = await db
      .delete(vaultItemsTable)
      .where(eq(vaultItemsTable.id, parsed.data.id))
      .returning();
    if (deleted.length === 0) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete item");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
