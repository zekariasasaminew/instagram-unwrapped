import type { Milestones, LongestStreak } from "@/lib/types";

export function FunFacts({
  milestones,
  longestStreak,
}: {
  milestones: Milestones;
  longestStreak: LongestStreak;
}) {
  const firstMessageDate = milestones.first_message_ever
    ? new Date(milestones.first_message_ever).toLocaleDateString()
    : "—";

  return (
    <div className="card">
      <h2>Fun facts</h2>
      <table className="plain">
        <tbody>
          <tr>
            <td>First message ever</td>
            <td>{firstMessageDate}</td>
          </tr>
          <tr>
            <td>Busiest day ever</td>
            <td>
              {milestones.busiest_day} ({milestones.busiest_day_count.toLocaleString()} msgs)
            </td>
          </tr>
          <tr>
            <td>Longest daily streak</td>
            <td>
              {longestStreak.days} days &mdash; with {longestStreak.participant ?? "—"}
            </td>
          </tr>
          <tr>
            <td>You, in these chats</td>
            <td>{milestones.you_name}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
