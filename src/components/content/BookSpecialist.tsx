"use client";
import { useRef } from "react";
import { CalendarCheck, ExternalLink, Info, MapPin, X } from "lucide-react";
import { mapsSearchUrl } from "@/lib/domain/content";

/**
 * "Book" for a listing. The app cannot book appointments itself and sample listings may not be real clinics,
 * so this opens a short, honest guide: find the clinic on the map, confirm it directly, and what to bring.
 */
export function BookSpecialist({ name, role, location, sample }: { name: string; role: string; location: string; sample: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = `book-${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className="btn-primary min-h-11 px-5 text-base" aria-haspopup="dialog">
        <CalendarCheck size={18} aria-hidden="true" /> Book
      </button>
      <dialog ref={dialog} className="sheet" aria-labelledby={id}>
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id={id} className="h-section">Book with {name}</h2>
              <p className="font-bold text-pink-dark">{role}</p>
            </div>
            <button type="button" onClick={() => dialog.current?.close()} className="btn-ghost h-11 w-11 shrink-0 p-0" aria-label="Close"><X size={22} aria-hidden="true" /></button>
          </div>
          {sample && (
            <p className="notice notice-warn text-sm"><Info size={20} className="mt-0.5 shrink-0 text-amber-dark" aria-hidden="true" />
              <span>This is a sample listing. The clinic may not exist. Check it on the map and confirm directly before you go.</span></p>
          )}
          <p className="flex items-start gap-2 text-ink-soft"><MapPin size={18} className="mt-0.5 shrink-0" aria-hidden="true" />{location}</p>
          <a href={mapsSearchUrl(name, location)} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
            <ExternalLink size={18} aria-hidden="true" /> Find the clinic on Google Maps
          </a>
          <div className="rounded-2xl bg-tint-mint p-4">
            <p className="mb-2 font-bold">When you call or message, have ready:</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>Your child&apos;s age and any diagnosis or assessment papers</li>
              <li>What you want help with (for example speech, behavior, school)</li>
              <li>Days and times you can come, and if they accept HMO</li>
            </ul>
          </div>
          <p className="text-xs text-ink-soft">C.R.I.B.S. does not book appointments or share your details with clinics.</p>
        </div>
      </dialog>
    </>
  );
}
