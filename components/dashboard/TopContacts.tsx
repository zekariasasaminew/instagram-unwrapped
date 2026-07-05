import { HBarChart } from "@/components/charts/HBarChart";
import type { Contact } from "@/lib/types";

export function TopContacts({ contacts }: { contacts: Contact[] }) {
  return (
    <div className="card">
      <h2>Who you talk to most</h2>
      <HBarChart
        items={contacts.map((c) => ({ label: c.participant, value: c.total_messages }))}
        color="var(--series-you)"
        maxBars={12}
      />
    </div>
  );
}
