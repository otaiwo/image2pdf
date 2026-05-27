import React, { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
    Upload,
    MessageSquare,
    Send,
    User,
    Cpu,
    FileText,
    RefreshCw,
    X
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../utils/api";
import { ToolLayout } from "../components/ToolLayout";
import { ChainedToolAction } from "../components/ChainedToolAction";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const ChatWithPdf: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isAsking, setIsAsking] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const selectedFile = acceptedFiles[0];
            setFile(selectedFile);
            setIsUploading(true);
            setMessages([]);

            try {
                const response = await api.uploadChatFile(selectedFile);
                if (response.success && response.job_id) {
                    setJobId(response.job_id);
                    toast.success("PDF Analyzed! You can now ask questions.");
                } else {
                    throw new Error(response.message || "Analysis failed");
                }
            } catch (error: any) {
                toast.error(error.message);
                setFile(null);
            } finally {
                setIsUploading(false);
            }
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        disabled: !!file
    });

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !jobId || isAsking) return;

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", content: userMsg }]);
        setIsAsking(true);

        try {
            const response = await api.askChatQuestion(jobId, userMsg, messages);
            if (response.success && response.data?.answer) {
                setMessages(prev => [...prev, { role: "assistant", content: response.data!.answer }]);
            } else {
                throw new Error(response.message || "Failed to get answer");
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsAsking(false);
        }
    };

    return (
        <ToolLayout
            title="Chat with your PDF"
            description="Ask anything about your document and get instant answers."
            icon={MessageSquare}
            maxWidth="xl"
            sidebar={
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 space-y-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Document</h3>
                    {!file ? (
                        <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'bg-red-50 dark:bg-red-900/10 border-red-300' : 'border-gray-200 dark:border-gray-700 hover:border-red-200'}`}>
                            <input {...getInputProps()} />
                            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 font-medium">Upload PDF to start</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 relative">
                                <FileText className="h-10 w-10 text-red-600 mb-2" />
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                <button
                                    onClick={() => { setFile(null); setJobId(null); setMessages([]); }}
                                    className="absolute top-2 right-2 p-1 hover:bg-white dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-red-600 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            {isUploading && (
                                <div className="flex items-center text-xs text-red-600 font-bold animate-pulse">
                                    <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                                    Analyzing document...
                                </div>
                            )}
                        </div>
                    )}
                </div>
            }
        >
            <div className="h-[600px] flex flex-col">
                {/* Chat Area */}
                <div className="flex-grow bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
                    <div className="flex-grow overflow-y-auto p-6 space-y-6" ref={scrollRef}>
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center px-10">
                                <div className="bg-red-50 p-6 rounded-full mb-6">
                                    <MessageSquare className="h-12 w-12 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No messages yet</h3>
                                <p className="text-gray-500 max-w-sm">
                                    {!file ? "Upload a PDF document from the sidebar to begin chatting." : "Ask a question about the uploaded document above."}
                                </p>
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${msg.role === 'user' ? 'bg-gray-900' : 'bg-red-600'}`}>
                                            {msg.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Cpu className="h-4 w-4 text-white" />}
                                        </div>
                                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'bg-red-50 dark:bg-red-900/20 text-gray-900 dark:text-white shadow-sm'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        {isAsking && (
                            <div className="flex justify-start">
                                <div className="max-w-[80%] flex gap-3">
                                    <div className="shrink-0 w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center">
                                        <Cpu className="h-4 w-4 text-white animate-pulse" />
                                    </div>
                                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 flex space-x-1">
                                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                        <form onSubmit={handleSend} className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={jobId ? "Ask a question..." : "Please upload a PDF first"}
                                disabled={!jobId || isAsking}
                                className="w-full pl-6 pr-16 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none shadow-sm transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || !jobId || isAsking}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-900/20 transition-all disabled:opacity-50"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </form>
                        <p className="text-[10px] text-center text-gray-400 mt-4 uppercase tracking-widest font-bold">
                            Powered by OpenAI GPT-4o
                        </p>
                    </div>
                </div>
                <ChainedToolAction currentTool="AI Chat" />
            </div>
        </ToolLayout>
    );
};

export default ChatWithPdf;
