import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles } from "lucide-react";
import ToolLayout from "@/components/ToolLayout";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import APIKeySettings, { useOpenAIKey } from "@/components/APIKeySettings";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

const PDFChat = () => {
  const { apiKey, hasApiKey } = useOpenAIKey();
  const [files, setFiles] = useState<File[]>([]);
  const [documentText, setDocumentText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const extractText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }

    return text;
  };

  const handleFileChange = async (newFiles: File[]) => {
    setFiles(newFiles);
    setMessages([]);
    
    if (newFiles.length > 0) {
      const text = await extractText(newFiles[0]);
      // Truncate for context
      setDocumentText(text.slice(0, 10000));
      setMessages([
        {
          role: "assistant",
          content: `I've loaded "${newFiles[0].name}". Ask me anything about this document!`,
        },
      ]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !apiKey || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that answers questions about the following document. Be concise and accurate. If the answer isn't in the document, say so.\n\nDocument content:\n${documentText}`,
            },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage },
          ],
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error("API request failed");
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || "I couldn't generate a response.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantMessage },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <ToolLayout
      title="Chat with PDF"
      description="Ask questions about your PDF using AI"
      icon={MessageSquare}
      color="word"
    >
      {!hasApiKey ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">OpenAI API Key Required</h3>
          <p className="mb-4 text-muted-foreground">
            To use AI features, please add your OpenAI API key.
          </p>
          <APIKeySettings />
        </div>
      ) : files.length === 0 ? (
        <>
          <div className="mb-4 flex justify-end">
            <APIKeySettings />
          </div>
          <FileUpload
            files={files}
            onFilesChange={handleFileChange}
            title="Drop your PDF file here"
            description="Select a PDF to chat with"
          />
        </>
      ) : (
        <div className="flex h-[600px] flex-col rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h3 className="font-semibold text-foreground">{files[0].name}</h3>
              <p className="text-sm text-muted-foreground">
                Ask questions about this document
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFiles([]);
                setMessages([]);
                setDocumentText("");
              }}
            >
              Change File
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-muted px-4 py-2">
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about the document..."
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
};

export default PDFChat;
