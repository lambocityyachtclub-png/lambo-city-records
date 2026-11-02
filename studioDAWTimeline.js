
/*
 * LAMBO CITY RECORDS
 * DAW ARRANGEMENT TIMELINE V1
 *
 * Renders existing multitrack clips on a shared bar ruler.
 * Does not create or replace any audio engine.
 */

const BAR_WIDTH = 72;
const TOTAL_BARS = 16;

export function renderStudioDAWTimeline({
  container,
  track,
  onChange = () => {}
}) {
  if (!container || !track) {
    throw new Error("Timeline container or track unavailable.");
  }

  const clips = Array.isArray(track.clips) ? track.clips : [];

  // Give older clips a default arrangement position.
  clips.forEach((clip, index) => {
    if (!Number.isFinite(clip.startBar)) {
      clip.startBar = 1 + (index * 4);
    }

    if (!Number.isFinite(clip.lengthBars)) {
      clip.lengthBars = 4;
    }

    clip.lengthBars = Math.max(
      1,
      Math.min(TOTAL_BARS, clip.lengthBars)
    );

    clip.startBar = Math.max(
      1,
      Math.min(
        TOTAL_BARS - clip.lengthBars + 1,
        clip.startBar
      )
    );
  });

  container.replaceChildren();

  const style = document.createElement("style");

  style.textContent = `
    .lc-arrangement {
      width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      background: #10131a;
      border: 1px solid #343946;
      border-radius: 8px;
      -webkit-overflow-scrolling: touch;
    }

    .lc-arrangement-inner {
      width: ${BAR_WIDTH * TOTAL_BARS}px;
      min-width: ${BAR_WIDTH * TOTAL_BARS}px;
    }

    .lc-arrangement-ruler {
      display: grid;
      grid-template-columns: repeat(${TOTAL_BARS}, ${BAR_WIDTH}px);
      height: 32px;
      background: #20242e;
      border-bottom: 1px solid #665438;
    }

    .lc-arrangement-ruler span {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #e6bb69;
      font-size: 10px;
      border-right: 1px solid #454958;
    }

    .lc-arrangement-lane {
      position: relative;
      width: ${BAR_WIDTH * TOTAL_BARS}px;
      min-height: 92px;
      background:
        repeating-linear-gradient(
          90deg,
          transparent 0,
          transparent ${BAR_WIDTH - 1}px,
          #454958 ${BAR_WIDTH - 1}px,
          #454958 ${BAR_WIDTH}px
        ),
        repeating-linear-gradient(
          90deg,
          transparent 0,
          transparent ${BAR_WIDTH * 3 - 1}px,
          #665438 ${BAR_WIDTH * 3 - 1}px,
          #665438 ${BAR_WIDTH * 3}px
        ),
        #141821;
    }

    .lc-arrangement-clip {
      position: absolute;
      top: 9px;
      min-height: 72px;
      padding: 0 8px 8px;
      overflow: hidden;
      background: #b99a62;
      color: #111;
      border: 1px solid #e6bb69;
      border-radius: 6px;
      box-sizing: border-box;
    }

    .lc-arrangement-clip-title {
      display: block;
      width: 100%;
      min-height: 27px;
      padding: 6px 2px;
      overflow: hidden;
      color: #111;
      font-size: 11px;
      font-weight: bold;
      white-space: nowrap;
      text-overflow: ellipsis;
      cursor: grab;
      touch-action: none;
      user-select: none;
    }

    .lc-arrangement-clip-title:active {
      cursor: grabbing;
    }

    .lc-arrangement-clip audio {
      display: block;
      width: 100%;
      height: 30px;
      margin-top: 4px;
    }

    .lc-arrangement-empty {
      padding: 18px 12px;
      color: #777f90;
      font-size: 11px;
    }

    .lc-arrangement-help {
      padding: 7px 9px;
      color: #999fad;
      font-size: 10px;
      border-top: 1px solid #343946;
    }
  `;

  const scroll = document.createElement("div");
  scroll.className = "lc-arrangement";

  const inner = document.createElement("div");
  inner.className = "lc-arrangement-inner";

  const ruler = document.createElement("div");
  ruler.className = "lc-arrangement-ruler";

  for (let bar = 1; bar <= TOTAL_BARS; bar += 1) {
    const mark = document.createElement("span");
    mark.textContent = `BAR ${bar}`;
    ruler.appendChild(mark);
  }

  const lane = document.createElement("div");
  lane.className = "lc-arrangement-lane";

  if (!clips.length) {
    const empty = document.createElement("div");
    empty.className = "lc-arrangement-empty";
    empty.textContent = "No clips on this track yet.";
    lane.appendChild(empty);
  }

  clips.forEach(clip => {
    const block = document.createElement("div");
    block.className = "lc-arrangement-clip";

    const title = document.createElement("div");
    title.className = "lc-arrangement-clip-title";
    title.textContent = `${clip.name} · DRAG TO MOVE`;
    title.title = "Touch and drag to move this clip";

    const updatePosition = () => {
      block.style.left =
        `${(clip.startBar - 1) * BAR_WIDTH}px`;

      block.style.width =
        `${clip.lengthBars * BAR_WIDTH - 4}px`;
    };

    updatePosition();

    // Drag from the clip title, leaving audio controls usable.
    title.addEventListener("pointerdown", event => {
      if (event.button !== 0 && event.pointerType === "mouse") {
        return;
      }

      event.preventDefault();

      const startX = event.clientX;
      const originalBar = clip.startBar;
      const maxStart =
        TOTAL_BARS - clip.lengthBars + 1;

      title.setPointerCapture(event.pointerId);

      const move = moveEvent => {
        const distance = moveEvent.clientX - startX;
        const barOffset = Math.round(distance / BAR_WIDTH);

        clip.startBar = Math.max(
          1,
          Math.min(maxStart, originalBar + barOffset)
        );

        updatePosition();
      };

      const finish = () => {
        title.removeEventListener("pointermove", move);
        title.removeEventListener("pointerup", finish);
        title.removeEventListener("pointercancel", finish);

        onChange(clip);
      };

      title.addEventListener("pointermove", move);
      title.addEventListener("pointerup", finish);
      title.addEventListener("pointercancel", finish);
    });

    block.appendChild(title);

    if (clip.blob && clip.blob.size > 0) {
      if (!clip.objectUrl) {
        clip.objectUrl = URL.createObjectURL(clip.blob);
      }

      const player = document.createElement("audio");
      player.controls = true;
      player.preload = "metadata";
      player.src = clip.objectUrl;

      block.appendChild(player);
    } else {
      const note = document.createElement("div");
      note.style.fontSize = "10px";
      note.textContent = "Clip ready";
      block.appendChild(note);
    }

    lane.appendChild(block);
  });

  const help = document.createElement("div");
  help.className = "lc-arrangement-help";
  help.textContent =
    "16-BAR ARRANGEMENT · Touch and drag a clip title to move it.";

  inner.append(ruler, lane, help);
  scroll.appendChild(inner);
  container.append(style, scroll);

  return {
    refresh() {
      renderStudioDAWTimeline({
        container,
        track,
        onChange
      });
    }
  };
}

