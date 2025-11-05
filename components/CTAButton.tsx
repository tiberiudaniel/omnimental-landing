"use client";

import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";  

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
        className="mt-6 px-6 py-3 bg-[#F6F2EE] text-[#0F172A] rounded font-[Manrope] font-semibold hover:bg-[#D8C6B6] hover:text-[#E60012] transition"
      >
        {text}
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="bg-[#FDFCF9] p-6 rounded-lg max-w-md w-full shadow-lg border border-[#D8C6B6]">
            <DialogTitle 
              className="text-lg font-mono font-medium text-[#222222] italic text-center"
              style={{ letterSpacing: '0.05em', textShadow: '1px 1px 2px rgba(0,0,0,0.08)', fontFamily: '"Courier New", monospace' }}
            >
              Formular de înscriere
            </DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
              <input
                placeholder="Nume"
                {...register("name")}
                className="w-full p-2 border border-[#D8C6B6] rounded font-[Inter] text-[#0F172A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#E60012]"
              />
              {errors.name && <p className="text-[#E60012] text-sm">{errors.name.message}</p>}
              <input
                placeholder="Email"
                {...register("email")}
                className="w-full p-2 border border-[#D8C6B6] rounded font-[Inter] text-[#0F172A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#E60012]"
              />
              {errors.email && <p className="text-[#E60012] text-sm">{errors.email.message}</p>}
              <button 
                type="submit" 
                className="w-full mt-2 bg-[#F6F2EE] text-[#0F172A] py-2 rounded font-[Manrope] font-semibold hover:bg-[#D8C6B6] hover:text-[#E60012] transition"
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
