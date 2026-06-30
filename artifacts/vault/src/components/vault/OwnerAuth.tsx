import { useState } from 'react';
import { useVerifyOwner } from '@workspace/api-client-react';
import { useOwner } from '@/hooks/use-owner';
import { Lock, Unlock, KeyRound } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function OwnerAuth() {
  const { isOwner, login, logout } = useOwner();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const verifyOwner = useVerifyOwner();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    verifyOwner.mutate(
      { data: { password } },
      {
        onSuccess: (data) => {
          if (data.success && data.token) {
            login(data.token);
            setIsOpen(false);
            setPassword('');
            toast({
              title: "Access Granted",
              description: "Owner mode activated.",
              className: "border-primary bg-background text-primary neon-glow",
              style: { '--glow-color': 'hsl(var(--primary))' } as React.CSSProperties
            });
          } else {
            toast({
              title: "Access Denied",
              description: "Invalid owner key.",
              variant: "destructive",
            });
          }
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to verify owner.",
            variant: "destructive",
          });
        }
      }
    );
  };

  if (isOwner) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="fixed top-4 right-4 z-50 text-primary animate-pulse-glow"
        style={{ '--glow-color': 'hsl(var(--primary))' } as React.CSSProperties}
        onClick={logout}
        title="Lock Vault"
      >
        <Unlock className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed top-4 right-4 z-50 text-muted-foreground hover:text-primary transition-colors"
          title="Owner Access"
        >
          <Lock className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-primary/20 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-mono text-primary neon-text-glow" style={{ '--glow-color': 'hsl(var(--primary))' } as React.CSSProperties}>
            <KeyRound className="w-6 h-6" />
            System Override
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleLogin} className="space-y-6 pt-4">
          <Input
            type="password"
            placeholder="Enter owner key"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="font-mono bg-black/50 border-primary/30 focus-visible:border-primary focus-visible:ring-primary h-12 text-lg text-primary"
            autoFocus
          />
          <Button 
            type="submit" 
            className="w-full h-12 font-mono text-lg tracking-widest neon-glow hover:bg-primary/90 transition-all"
            style={{ '--glow-color': 'hsl(var(--primary))' } as React.CSSProperties}
            disabled={verifyOwner.isPending || !password}
          >
            {verifyOwner.isPending ? "VERIFYING..." : "DECRYPT"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
