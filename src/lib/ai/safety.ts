// Safety layer for the AI guide: a keyword pre-check that runs BEFORE any model call.
// It is a safety net, not a classifier: it errs toward answering with emergency guidance.
import { CRISIS_LINES, EMERGENCY_NUMBER, type CrisisLine } from "@/config/safety";

export type EmergencyKind = "self_harm" | "abuse" | "child_missing" | "medical";

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[’‘`]/g, "'").replace(/\s+/g, " ").trim();

// English, Filipino and Taglish. Written to catch "right now" situations, not questions like "what is a seizure?".
const PATTERNS: Record<EmergencyKind, RegExp[]> = {
  self_harm: [
    /\bkill(ing)? (myself|me)\b/, /\bend(ing)? (my|this) life\b/, /\bwant(ed)? to die\b/, /\bwanna die\b/, /\bsuicid/,
    /\b(hurt|harm|cut)(ting)? myself\b/, /\bself[- ]?harm/, /\b(don't|do not|dont) want to (live|be alive|be here)\b/, /\bbetter off (dead|without me)\b/,
    /\bmagpakamatay\b/, /\bgusto ko(ng| ng| na| nang)? mamatay\b/, /\b(ayoko|ayaw ko)(ng| ng| na| nang)? mabuhay\b/, /\bpapatayin ko (na )?(ang )?(sarili|sarili ko)\b/, /\bsasaktan ko (ang )?sarili\b/,
  ],
  abuse: [
    /\b(child|sexual|physical) abuse\b/, /\babus(ed|ing) (my|the|a) (child|son|daughter|kid|baby)\b/, /\b(my|the) (child|son|daughter|kid) (is|was|has been|is being) (abused|molested|beaten|hit|hurt)\b/,
    /\bmolest/, /\b(beat|beating|hit|hitting|shake|shaking|hurt|hurting) (my|the) (child|son|daughter|kid|baby)\b/,
    /\b(afraid|scared|worried|fear) (i|that i) (might|will|could|may) (hurt|hit|harm) (my|the|him|her|them)\b/, /\bwant to (hurt|hit|harm) (my|the) (child|son|daughter|kid)\b/,
    /\b(sinasaktan|binubugbog|hinahampas|pinapalo ng sobra|inaabuso|binababoy|minolestiya) (ang |ng )?(anak|bata)\b/, /\bsinasaktan (ko|siya|sila) ang anak ko\b/, /\bgusto ko (na )?saktan ang anak ko\b/,
  ],
  child_missing: [
    /\b(my|the) (child|son|daughter|kid|baby) (is|went|has gone|has been) missing\b(?! (the|a|an|his|her|their|my|out|some|many|too|more|any|social|certain|school|class|key|important|skills?)\b)/, /\bcan't find (my|the) (child|son|daughter|kid|baby)\b/, /\bcannot find (my|the) (child|son|daughter|kid|baby)\b/,
    /\b(child|son|daughter|kid) (ran|run) away and\b/, /\b(nawawala|nawala) (ang )?(anak|bata)\b/, /\bhindi ko makita (ang )?anak ko\b/,
  ],
  medical: [
    /\bnot breathing\b/, /\bstopped breathing\b/, /\b(can't|cannot|can not|cant) breathe\b/, /\b(is|are|am|was) choking\b/, /\bchoking on\b/,
    /\b(is|was|are|am) having (a )?seizure\b/, /\bhaving (a )?seizure (now|right now)\b/, /\bunconscious\b/, /\bunresponsive\b/, /\bpassed out\b/, /\bwon't wake up\b/,
    /\boverdos(e|ed)\b/, /\bswallowed (a |an |some |the )?(poison|battery|batteries|bleach|pills|medicine|detergent|magnet|magnets)\b/, /\bbleeding (a lot|heavily|badly)\b/,
    /\b(is|was) drowning\b/, /\bnalunod\b/, /\bnalulunod\b/, /\bhindi (siya )?humihinga\b/, /\bnawalan (ng )?malay\b/, /\bnag-?seizure\b/, /\bnasamid\b/, /\bnakalunok ng\b/,
  ],
};

// Checked in this order: the most serious first.
const ORDER: EmergencyKind[] = ["self_harm", "abuse", "child_missing", "medical"];

/** Returns the kind of emergency the text describes, or null. */
export function detectEmergency(text: string): EmergencyKind | null {
  const t = norm(text);
  for (const kind of ORDER) if (PATTERNS[kind].some((re) => re.test(t))) return kind;
  return null;
}

const lines = (list: readonly CrisisLine[]) => list.map((l) => `${l.name}: ${l.number}`).join("\n");

/** The fixed reply for an emergency. The model is never called for these. */
export function emergencyReply(kind: EmergencyKind, crisis: readonly CrisisLine[] = CRISIS_LINES, number: string = EMERGENCY_NUMBER, locale = "en"): string {
  if (locale === "fil") return emergencyReplyFil(kind, crisis, number);
  const call = `If anyone is in danger right now, call ${number} or go to the nearest emergency room.`;
  const extra = crisis.length ? `\n\nSupport lines:\n${lines(crisis)}` : "";
  const fil = `\n\nTumawag sa ${number} kung may panganib ngayon.`;
  const close = "\n\nThis guide cannot help with emergencies.";
  switch (kind) {
    case "self_harm":
      return `I'm really sorry you are going through this. You matter, and you do not have to face it alone.\n\n${call} Please also tell someone you trust, a family member, a friend or a doctor, how you are feeling right now, and stay with another person if you can.${extra}${fil}${close}`;
    case "abuse":
      return `Thank you for telling me. A child's safety comes first.\n\n${call} If a child is being hurt, contact the local authorities or a child protection professional. If you are worried you might hurt your child, move to a safe place, ask another adult to take over, and reach out to someone you trust or a professional.${extra}${fil}${close}`;
    case "child_missing":
      return `Act now.\n\nCall ${number} and stay on the line. Check the most dangerous places near you first, like water and roads. Tell them your child's name, what they are wearing, and that they may not answer when called.${extra}${fil}${close}`;
    case "medical":
      return `This sounds like a medical emergency.\n\nCall ${number} now or go to the nearest emergency room. Do not wait for an answer here. If someone can help, ask them to stay with your child.${extra}${fil}${close}`;
  }
}

/** The same fixed replies in Filipino (draft wording: needs a native speaker's review). Ends with one English line for anyone helping. */
function emergencyReplyFil(kind: EmergencyKind, crisis: readonly CrisisLine[], number: string): string {
  const call = `Kung may nasa panganib ngayon, tumawag agad sa ${number} o pumunta sa pinakamalapit na emergency room.`;
  const extra = crisis.length ? `\n\nMga linya ng tulong:\n${lines(crisis)}` : "";
  const en = `\n\nCall ${number} if anyone is in danger right now.`;
  const close = "\n\nHindi makakatulong ang gabay na ito sa emergency.";
  switch (kind) {
    case "self_harm":
      return `Pasensya na at pinagdadaanan mo ito. Mahalaga ka, at hindi mo ito kailangang harapin nang mag-isa.\n\n${call} Sabihin din sa taong pinagkakatiwalaan mo, kapamilya, kaibigan o doktor, ang nararamdaman mo ngayon, at manatiling may kasama kung kaya.${extra}${en}${close}`;
    case "abuse":
      return `Salamat sa pagsasabi mo. Kaligtasan ng bata ang pinakauna.\n\n${call} Kung may batang sinasaktan, makipag-ugnayan sa lokal na awtoridad o sa propesyonal sa proteksyon ng bata. Kung natatakot kang masaktan mo ang anak mo, lumipat sa ligtas na lugar, ipaubaya muna siya sa ibang adulto, at humingi ng tulong sa taong pinagkakatiwalaan mo o sa propesyonal.${extra}${en}${close}`;
    case "child_missing":
      return `Kumilos agad.\n\nTumawag sa ${number} at huwag ibaba ang tawag. Unahing tingnan ang pinakadelikadong lugar sa malapit, gaya ng tubig at kalsada. Sabihin ang pangalan ng anak mo, ang suot niya, at na maaaring hindi siya sumagot kapag tinawag.${extra}${en}${close}`;
    case "medical":
      return `Mukhang medikal na emergency ito.\n\nTumawag na sa ${number} o pumunta sa pinakamalapit na emergency room. Huwag nang hintayin ang sagot dito. Kung may makakatulong, pasamahin siya sa anak mo.${extra}${en}${close}`;
  }
}
