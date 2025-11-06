"use client";

import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getDb } from "../lib/firebase";

const db = getDb();

const schema = z.object({
  name: z.string().min(1, "Numele este obligatoriu"),
  email: z.string().email("Email invalid"),
});

type FormData = z.infer<typeof schema>;

export default function CTAButton({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await addDoc(collection(db, "signups"), {
        ...data,
        timestamp: serverTimestamp(),
      });
      alert("Înscriere trimisă!");
      setOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group mt-6 inline-flex items-center gap-3 rounded-[10px] border border-[#2C2C2C] px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012]"
      >
        {text}
        <span className="translate-y-[1px] text-sm text-[#E60012] transition group-hover:translate-x-1 group-hover:text-[#B8000E]">
          →
        </span>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="relative w-full max-w-md overflow-hidden rounded-[12px] border border-[#D8C6B6] bg-white/96 p-6 shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-[2px]">
            <DialogTitle
              className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-[#A08F82]"
            >
              Formular de înscriere
            </DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
              <input
                placeholder="Nume"
                {...register("name")}
                className="w-full rounded-[8px] border border-[#D8C6B6] px-4 py-3 text-[#2C2C2C] placeholder:text-[#9F9F9F] transition focus:border-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012]"
              />
              {errors.name && (
                <p className="text-sm text-[#E60012]">{errors.name.message}</p>
              )}
              <input
                placeholder="Email"
                {...register("email")}
                className="w-full rounded-[8px] border border-[#D8C6B6] px-4 py-3 text-[#2C2C2C] placeholder:text-[#9F9F9F] transition focus:border-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012]"
              />
              {errors.email && (
                <p className="text-sm text-[#E60012]">{errors.email.message}</p>
              )}
              <button
                type="submit"
                className="group w-full rounded-[10px] border border-[#2C2C2C] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#2C2C2C] transition hover:border-[#E60012] hover:text-[#E60012] focus:outline-none focus:ring-1 focus:ring-[#E60012]"
              >
                Trimite
              </button>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
