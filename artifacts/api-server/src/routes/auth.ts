import { Router } from "express";
import { VerifyOwnerBody } from "@workspace/api-zod";

const router = Router();

const OWNER_TOKEN = process.env.OWNER_TOKEN ?? "shourov2024vault";

router.post("/auth/verify", (req, res) => {
  const parsed = VerifyOwnerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  if (parsed.data.password === OWNER_TOKEN) {
    res.json({ success: true, token: OWNER_TOKEN });
  } else {
    res.status(401).json({ success: false, token: null });
  }
});

export default router;
