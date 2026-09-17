export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export function mapServerDocument(d: {
  id: string;
  name: string;
  word_count?: number;
  char_count?: number;
  file_type?: string;
  uploaded_at?: number;
}) {
  return {
    id: d.id,
    name: d.name,
    wordCount: d.word_count ?? 0,
    charCount: d.char_count ?? 0,
    fileType: d.file_type ?? "",
    uploadedAt: d.uploaded_at ?? Date.now(),
  };
}
