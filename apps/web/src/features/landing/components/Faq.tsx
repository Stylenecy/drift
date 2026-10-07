import { Reveal } from "@/features/motion/Motion";

// Plain answers to the questions a careful visitor asks, including the weak spots.
const QA = [
  {
    q: "Is this live trading with real money?",
    a: "No. DRIFT runs on BNB Smart Chain Testnet and an exchange testnet, so no real money moves. We make no profit claims; backtests are research.",
  },
  {
    q: "What exactly does the contract do?",
    a: "It stores two public rules: the current market mood and a 20% loss limit. Before each trade the bot writes its decision and its current loss to the contract, and acts on the yes or no in that same public receipt. An exit at the 20% stop never waits: it happens first and is recorded right after. If a recorded loss reaches 20%, the contract halts the bot and only exits are allowed.",
  },
  {
    q: "What happens if the blockchain can't be reached?",
    a: "The bot takes no new risk. Without a confirmed answer from the contract, only exits pass (fail-closed), and its own built-in 20% stop keeps running underneath.",
  },
  {
    q: "Can the bot's owner bend the rules?",
    a: "Three trust points remain, and we name them: the bot has to ask the contract (DRIFT's own runner always does; a changed bot could skip it), it reports its own loss, and its key can lift a halt. Every answer, loss and restart that does happen is public and permanent on BNB Chain. Next: losses confirmed by the exchange, and lifting a halt only through a multisig or a time delay.",
  },
  {
    q: "Does the AI place trades?",
    a: "No. The strategies and the risk check are fixed rules. The AI analyst only explains what the system sees, in plain words.",
  },
  {
    q: "How do I check all this myself?",
    a: "Open the live guard page: it reads the contract from your browser, with no login or wallet. From there you can open every receipt on BscScan, read the verified source on Sourcify, or ask the contract a what-if.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="cv-auto scroll-mt-16 bg-paper px-4 py-28 text-ink sm:px-8 sm:py-40">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 lg:grid-cols-12">
        <Reveal as="h2" className="q-h2 lg:col-span-4">
          Questions
        </Reveal>
        <div className="border-t border-ink/15 lg:col-span-8">
          {QA.map((item) => (
            <details key={item.q} className="q-faq group border-b border-ink/15">
              <summary className="flex items-start justify-between gap-6 py-7 sm:py-8">
                <span className="text-[19px] font-medium leading-snug sm:text-[22px]">{item.q}</span>
                <span aria-hidden className="q-plus mt-1 shrink-0 text-[24px] leading-none text-paper-mute">+</span>
              </summary>
              <p className="q-answer max-w-[62ch] pb-8 text-[16px] leading-relaxed text-paper-mute sm:text-[17px]">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
