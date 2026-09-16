import Image from "next/image";

export default function BrandLogo() {
  return (
    <span className="bb-brand-lockup">
      <Image className="bb-brand-symbol" src="/bb-mark.png" alt="" width={56} height={56} priority />
      <span className="bb-brand-wordmark">
        <strong>B&amp;B<span aria-hidden="true">.</span></strong>
        <span>Schadstoffsanierung</span>
      </span>
    </span>
  );
}
