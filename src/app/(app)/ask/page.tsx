import { ComingSoon } from "@/components/ui/ComingSoon";

export default function Page() {
  return (
    <ComingSoon title="Ask CRIBS is on its way" links={[{ href: "/home", label: "Browse the guides" }, { href: "/faq", label: "Read the FAQ" }]}>
      Soon you will be able to ask questions in your own words and get plain answers based on the guides in this app. Until then, the guides and the FAQ are ready for you.
    </ComingSoon>
  );
}
