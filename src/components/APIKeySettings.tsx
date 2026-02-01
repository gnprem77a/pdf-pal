import { useState, useEffect } from "react";
import { Settings, Key, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const API_KEY_STORAGE_KEY = "pdftools-openai-api-key";

export function useOpenAIKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (stored) {
      setApiKey(stored);
    }
  }, []);

  const saveApiKey = (key: string) => {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
    setApiKey(key);
  };

  const removeApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    setApiKey(null);
  };

  return { apiKey, saveApiKey, removeApiKey, hasApiKey: !!apiKey };
}

interface APIKeySettingsProps {
  trigger?: React.ReactNode;
}

const APIKeySettings = ({ trigger }: APIKeySettingsProps) => {
  const { apiKey, saveApiKey, removeApiKey, hasApiKey } = useOpenAIKey();
  const [inputKey, setInputKey] = useState("");
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    if (inputKey.trim().startsWith("sk-")) {
      saveApiKey(inputKey.trim());
      setInputKey("");
      setOpen(false);
      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been saved locally.",
      });
    } else {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid OpenAI API key starting with 'sk-'",
        variant: "destructive",
      });
    }
  };

  const handleRemove = () => {
    removeApiKey();
    toast({
      title: "API Key Removed",
      description: "Your API key has been removed from local storage.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Key className="mr-2 h-4 w-4" />
            {hasApiKey ? "API Key Set" : "Set API Key"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>OpenAI API Key</DialogTitle>
          <DialogDescription>
            Your API key is stored locally in your browser and never sent to our servers.
            Get your key from{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              OpenAI's dashboard
            </a>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {hasApiKey ? (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">API Key Active</p>
                    <p className="text-xs text-muted-foreground">
                      {apiKey?.slice(0, 7)}...{apiKey?.slice(-4)}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="sk-..."
                />
              </div>
              <Button onClick={handleSave} className="w-full">
                Save API Key
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            🔒 Your key is stored in localStorage and only used for direct API calls to OpenAI.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default APIKeySettings;
