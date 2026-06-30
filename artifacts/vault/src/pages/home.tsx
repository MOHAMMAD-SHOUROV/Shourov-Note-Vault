import { useState } from "react";
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
  Plus,
  Copy,
  Download,
  Trash2,
  X,
  Database,
} from "lucide-react";
import profilePhoto from "@assets/shourov.jpg";

type ItemType = "link" | "code" | "javascript" | "text";

const TYPE_CONFIG: Record<
  ItemType,
  { icon: React.ReactNode; label: string; ext: string }
> = {
  link: { icon: <Link2 className="w-4 h-4" />, label: "Link", ext: ".txt" },
  code: { icon: <Code2 className="w-4 h-4" />, label: "Code", ext: ".txt" },
  javascript: {
    icon: <Zap className="w-4 h-4" />,
    label: "JavaScript",
    ext: ".js",
  },
  text: { icon: <FileText className="w-4 h-4" />, label: "Text", ext: ".txt" },
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

function VaultCard({
  item,
  onDelete,
  isOwner,
}: {
  item: {
    id: number;
    name: string;
    type: string;
    content: string;
    color: string;
    createdAt: string;
  };
  onDelete: (id: number) => void;
  isOwner: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  const config = TYPE_CONFIG[item.type as ItemType] ?? TYPE_CONFIG.text;
  const glowRgba = hexToRgba(item.color, 0.45);
  const glowRgbaDim = hexToRgba(item.color, 0.15);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.content);
    toast({ title: "Copied!", description: `"${item.name}" copied to clipboard.` });
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const ext = config.ext;
    const blob = new Blob([item.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.name.replace(/\s+/g, "_")}${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <motion.div
        data-testid={`vault-card-${item.id}`}
        layout
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: -10 }}
        whileHover={{ scale: 1.03, y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        onClick={() => setExpanded(true)}
        className="relative rounded-xl border cursor-pointer overflow-hidden group"
        style={{
          borderColor: hexToRgba(item.color, 0.5),
          background: `linear-gradient(135deg, rgba(15,17,30,0.98) 60%, ${hexToRgba(item.color, 0.08)})`,
          boxShadow: `0 0 18px 0 ${glowRgba}, inset 0 0 12px 0 ${glowRgbaDim}`,
          animation: "border-glow 3.5s infinite alternate",
          "--glow-color": glowRgba,
        } as React.CSSProperties}
      >
        {/* Top color strip */}
        <div
          className="h-1 w-full"
          style={{ background: item.color, boxShadow: `0 0 12px 3px ${glowRgba}` }}
        />

        <div className="p-5">
          {/* Icon + type badge */}
          <div className="flex items-center justify-between mb-3">
            <span
              className="flex items-center gap-2 text-xs font-mono px-2 py-1 rounded-full"
              style={{
                color: item.color,
                background: hexToRgba(item.color, 0.12),
                border: `1px solid ${hexToRgba(item.color, 0.35)}`,
              }}
            >
              {config.icon}
              {config.label}
            </span>
            {isOwner && (
              <button
                data-testid={`delete-item-${item.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Name */}
          <h3
            className="font-bold text-lg mb-2 truncate font-sans"
            style={{ color: item.color, textShadow: `0 0 8px ${glowRgba}` }}
          >
            {item.name}
          </h3>

          {/* Content preview */}
          <p className="text-muted-foreground text-sm font-mono line-clamp-2 mb-3 break-all">
            {item.content}
          </p>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              data-testid={`copy-item-${item.id}`}
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
              style={{
                color: item.color,
                background: hexToRgba(item.color, 0.1),
                border: `1px solid ${hexToRgba(item.color, 0.25)}`,
              }}
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
            <button
              data-testid={`download-item-${item.id}`}
              onClick={handleDownload}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors"
              style={{
                color: item.color,
                background: hexToRgba(item.color, 0.1),
                border: `1px solid ${hexToRgba(item.color, 0.25)}`,
              }}
            >
              <Download className="w-3 h-3" />
              Download
            </button>
          </div>
        </div>
      </motion.div>

      {/* Expanded Dialog */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent
          className="max-w-2xl border bg-background/95 backdrop-blur-xl"
          style={{ borderColor: hexToRgba(item.color, 0.4) }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold" style={{ color: item.color }}>
              {config.icon}
              {item.name}
            </DialogTitle>
          </DialogHeader>
          <div
            className="rounded-lg p-4 font-mono text-sm overflow-auto max-h-80 whitespace-pre-wrap break-all"
            style={{
              background: hexToRgba(item.color, 0.06),
              border: `1px solid ${hexToRgba(item.color, 0.2)}`,
              color: "hsl(var(--foreground))",
            }}
          >
            {item.content}
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              data-testid="expanded-copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(item.content);
                toast({ title: "Copied!", description: "Content copied to clipboard." });
              }}
              className="flex-1 font-mono"
              style={{ background: item.color, color: "#0b0d1a" }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button
              data-testid="expanded-download-btn"
              variant="outline"
              onClick={handleDownload}
              className="flex-1 font-mono"
              style={{ borderColor: hexToRgba(item.color, 0.5), color: item.color }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AddItemDialog({
  open,
  onClose,
  token,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
}) {
  const queryClient = useQueryClient();
  const createItem = useCreateItem();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [type, setType] = useState<ItemType>("link");
  const [content, setContent] = useState("");
  const [color, setColor] = useState("#00eaff");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    createItem.mutate(
      { data: { name: name.trim(), type, content: content.trim(), color, ownerToken: token } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetItemStatsQueryKey() });
          toast({ title: "Saved!", description: `"${name}" added to vault.` });
          setName("");
          setContent("");
          setType("link");
          setColor("#00eaff");
          onClose();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save item.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-primary/30 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl text-primary">
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
              className="font-mono bg-black/40 border-primary/20 focus-visible:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Type</label>
              <Select value={type} onValueChange={(v) => setType(v as ItemType)}>
                <SelectTrigger data-testid="select-item-type" className="bg-black/40 border-primary/20 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
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
                        <span
                          className="w-3 h-3 rounded-full inline-block"
                          style={{ background: c.value, boxShadow: `0 0 6px ${c.value}` }}
                        />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Content</label>
            <Textarea
              data-testid="textarea-item-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={type === "link" ? "https://..." : "Paste your content here..."}
              className="font-mono text-sm bg-black/40 border-primary/20 focus-visible:border-primary min-h-32 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 font-mono text-muted-foreground"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              data-testid="button-save-item"
              type="submit"
              className="flex-1 font-mono"
              disabled={createItem.isPending || !name.trim() || !content.trim()}
              style={{ background: color, color: "#0b0d1a" }}
            >
              {createItem.isPending ? "Saving..." : "Save to Vault"}
            </Button>
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
          toast({ title: "Deleted", description: "Item removed from vault." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Ambient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,234,255,0.06) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(178,75,255,0.05) 0%, transparent 60%)",
        }}
      />

      {/* Owner lock button */}
      <OwnerAuth />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-center text-center mb-14"
        >
          {/* Avatar */}
          <div className="relative mb-6">
            <div
              className="absolute inset-0 rounded-full animate-pulse-glow"
              style={{
                background: "radial-gradient(circle, rgba(0,234,255,0.35) 0%, transparent 70%)",
                transform: "scale(1.35)",
              }}
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

          {/* Name */}
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight font-sans mb-2"
            style={{
              color: "hsl(var(--primary))",
              textShadow: "0 0 20px rgba(0,234,255,0.7), 0 0 40px rgba(0,234,255,0.35)",
            }}
          >
            Alihsan Shourov
          </h1>
          <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase">
            Personal Vault
          </p>

          {/* Stats bar */}
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
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono"
                  style={{
                    background: hexToRgba(s.color, 0.1),
                    border: `1px solid ${hexToRgba(s.color, 0.3)}`,
                    color: s.color,
                  }}
                >
                  <Database className="w-3 h-3" />
                  <span>{s.value}</span>
                  <span className="opacity-60">{s.label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl h-44 animate-pulse"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 text-muted-foreground font-mono"
          >
            <div className="text-6xl mb-4" style={{ color: "rgba(0,234,255,0.2)" }}>
              [ EMPTY ]
            </div>
            <p className="text-sm">The vault awaits its first treasure.</p>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <VaultCard
                    item={item}
                    isOwner={isOwner}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Floating add button (owner only) */}
      <AnimatePresence>
        {isOwner && (
          <motion.button
            data-testid="button-add-item"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAddOpen(true)}
            className="fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center z-50 shadow-2xl font-bold"
            style={{
              background: "hsl(var(--primary))",
              color: "hsl(var(--primary-foreground))",
              boxShadow: "0 0 28px 6px rgba(0,234,255,0.5), 0 0 60px 12px rgba(0,234,255,0.2)",
            }}
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Add Item Dialog */}
      {token && (
        <AddItemDialog
          open={addOpen}
          onClose={() => setAddOpen(false)}
          token={token}
        />
      )}
    </div>
  );
}
