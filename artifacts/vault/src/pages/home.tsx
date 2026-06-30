import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useListItems,
  useCreateItem,
  useDeleteItem,
  useGetItemStats,
  getListItemsQueryKey,
  getGetItemStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useOwner } from "@/hooks/use-owner";
import { OwnerAuth } from "@/components/vault/OwnerAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Link2,
  Code2,
  Zap,
  FileText,
  AppWindow,
  Plus,
  Copy,
  Download,
  Trash2,
  X,
  Database,
} from "lucide-react";
import profilePhoto from "@assets/shourov.jpg";

type ItemType = "link" | "code" | "javascript" | "text" | "app";

const TYPE_CONFIG: Record<
  ItemType,
  { icon: React.ReactNode; label: string; ext: string; color: string }
> = {
  link:       { icon: <Link2 className="w-4 h-4" />,      label: "Link",       ext: ".txt", color: "#00ff88" },
  code:       { icon: <Code2 className="w-4 h-4" />,      label: "Code",       ext: ".txt", color: "#b24bff" },
  javascript: { icon: <Zap className="w-4 h-4" />,        label: "JavaScript", ext: ".js",  color: "#ffe600" },
  text:       { icon: <FileText className="w-4 h-4" />,   label: "Text",       ext: ".txt", color: "#ff3fa4" },
  app:        { icon: <AppWindow className="w-4 h-4" />,  label: "App",        ext: ".txt", color: "#00eaff" },
};

const NEON_COLORS = [
  { label: "Cyan", value: "#00eaff" },
  { label: "Purple", value: "#b24bff" },
  { label: "Pink", value: "#ff3fa4" },
  { label: "Green", value: "#00ff88" },
  { label: "Orange", value: "#ff8c00" },
  { label: "Yellow", value: "#ffe600" },
];

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function detectType(content: string): ItemType {
  const trimmed = content.trim();
  if (!trimmed) return "text";
  const urlPattern = /^(https?:\/\/|ftp:\/\/|www\.)\S+/i;
  if (urlPattern.test(trimmed)) return "link";
  const jsKeywords = /\b(function|const|let|var|class|import|export|return|=>|async|await|new |document\.|window\.|console\.)\b/;
  const jsSymbols = /[{}();].*[{}();]/s;
  if (jsKeywords.test(trimmed) && jsSymbols.test(trimmed)) return "javascript";
  const codePatterns = /^(def |class |#include|package |import |public |private |SELECT |<\?php|<html|<!DOCTYPE)/im;
  if (codePatterns.test(trimmed) || (trimmed.includes("\n") && /^\s{2,}/m.test(trimmed) && trimmed.includes(";"))) return "code";
  return "text";
}

// Floating particle background
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: {
      x: number; y: number; vx: number; vy: number;
      r: number; color: string; alpha: number; pulse: number; pSpeed: number;
    }[] = [];

    const colors = ["#00eaff", "#b24bff", "#ff3fa4", "#00ff88", "#ffe600", "#ff8c00"];

    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 2.2 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.5 + 0.15,
        pulse: Math.random() * Math.PI * 2,
        pSpeed: 0.01 + Math.random() * 0.02,
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connection lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(0,234,255,${0.04 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        p.pulse += p.pSpeed;
        const a = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
        const alphaHex = Math.floor(a * 255).toString(16).padStart(2, "0");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + alphaHex;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
}

// Animated glowing orbs
function GlowOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 600, height: 600,
          background: "radial-gradient(circle, rgba(0,234,255,0.055) 0%, transparent 70%)",
          top: "-15%", left: "-10%",
        }}
        animate={{ x: [0, 80, 0], y: [0, 50, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 500, height: 500,
          background: "radial-gradient(circle, rgba(178,75,255,0.05) 0%, transparent 70%)",
          bottom: "-10%", right: "-10%",
        }}
        animate={{ x: [0, -60, 0], y: [0, -40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 350, height: 350,
          background: "radial-gradient(circle, rgba(255,63,164,0.04) 0%, transparent 70%)",
          top: "40%", left: "50%",
        }}
        animate={{ x: [0, 100, -40, 0], y: [0, -60, 30, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// Animated button with typing cursor
function GlowButton({
  children, onClick, color, disabled, type = "button", fullWidth, testId,
}: {
  children: React.ReactNode; onClick?: () => void; color: string;
  disabled?: boolean; type?: "button" | "submit"; fullWidth?: boolean; testId?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.button
      data-testid={testId}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={`relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-mono text-sm font-bold overflow-hidden ${fullWidth ? "w-full" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      style={{
        background: hexToRgba(color, 0.15),
        border: `1px solid ${hexToRgba(color, hovered ? 0.8 : 0.4)}`,
        color: color,
        boxShadow: hovered
          ? `0 0 20px 4px ${hexToRgba(color, 0.4)}, inset 0 0 10px ${hexToRgba(color, 0.1)}`
          : `0 0 8px 1px ${hexToRgba(color, 0.2)}`,
        transition: "box-shadow 0.25s, border-color 0.25s",
      }}
    >
      <motion.span
        className="absolute inset-0 rounded-lg"
        animate={hovered ? { opacity: [0, 0.08, 0] } : { opacity: 0 }}
        transition={{ duration: 0.6, repeat: hovered ? Infinity : 0 }}
        style={{ background: color }}
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

function VaultCard({
  item, onDelete, isOwner,
}: {
  item: { id: number; name: string; type: string; content: string; color: string; createdAt: string };
  onDelete: (id: number) => void;
  isOwner: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  const config = TYPE_CONFIG[item.type as ItemType] ?? TYPE_CONFIG.text;
  const glowRgba = hexToRgba(item.color, 0.45);
  const glowDim = hexToRgba(item.color, 0.12);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.content);
    toast({ title: "Copied!", description: `"${item.name}" copied.` });
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([item.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.name.replace(/\s+/g, "_")}${config.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <motion.div
        data-testid={`vault-card-${item.id}`}
        layout
        initial={{ opacity: 0, scale: 0.88, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: -12 }}
        whileHover={{ scale: 1.03, y: -5 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        onClick={() => setExpanded(true)}
        className="relative rounded-xl border cursor-pointer overflow-hidden group"
        style={{
          borderColor: hexToRgba(item.color, 0.45),
          background: `linear-gradient(145deg, rgba(12,14,26,0.97) 55%, ${hexToRgba(item.color, 0.07)})`,
          boxShadow: `0 0 20px 0 ${hexToRgba(item.color, 0.3)}, inset 0 0 14px 0 ${glowDim}`,
        }}
      >
        {/* Animated top strip */}
        <motion.div
          className="h-1 w-full"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ background: item.color, boxShadow: `0 0 14px 3px ${glowRgba}` }}
        />

        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <motion.span
              animate={{ boxShadow: [`0 0 6px ${hexToRgba(item.color, 0.3)}`, `0 0 12px ${hexToRgba(item.color, 0.6)}`, `0 0 6px ${hexToRgba(item.color, 0.3)}`] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="flex items-center gap-2 text-xs font-mono px-2 py-1 rounded-full"
              style={{
                color: item.color,
                background: hexToRgba(item.color, 0.1),
                border: `1px solid ${hexToRgba(item.color, 0.3)}`,
              }}
            >
              {config.icon}
              {config.label}
            </motion.span>
            {isOwner && (
              <motion.button
                data-testid={`delete-item-${item.id}`}
                initial={{ opacity: 0 }}
                whileHover={{ scale: 1.15 }}
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded text-destructive hover:bg-destructive/15"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            )}
          </div>

          <motion.h3
            className="font-bold text-lg mb-2 font-sans flex items-center gap-1.5 truncate"
            animate={{ textShadow: ["0 0 8px rgba(255,50,50,0.7)", "0 0 18px rgba(255,50,50,1)", "0 0 8px rgba(255,50,50,0.7)"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ color: "#ff3232" }}
          >
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.15, 0.9] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{ color: "#ff3232", fontSize: "10px", flexShrink: 0 }}
            >
              ●
            </motion.span>
            <span className="truncate">{item.name}</span>
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.15, 0.9] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 0.9 }}
              style={{ color: "#ff3232", fontSize: "10px", flexShrink: 0 }}
            >
              ●
            </motion.span>
          </motion.h3>

          <p className="text-muted-foreground text-sm font-mono line-clamp-2 mb-4 break-all">
            {item.content}
          </p>

          <div className="flex gap-2">
            <GlowButton color={item.color} onClick={handleCopy as () => void} testId={`copy-item-${item.id}`}>
              <Copy className="w-3 h-3" />
              Copy
            </GlowButton>
            <GlowButton color={item.color} onClick={handleDownload as () => void} testId={`download-item-${item.id}`}>
              <Download className="w-3 h-3" />
              Download
            </GlowButton>
          </div>
        </div>
      </motion.div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent
          className="max-w-2xl border bg-background/95 backdrop-blur-xl"
          style={{ borderColor: hexToRgba(item.color, 0.4), boxShadow: `0 0 40px ${hexToRgba(item.color, 0.15)}` }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold" style={{ color: item.color }}>
              {config.icon}
              <span style={{ color: "#ff3232", textShadow: "0 0 12px rgba(255,50,50,0.8)" }}>
                ● {item.name} ●
              </span>
            </DialogTitle>
          </DialogHeader>
          <div
            className="rounded-lg p-4 font-mono text-sm overflow-auto max-h-80 whitespace-pre-wrap break-all"
            style={{
              background: hexToRgba(item.color, 0.05),
              border: `1px solid ${hexToRgba(item.color, 0.2)}`,
              color: "hsl(var(--foreground))",
            }}
          >
            {item.content}
          </div>
          <div className="flex gap-3 pt-2">
            <GlowButton
              color={item.color}
              fullWidth
              testId="expanded-copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(item.content);
                toast({ title: "Copied!" });
              }}
            >
              <Copy className="w-4 h-4" />
              Copy
            </GlowButton>
            <GlowButton color={item.color} fullWidth testId="expanded-download-btn" onClick={handleDownload as () => void}>
              <Download className="w-4 h-4" />
              Download
            </GlowButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Typing cursor animation for detected type display
function NamePreview({ text }: { text: string }) {
  const [cursor, setCursor] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setCursor((c) => !c), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.span
      key={text.length}
      className="font-mono text-sm font-bold"
      style={{
        color: "#ff4444",
        textShadow: "0 0 10px rgba(255,68,68,0.9), 0 0 22px rgba(255,68,68,0.5)",
      }}
    >
      {text}
      <motion.span
        animate={{ opacity: cursor ? 1 : 0 }}
        transition={{ duration: 0 }}
        style={{ color: "#ff4444" }}
      >
        |
      </motion.span>
    </motion.span>
  );
}

function TypeBadge({ type }: { type: ItemType }) {
  const config = TYPE_CONFIG[type];
  const [shown, setShown] = useState(false);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    setShown(false);
    const t = setTimeout(() => setShown(true), 120);
    return () => clearTimeout(t);
  }, [type]);

  useEffect(() => {
    const interval = setInterval(() => setCursor((c) => !c), 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.span
      key={type}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full"
      style={{
        color: config.color,
        background: hexToRgba(config.color, 0.1),
        border: `1px solid ${hexToRgba(config.color, 0.4)}`,
        boxShadow: `0 0 8px ${hexToRgba(config.color, 0.3)}`,
      }}
    >
      {config.icon}
      {shown ? config.label : ""}
      <span style={{ opacity: cursor ? 1 : 0, color: config.color }}>_</span>
    </motion.span>
  );
}

function AddItemDialog({ open, onClose, token }: { open: boolean; onClose: () => void; token: string }) {
  const queryClient = useQueryClient();
  const createItem = useCreateItem();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#00eaff");
  const [detectedType, setDetectedType] = useState<ItemType>("text");

  useEffect(() => {
    setDetectedType(detectType(content));
  }, [content]);

  const handleClose = () => {
    setName(""); setContent(""); setColor("#00eaff"); setDetectedType("text");
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    createItem.mutate(
      { data: { name: name.trim(), type: detectedType, content: content.trim(), color, ownerToken: token } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetItemStatsQueryKey() });
          toast({ title: "Saved!", description: `"${name}" added to vault.` });
          handleClose();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg border bg-background/95 backdrop-blur-xl"
        style={{ borderColor: hexToRgba("#00eaff", 0.3), boxShadow: "0 0 40px rgba(0,234,255,0.1)" }}
      >
        <DialogHeader>
          <DialogTitle className="font-mono text-xl text-primary neon-text-glow" style={{ "--glow-color": "hsl(var(--primary))" } as React.CSSProperties}>
            Add to Vault
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Name</label>
            <Input
              data-testid="input-item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My awesome snippet"
              className="font-mono bg-black/40 border-red-500/40 focus-visible:border-red-500 focus-visible:ring-red-500/30"
              style={{
                color: name ? "#ff4444" : undefined,
                textShadow: name ? "0 0 10px rgba(255,68,68,0.8), 0 0 20px rgba(255,68,68,0.4)" : undefined,
                caretColor: "#ff4444",
              }}
            />
            {/* Live name preview with typing animation */}
            {name && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1 pt-1 px-1"
              >
                <span className="text-xs font-mono text-muted-foreground opacity-60">Preview:</span>
                <NamePreview text={name} />
              </motion.div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Content</label>
            <Textarea
              data-testid="textarea-item-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste a link, code, JS, app link, or any text..."
              className="font-mono text-sm bg-black/40 border-primary/20 focus-visible:border-primary min-h-32 resize-none"
            />
            {/* Auto-detected type + manual override */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">Detected:</span>
                <TypeBadge type={detectedType} />
              </div>
              <Select value={detectedType} onValueChange={(v) => setDetectedType(v as ItemType)}>
                <SelectTrigger className="h-7 text-xs font-mono bg-black/40 border-primary/20 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="app">App</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Glow Color</label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger data-testid="select-item-color" className="bg-black/40 border-primary/20 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NEON_COLORS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ background: c.value, boxShadow: `0 0 6px ${c.value}` }} />
                      {c.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <GlowButton color="#888888" onClick={handleClose} fullWidth>
              <X className="w-4 h-4" />
              Cancel
            </GlowButton>
            <GlowButton
              color={color}
              type="submit"
              disabled={createItem.isPending || !name.trim() || !content.trim()}
              fullWidth
              testId="button-save-item"
            >
              {createItem.isPending ? "Saving..." : "Save to Vault"}
            </GlowButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Home() {
  const { isOwner, token } = useOwner();
  const [addOpen, setAddOpen] = useState(false);
  const { data: items = [], isLoading } = useListItems();
  const { data: stats } = useGetItemStats();
  const deleteItemMutation = useDeleteItem({
    request: { headers: { "x-owner-token": token ?? "" } },
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: number) => {
    deleteItemMutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetItemStatsQueryKey() });
          toast({ title: "Deleted" });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Animated backgrounds */}
      <ParticleField />
      <GlowOrbs />

      {/* Owner lock */}
      <OwnerAuth />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-center text-center mb-14"
        >
          <div className="relative mb-6">
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ scale: [1.3, 1.45, 1.3], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ background: "radial-gradient(circle, rgba(0,234,255,0.35) 0%, transparent 70%)" }}
            />
            <img
              src={profilePhoto}
              alt="Alihsan Shourov"
              data-testid="img-profile"
              className="relative w-28 h-28 rounded-full object-cover border-2"
              style={{
                borderColor: "hsl(var(--primary))",
                boxShadow: "0 0 30px 6px rgba(0,234,255,0.4), 0 0 60px 12px rgba(0,234,255,0.15)",
              }}
            />
          </div>

          <motion.h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight font-sans mb-2"
            animate={{ textShadow: ["0 0 20px rgba(0,234,255,0.6)", "0 0 35px rgba(0,234,255,0.9)", "0 0 20px rgba(0,234,255,0.6)"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ color: "hsl(var(--primary))" }}
          >
            Alihsan Shourov
          </motion.h1>
          <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase">
            Personal Vault
          </p>

          {stats && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap justify-center gap-3 mt-6"
            >
              {[
                { label: "Total", value: stats.total, color: "#00eaff" },
                { label: "Links", value: stats.byType.link ?? 0, color: "#00ff88" },
                { label: "Code", value: stats.byType.code ?? 0, color: "#b24bff" },
                { label: "JS", value: stats.byType.javascript ?? 0, color: "#ffe600" },
                { label: "Text", value: stats.byType.text ?? 0, color: "#ff3fa4" },
                { label: "Apps", value: stats.byType.app ?? 0, color: "#00eaff" },
              ].map((s) => (
                <motion.div
                  key={s.label}
                  whileHover={{ scale: 1.08 }}
                  animate={{ boxShadow: [`0 0 6px ${hexToRgba(s.color, 0.2)}`, `0 0 12px ${hexToRgba(s.color, 0.4)}`, `0 0 6px ${hexToRgba(s.color, 0.2)}`] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: Math.random() * 2 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono cursor-default"
                  style={{
                    background: hexToRgba(s.color, 0.08),
                    border: `1px solid ${hexToRgba(s.color, 0.3)}`,
                    color: s.color,
                  }}
                >
                  <Database className="w-3 h-3" />
                  <span>{s.value}</span>
                  <span className="opacity-60">{s.label}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="rounded-xl h-44"
                animate={{ opacity: [0.04, 0.09, 0.04] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.15 }}
                style={{ background: "rgba(255,255,255,0.06)" }}
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 text-muted-foreground font-mono"
          >
            <motion.div
              animate={{ opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-6xl mb-4"
              style={{ color: "rgba(0,234,255,0.25)" }}
            >
              [ EMPTY ]
            </motion.div>
            <p className="text-sm">The vault awaits its first treasure.</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <VaultCard item={item} isOwner={isOwner} onDelete={handleDelete} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Floating + button (owner only) */}
      <AnimatePresence>
        {isOwner && (
          <motion.button
            data-testid="button-add-item"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => setAddOpen(true)}
            className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center z-50 font-bold"
            style={{
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
            }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ boxShadow: ["0 0 20px 4px rgba(0,234,255,0.5)", "0 0 36px 10px rgba(0,234,255,0.3)", "0 0 20px 4px rgba(0,234,255,0.5)"] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <Plus className="w-6 h-6 relative z-10" />
          </motion.button>
        )}
      </AnimatePresence>

      {token && (
        <AddItemDialog open={addOpen} onClose={() => setAddOpen(false)} token={token} />
      )}
    </div>
  );
}
