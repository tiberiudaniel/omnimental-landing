// components/FirstScreen.tsx
"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { getDb } from "../lib/firebase";
import TypewriterText from "./TypewriterText";
import { useI18n } from "../components/I18nProvider";

interface FirstScreenProps {
  onNext: () => void;
}

export default function FirstScreen({ onNext }: FirstScreenProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const { t, lang, setLang } = useI18n();
  
  <h1>{t("firstScreenQuestion")}</h1>
  
  const db = getDb();

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const q = query(
          collection(db, "userSuggestions"),
          orderBy("timestamp", "desc"),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const allSuggestions: string[] = snapshot.docs
          .map((doc) => doc.data()?.text)
          .filter(Boolean) as string[];
        setSuggestions(
          allSuggestions.sort(() => 0.5 - Math.random()).slice(0, 5)
        );
      } catch (err) {
        console.error("fetchSuggestions failed:", err);
      }
    };
    fetchSuggestions();
  }, [db]);

  const handleSubmit = async (value?: string) => {
    const text = value ?? input;
    if (!text.trim()) return;

    try {
      await addDoc(collection(db, "userSuggestions"), {
        text: text.trim(),
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      console.error("addDoc failed:", err);
    }

    setInput("");
    setShowSuggestions(false);
    onNext();
  };

  return (
    <div className="flex flex-col items-center min-h-screen justify-center px-4 bg-[#FDFCF9]">
      <TypewriterText text={i18n.firstScreenQuestion} speed={50} />

      <input
        type="text"
        placeholder={i18n.firstScreenPlaceholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        className="mt-6 p-3 rounded-lg border w-full max-w-md shadow placeholder:text-[#888] text-[#222]"
      />

      <button
        onClick={() => setShowSuggestions(!showSuggestions)}
        className="mt-4 px-4 py-2 bg-[#F6F2EE] rounded"
      >
        {i18n.firstScreenSuggestionsBtn}
      </button>

      {showSuggestions && (
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSubmit(s)}
              className="px-3 py-1 border rounded"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => handleSubmit()}
        disabled={!input.trim()}
        className="mt-8 px-6 py-3 bg-[#F6F2EE] rounded disabled:opacity-50"
      >
        {i18n.firstScreenContinueBtn}
      </button>
    </div>
  );
}
