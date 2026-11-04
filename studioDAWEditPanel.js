import StudioMultitrackWorkspace from "./studioMultitrackWorkspace.js";
import {
  listStudioDAWSessionTemplates,
  applyStudioDAWSessionTemplate
} from "./studioDAWSessionTemplates.js";
import { renderStudioSessionToWav, downloadStudioWav, renderStudioSessionToMp3, downloadStudioMp3 } from "./studioDAWExport.js";

/*
 * LAMBO CITY RECORDS
 * SONG EDITOR PANEL — V3
 *
 * Dedicated recorded-audio editing workspace.
 * Reuses the existing multitrack session and clips.
 * Beat Lab remains a separate interface.
 */

export function createStudioDAWEditPanel({
  beatLab,
  onSwitchToBeatLab
} = {}) {
  if (!beatLab) {
    throw new Error("LAMBO CITY SONG EDITOR: Beat Lab session is required.");
  }

  return {
    root: null,
    onSwitchToBeatLab,

    mount() {
      if (this.root?.isConnected) return this.root;

      const multitrack = beatLab.ui?.querySelector("#lc-multitrack-workspace");
      if (!multitrack) {
        throw new Error("LAMBO CITY SONG EDITOR: shared multitrack session was not found.");
      }

      const root = document.createElement("section");
      root.id = "lc-daw-edit-panel";
      root.style.cssText = "width:100%;min-height:100%;box-sizing:border-box;display:grid;gap:14px;color:#f4f1eb";

      const header = document.createElement("header");
      header.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 16px;border:1px solid #665438;border-radius:12px;background:linear-gradient(135deg,#1a1b20,#101219)";
      header.innerHTML = `
        <div>
          <div style="color:#d8b36e;font-size:10px;letter-spacing:2px">LAMBO CITY RECORDS · ARRANGEMENT</div>
          <h2 style="margin:6px 0 3px;font-size:clamp(20px,3vw,27px);letter-spacing:.5px">SONG EDITOR</h2>
          <div style="color:#a8a8b1;font-size:12px">Recorded audio · Waveform arrangement · Multitrack session</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <label style="display:flex;gap:7px;align-items:center;color:#d8b36e;font-size:11px;font-weight:700">
            BPM
            <input data-session-tempo type="number" min="60" max="180" step="1" value="${StudioMultitrackWorkspace.tempo}" style="width:68px;min-height:42px;padding:7px;border:1px solid #665438;border-radius:7px;background:#11151d;color:#f4f1eb">
          </label>
          <button type="button" data-session-record style="min-height:46px;padding:10px 15px;border:1px solid #9b7948;border-radius:8px;background:#5a2525;color:#fff;font-weight:800">● REC</button>
          <button type="button" data-session-play style="min-height:46px;padding:10px 15px;border:1px solid #9b7948;border-radius:8px;background:#594321;color:#fff;font-weight:800">▶ PLAY</button>
          <button type="button" data-session-stop style="min-height:46px;padding:10px 15px;border:1px solid #454958;border-radius:8px;background:#222631;color:#f4f1eb;font-weight:800">■ STOP</button>
          <button type="button" data-session-export-wav style="min-height:46px;padding:10px 15px;border:1px solid #9b7948;border-radius:8px;background:#201c16;color:#f1d49c;font-weight:800">EXPORT WAV</button>
          <button type="button" data-session-export-mp3 style="min-height:46px;padding:10px 15px;border:1px solid #9b7948;border-radius:8px;background:#201c16;color:#f1d49c;font-weight:800">EXPORT MP3</button>
          <button type="button" data-switch-beatlab aria-label="Switch to Digital Beat Lab" style="min-height:46px;padding:10px 15px;border:1px solid #9b7948;border-radius:8px;background:#211d16;color:#f1d49c;font-weight:800;touch-action:manipulation">← DIGITAL BEAT LAB</button>
        </div>
      `;

      header.querySelector("[data-switch-beatlab]").addEventListener("click", () => {
        this.onSwitchToBeatLab?.();
      });
      header.querySelector("[data-session-record]").addEventListener("click", () => {
        void StudioMultitrackWorkspace.startArmedRecording({ vocalEffects: beatLab.vocalEffects });
      });
      header.querySelector("[data-session-play]").addEventListener("click", () => {
        void StudioMultitrackWorkspace.playAll();
      });
      header.querySelector("[data-session-stop]").addEventListener("click", () => {
        StudioMultitrackWorkspace.stopAll();
        if (StudioMultitrackWorkspace.isTrackRecording()) {
          void StudioMultitrackWorkspace.stopArmedRecording();
        }
      });
      header.querySelector("[data-session-export-wav]").addEventListener("click", async event => {
        const button = event.currentTarget;
        button.disabled = true;
        button.textContent = "RENDERING…";
        try {
          const wav = await renderStudioSessionToWav({
            tracks: StudioMultitrackWorkspace.tracks,
            tempo: StudioMultitrackWorkspace.tempo
          });
          downloadStudioWav(wav, beatLab.currentProject?.metadata?.title || "lambo-city-song");
          StudioMultitrackWorkspace.status("WAV master exported.");
        } catch (error) {
          StudioMultitrackWorkspace.status("WAV EXPORT ERROR: " + (error?.message || error));
        } finally {
          button.disabled = false;
          button.textContent = "EXPORT WAV";
        }
      });
      header.querySelector("[data-session-export-mp3]").addEventListener("click", async event => {
        const button = event.currentTarget;
        button.disabled = true;
        button.textContent = "ENCODING…";
        try {
          const mp3 = await renderStudioSessionToMp3({
            tracks: StudioMultitrackWorkspace.tracks,
            tempo: StudioMultitrackWorkspace.tempo
          });
          downloadStudioMp3(mp3, beatLab.currentProject?.metadata?.title || "lambo-city-song");
          StudioMultitrackWorkspace.status("MP3 master exported at 192 kbps.");
        } catch (error) {
          StudioMultitrackWorkspace.status("MP3 EXPORT ERROR: " + (error?.message || error));
        } finally {
          button.disabled = false;
          button.textContent = "EXPORT MP3";
        }
      });


      const projectManager = document.createElement("section");
      projectManager.style.cssText = "display:grid;grid-template-columns:minmax(150px,1.3fr) minmax(150px,1fr) auto auto;gap:8px;align-items:end;padding:12px;border:1px solid #665438;border-radius:10px;background:linear-gradient(135deg,#191b21,#11141b)";
      projectManager.innerHTML = `
        <label style="display:grid;gap:6px;color:#d8b36e;font-size:10px;font-weight:800;letter-spacing:1px">SONG / PROJECT NAME
          <input data-project-name type="text" maxlength="80" value="Untitled Song" placeholder="Name this song" style="width:100%;min-height:42px;padding:8px;border:1px solid #665438;border-radius:7px;background:#11151d;color:#f4f1eb">
        </label>
        <label style="display:grid;gap:6px;color:#d8b36e;font-size:10px;font-weight:800;letter-spacing:1px">SAVED PROJECTS
          <select data-project-list style="width:100%;min-height:42px;padding:8px;border:1px solid #665438;border-radius:7px;background:#11151d;color:#f4f1eb"><option value="">No saved projects yet</option></select>
        </label>
        <button type="button" data-project-save style="min-height:42px;padding:9px 13px;border:1px solid #9b7948;border-radius:8px;background:#594321;color:white;font-weight:800">SAVE SONG</button>
        <button type="button" data-project-open style="min-height:42px;padding:9px 13px;border:1px solid #665438;border-radius:8px;background:#222631;color:white;font-weight:800">OPEN</button>
        <div style="grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" data-project-new style="min-height:36px;padding:7px 11px">NEW SONG</button>
          <button type="button" data-project-delete style="min-height:36px;padding:7px 11px">DELETE SAVED PROJECT</button>
          <button type="button" data-project-export style="min-height:36px;padding:7px 11px">EXPORT SESSION FILE</button>
          <button type="button" data-project-import style="min-height:36px;padding:7px 11px">IMPORT SESSION FILE</button>
          <input data-project-file type="file" accept=".lcsession,.json,application/json" hidden>
          <span data-project-status role="status" aria-live="polite" style="align-self:center;color:#a8a8b1;font-size:11px">Sessions are stored in this browser. Export a backup file to move a song to another device.</span>
        </div>
      `;
      const projectNameInput = projectManager.querySelector("[data-project-name]");
      const projectList = projectManager.querySelector("[data-project-list]");
      const projectStatus = projectManager.querySelector("[data-project-status]");
      const refreshProjectList = async () => {
        try {
          const projects = await StudioMultitrackWorkspace.listSavedSessions();
          projectList.replaceChildren();
          if (!projects.length) {
            const option = document.createElement("option"); option.value = ""; option.textContent = "No saved projects yet"; projectList.appendChild(option);
          } else {
            projects.forEach(project => {
              const option = document.createElement("option");
              option.value = project.projectId;
              option.textContent = project.projectName + " · " + project.trackCount + " tracks";
              option.dataset.projectName = project.projectName;
              projectList.appendChild(option);
            });
          }
          if (StudioMultitrackWorkspace.activeProjectId) projectList.value = StudioMultitrackWorkspace.activeProjectId;
        } catch (error) {
          projectStatus.textContent = "PROJECT LIBRARY ERROR: " + (error?.message || error);
        }
      };
      projectManager.querySelector("[data-project-save]").addEventListener("click", async () => {
        try {
          const name = projectNameInput.value.trim() || "Untitled Song";
          const id = StudioMultitrackWorkspace.activeProjectId || ("lc-daw-" + (globalThis.crypto?.randomUUID?.() || (Date.now() + "-" + Math.floor(Math.random() * 1000000))));
          await StudioMultitrackWorkspace.saveSession(id, name);
          await refreshProjectList();
          projectStatus.textContent = "Saved “" + name + "”.";
        } catch (error) { projectStatus.textContent = "SAVE ERROR: " + (error?.message || error); }
      });
      projectManager.querySelector("[data-project-open]").addEventListener("click", async () => {
        const id = projectList.value;
        if (!id) { projectStatus.textContent = "Choose a saved song first."; return; }
        if (!window.confirm("Open this saved song? The current unsaved session will be replaced.")) return;
        try {
          const selected = projectList.selectedOptions[0];
          const ok = await StudioMultitrackWorkspace.loadSession(id);
          if (!ok) throw new Error("The saved song could not be restored.");
          projectNameInput.value = selected?.dataset.projectName || StudioMultitrackWorkspace.activeProjectName;
          StudioMultitrackWorkspace.activeProjectId = id;
          projectStatus.textContent = "Opened “" + projectNameInput.value + "”.";
          await refreshProjectList();
        } catch (error) { projectStatus.textContent = "OPEN ERROR: " + (error?.message || error); }
      });
      projectManager.querySelector("[data-project-new]").addEventListener("click", () => {
        if (!window.confirm("Start a new song? Save the current session first if you want to keep it.")) return;
        StudioMultitrackWorkspace.activeProjectId = null;
        StudioMultitrackWorkspace.activeProjectName = "Untitled Song";
        StudioMultitrackWorkspace.undoStack = [];
        StudioMultitrackWorkspace.redoStack = [];
        StudioMultitrackWorkspace.resetSession();
        projectNameInput.value = "Untitled Song";
        projectStatus.textContent = "New song workspace ready.";
      });
      projectManager.querySelector("[data-project-delete]").addEventListener("click", async () => {
        const id = projectList.value;
        if (!id) return;
        if (!window.confirm("Permanently delete this saved project from this browser?")) return;
        try {
          await StudioMultitrackWorkspace.removeSavedSession(id);
          if (StudioMultitrackWorkspace.activeProjectId === id) StudioMultitrackWorkspace.activeProjectId = null;
          await refreshProjectList();
          projectStatus.textContent = "Saved project deleted.";
        } catch (error) { projectStatus.textContent = "DELETE ERROR: " + (error?.message || error); }
      });
      projectManager.querySelector("[data-project-export]").addEventListener("click", async () => {
        try {
          const data = await StudioMultitrackWorkspace.exportSession();
          data.projectName = projectNameInput.value.trim() || "Untitled Song";
          const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url; link.download = data.projectName.replace(/[^a-z0-9-_]+/gi, "-") + ".lcsession";
          link.click(); URL.revokeObjectURL(url);
          projectStatus.textContent = "Session backup exported.";
        } catch (error) { projectStatus.textContent = "EXPORT ERROR: " + (error?.message || error); }
      });
      projectManager.querySelector("[data-project-import]").addEventListener("click", () => projectManager.querySelector("[data-project-file]").click());
      projectManager.querySelector("[data-project-file]").addEventListener("change", async event => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
          const data = JSON.parse(await file.text());
          StudioMultitrackWorkspace.importSession(data);
          StudioMultitrackWorkspace.activeProjectId = null;
          StudioMultitrackWorkspace.activeProjectName = data.projectName || file.name.replace(/\.lcsession$/i, "");
          projectNameInput.value = StudioMultitrackWorkspace.activeProjectName;
          projectStatus.textContent = "Imported session. Save it to add it to this browser's project library.";
        } catch (error) { projectStatus.textContent = "IMPORT ERROR: " + (error?.message || error); }
        event.target.value = "";
      });
      void refreshProjectList();

      const templatePanel = document.createElement("section");
      templatePanel.style.cssText = "display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:end;padding:13px 15px;border:1px solid #665438;border-radius:11px;background:linear-gradient(135deg,#191b21,#11141b)";
      templatePanel.innerHTML = `
        <label style="display:grid;gap:7px;min-width:0;color:#d8b36e;font-size:10px;font-weight:800;letter-spacing:1px">
          STARTING SESSION
          <select data-session-template style="width:100%;min-height:44px;padding:9px;border:1px solid #665438;border-radius:7px;background:#11151d;color:#f4f1eb;font-size:13px;letter-spacing:0">
            <option value="">Choose a vocal workflow…</option>
          </select>
        </label>
        <button type="button" data-load-template style="min-height:44px;padding:10px 15px;border:1px solid #9b7948;border-radius:8px;background:#594321;color:#fff;font-weight:800">LOAD TEMPLATE</button>
        <div data-template-guidance role="status" aria-live="polite" style="grid-column:1/-1;color:#a8a8b1;font-size:11px;line-height:1.5">Four original vocal-session concepts. Loading a template replaces the current track layout; existing audio clips are protected by a confirmation prompt.</div>
      `;
      const templateSelect = templatePanel.querySelector("[data-session-template]");
      const templateGuidance = templatePanel.querySelector("[data-template-guidance]");
      listStudioDAWSessionTemplates().forEach(template => {
        const option = document.createElement("option");
        option.value = template.id;
        option.textContent = template.name;
        templateSelect.appendChild(option);
      });
      if (StudioMultitrackWorkspace.sessionTemplateId) {
        templateSelect.value = StudioMultitrackWorkspace.sessionTemplateId;
        const activeTemplate = listStudioDAWSessionTemplates().find(item => item.id === templateSelect.value);
        if (activeTemplate) templateGuidance.textContent = activeTemplate.concept + " " + activeTemplate.guidance;
      }
      templatePanel.querySelector("[data-load-template]").addEventListener("click", () => {
        const templateId = templateSelect.value;
        if (!templateId) {
          templateGuidance.textContent = "Choose one of the four session concepts first.";
          return;
        }
        const hasAudio = StudioMultitrackWorkspace.tracks.some(track =>
          (track.clips || []).some(clip => clip.blob instanceof Blob && clip.blob.size > 0)
        );
        if (hasAudio && !window.confirm("Loading this template will replace the current track layout and remove its audio clips. Save or export the song first. Continue?")) {
          return;
        }
        try {
          const template = applyStudioDAWSessionTemplate(StudioMultitrackWorkspace, templateId);
          templateGuidance.textContent = template.concept + " " + template.guidance;
          const tempoInput = header.querySelector("[data-session-tempo]");
          if (tempoInput) tempoInput.value = String(StudioMultitrackWorkspace.tempo);
        } catch (error) {
          templateGuidance.textContent = "TEMPLATE ERROR: " + (error?.message || error);
        }
      });

      const tempoInput = header.querySelector("[data-session-tempo]");
      tempoInput.addEventListener("change", () => {
        const tempo = Math.max(60, Math.min(180, Number(tempoInput.value) || 100));
        StudioMultitrackWorkspace.setTempo(tempo);
        tempoInput.value = String(StudioMultitrackWorkspace.tempo);
      });

      const intro = document.createElement("div");
      intro.style.cssText = "padding:0 2px;color:#a8a8b1;font-size:12px;line-height:1.6";
      intro.textContent = "Import your instrumental, record each verse and hook on its own track, then build doubles, ad-libs, and harmonies around the same song timeline.";

      root.append(header, projectManager, templatePanel, intro, multitrack);
      this.root = root;
      return root;
    },

    destroy() {
      if (this.root) this.root.remove();
      this.root = null;
    }
  };
}

export default createStudioDAWEditPanel;
