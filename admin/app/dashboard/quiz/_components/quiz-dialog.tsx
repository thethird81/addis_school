"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createQuizWithQuestions } from "../_actions/quiz-actions";
import { Upload, FileText, X, Image as ImageIcon } from "lucide-react";

interface QuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface ParsedQuestion {
  question_text: string;
  options: any;
  correct_answer: string;
  difficulty?: string;
  explanation?: string | null;
  question_image?: string | null;
}

export function QuizDialog({ open, onOpenChange, onSuccess }: QuizDialogProps) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle("");
    setFile(null);
    setQuestions([]);
    setIsParsing(false);
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const parseJsonFile = (file: File) => {
    setIsParsing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rawData = JSON.parse(text);
        const rawQuestions = Array.isArray(rawData)
          ? rawData
          : rawData.questions || [];

        if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
          toast.error("Invalid JSON: expected an array of questions");
          setIsParsing(false);
          return;
        }

        const parsed: ParsedQuestion[] = rawQuestions.map((item: any) => {
          let correctAnswer = "";
          if (
            typeof item.correct_answer_index === "number" &&
            item.options &&
            Array.isArray(item.options)
          ) {
            const option = item.options[item.correct_answer_index];
            correctAnswer = option?.id || "";
          } else if (item.correct_answer) {
            correctAnswer = item.correct_answer;
          }

          const optionsPayload = Array.isArray(item.options)
            ? item.options.map((opt: any) => ({
                id: opt.id,
                text: opt.text,
                option_image: opt.option_image || null,
              }))
            : item.options;

          return {
            question_text: item.question || item.question_text || "",
            options: optionsPayload,
            correct_answer: correctAnswer,
            difficulty: item.difficulty || "easy",
            explanation: item.explanation || null,
            question_image: item.question_image || null,
          };
        });

        setQuestions(parsed);
        toast.success(`Parsed ${parsed.length} questions successfully`);
      } catch (error: any) {
        toast.error(`Failed to parse JSON: ${error.message}`);
        setQuestions([]);
      } finally {
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read file");
      setIsParsing(false);
    };

    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".json")) {
      toast.error("Please upload a .json file");
      return;
    }

    setFile(selectedFile);
    parseJsonFile(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
    setQuestions([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Quiz title is required");
      return;
    }

    if (questions.length === 0) {
      toast.error("Please upload a JSON file with questions");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createQuizWithQuestions({
        title: title.trim(),
        questions,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to create quiz");
        return;
      }

      toast.success(`Quiz created successfully with ${result.count} question(s)`);
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Quiz</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="quiz-title" className="text-sm font-medium">Quiz Title</label>
            <Input
              id="quiz-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Questions File (JSON)</label>

            {!file ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-8 text-center transition-colors hover:border-muted-foreground/50"
              >
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload JSON file</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Bulk upload questions in the required format
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {isParsing ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
                    Parsing questions...
                  </div>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border p-3">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {questions.length} question(s) loaded
                    </p>
                    {questions.map((q, index) => (
                      <div
                        key={index}
                        className="rounded border bg-muted/20 p-2 text-xs"
                      >
                        <div className="flex items-start gap-2">
                          {q.question_image && (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-muted">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium line-clamp-2">
                              {index + 1}. {q.question_text}
                            </p>
                            <p className="text-muted-foreground mt-1">
                              Correct:{" "}
                              <span className="font-medium text-green-600">
                                {q.correct_answer}
                              </span>
                            </p>
                            {q.explanation && (
                              <p className="text-muted-foreground mt-1 line-clamp-2">
                                {q.explanation}
                              </p>
                            )}
                            {Array.isArray(q.options) &&
                              q.options.some((o: any) => o.option_image) && (
                                <p className="text-muted-foreground mt-1 flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  Has option images
                                </p>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isParsing}>
            {isSubmitting ? "Creating..." : "Create Quiz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}