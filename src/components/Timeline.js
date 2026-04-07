import React from "react";
import { formatDate } from "../utils/helpers";

export default function Timeline({ events }) {
  if (!events || events.length === 0) {
    return (
      <p className="text-muted mb-0 fst-italic">No changes logged yet.</p>
    );
  }

  return (
    <div className="timeline-wrap">
      <ul className="list-unstyled timeline-list mb-0">
        {events.map((ev, idx) => (
          <li key={`${ev.kind}-${ev.date}-${idx}`} className="timeline-item">
            <div className="timeline-dot" aria-hidden />
            <div className="timeline-body">
              <div className="small text-muted mb-1">{formatDate(ev.date)}</div>
              {ev.kind === "rename" && (
                <div>
                  Renamed from <strong>{ev.from}</strong> to{" "}
                  <strong>{ev.to}</strong>
                </div>
              )}
              {ev.kind === "status" && (
                <div>
                  {ev.fromStatus == null ? (
                    <>
                      Status set to <strong>{ev.toStatus}</strong>
                    </>
                  ) : (
                    <>
                      Status changed from <strong>{ev.fromStatus}</strong> to{" "}
                      <strong>{ev.toStatus}</strong>
                    </>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
