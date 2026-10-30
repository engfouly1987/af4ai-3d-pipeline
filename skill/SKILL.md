---
name: af4ai-3d-pipeline
description: Run the AF4AI project studio end to end: GLB or image+brief plus a library or generic pipeline, to phased 3D, hero, shots, reel (cloud or PC) and one final folder, asking after every step.
---

# AF4AI project studio (3D pipeline)

Talk to the user in Egyptian Arabic, short and practical. Prompts stay in English inside code blocks.

**Four rules for the whole session:**
1. **Step 0 comes first.** No work starts before the output plan is agreed.
2. **One stage per reply.** After every stage, show the result and ask with AskUserQuestion. Offer:
   - "تمام، نكمل" (Recommended).
   - "عدّل": apply the user's notes.
   - "أعيد".
   - "تخطّى".
   - "وقّف واحفظ".

   Wait for the answer before the next stage.
3. **Keep a `progress.json`** in the project folder so any session can resume ("كمّل مشروع …").
4. **Never publish to the user's website yourself.** The user runs their own deploy step.

## Fixed decisions (do not reopen)
- **Hero look:** the minimal "v1" look. Light drafting background, grid, gold scan line. No sky, sun, dusk, fog or AO. The page shows only the logo and the viewer: no captions and no rule.
- **Controls (hero with buttons):**
  - Stage bar at the bottom: الموقع، الهيكل، الأدوار، الفتحات، التشطيب، الاكتمال. Click a stage, use the arrows, or swipe horizontally.
  - Normal scroll drives the build.
  - 360 drag orbit.
  - Zoom: + and − buttons, pinch, or Ctrl+wheel.
  - Reset and free-explore.
  - "إنهاء المعاينة" goes back to the page the user came from.
- **Light renderer:**
  - Render only when something changes.
  - Shared materials per source material and phase.
  - Repeated meshes become InstancedMesh; the rest merge per material. Keep instanced meshes the loader already made.
  - `powerPreference:'default'`.
  - Pixel ratio ≤1.25 on desktop and ≤1.5 on mobile.
  - No mouse-follow tilt.

  Measured on Sharaa: idle draws went from continuous to zero, draws while orbiting fell about 10×, and the JS heap went from 68 to 21 MB.
- **Default video:** a 23 s silent 9:16 reel; the user adds music on Facebook. A narrated film (16:9, 4:5, 9:16) only if asked; voice Charon via flow_narrate (gemini engine).
- On-screen text in Arabic.
- **Model first, images after.** For library projects the 3D model is the reference, and booklet images are regenerated from its renders.
- **Ownership:**
  - Downloaded free models are internal tests only.
  - Free models are allowed only as props.
  - A client's model needs publishing permission.

## Kit
**Kit v2 on the user's PC:** `<KIT>/` = the `kit/` folder of this repository, cloned anywhere on the user's PC (for example `~/af4ai-3d/kit/`). See its README. Stage only the files a step needs.
- **`pipeline/`**
  - `generic.pipeline.json`: 41 steps in 10 stages for any project. Step BRF-00 is an intake prompt that returns facts JSON.
  - `fill-pipeline.py generic.pipeline.json facts.json <slug>.pipeline.json [--clean]` fills every `{{PLACEHOLDER}}`. `--clean`, or an empty SIGNATURE, removes the board sentence and the signature.
- **`lib/`**
  - **`af4ai-model.mjs`** builds a model from the DNA. Primitives: `grp`, `box`, `cyl`, `sph`, `inst`, `comp`. Helpers: `wall` with openings, `window_`, `rail`, `plants`. `OPT` sets the frame, glass, mullion and rail materials. `writeAll` outputs the GLB, the phase-tagged hero GLB, the SketchUp .rb and prims.json.
  - **`prep-glb.mjs`** prepares any outside GLB, e.g. from Codex.
    - Options: `--add extra.glb`, `--drop`, `--usage NAME=site|parking|sea|routes|boardwalk|landscape|context|facade|roof`, `--recolor mat=#hex`.
    - Writes a full GLB and a hero GLB. The hero drops basements, tags phases S/T/O/F/R/L, and is pruned, welded and meshopt-compressed.
  - **`glb2rb.mjs`** turns a GLB into SketchUp Ruby: one component per mesh, instances with full transforms.
- **`hero/`**
  - `hero-buttons.html`: the hero display mode.
  - `hero-video.html`: the empty mode, with `__manual`, `__renderOnce`, `__cam` and `__abs`.
  - `hero_v2.py`: upgrades an older page.
  - `standalone.mjs <page> <glb> <out.html>`: one offline HTML.
- **`shots/`**: `view.html` and `shots.mjs`. view.html supports `glb=`, shadow extent, sun target, meshopt, planY/secX clips, clay mode and ortho.
- **`video/`**
  - `render-frames.mjs video.json [--local]`.
  - `render-local.cmd`.
  - `align.py`: SIFT alignment.
  - `reel_sharaa.py` + `compose_s.py`: the reel template, with intro card, 3D build, Veo time-lapse, photos and end card.

Older kit (palace and villa era, not included in this repository): `build.mjs`, `hero/hero-template.html`, `project-03/…`.

**Cloud shell notes:**
- npm deps: @gltf-transform/core, extensions, functions; meshoptimizer; sharp; three@0.169.0; playwright-core; esbuild.
- Python: PIL (raqm), opencv, numpy. Ruby for `ruby -c`.
- Chromium is at /opt/pw-browsers/chromium; run it with the SwiftShader flags.
- The cloud cannot reach CDNs, so serve three from node_modules.

**Library data:**
- `<LIBRARY>/` (optional, your own project library) holds `manifest.json`, `<slug>.pipeline.json` and the PDFs.
- The DNA is lock 1 and the facts are in `info`.
- Example site slugs (projects already published with 3D on af4ai.com):
  - private-villa, residential-building (Yasmine), restaurant-cafe (Sidra).
  - shopping-mall (Rewaq), mixed-use-tower (Hilal), elderly-care-home (Sakina).
  - coastal-resort (Sharaa).

## Step 0 — Intake and the output plan (always first)
Check for a `progress.json` first and offer to resume. Then ask in one AskUserQuestion batch:
1. **What do you have?**
   - **A GLB:** SketchUp 2024 glTF export, or one from Codex or elsewhere.
   - **An image with a brief:** a cover or facade image and a text brief.
   - **A library project:** pick from manifest.json.
   - **A brief only.**
2. **Which pipeline?**
   - The library project's own pipeline.
   - The generic pipeline, filled from the user's details through BRF-00.
3. **Which outputs?** (multiSelect)
   - The 3D model: GLB plus a SketchUp .rb.
   - The hero with buttons (HTML).
   - The empty video page.
   - Explainer shots and AI renders.
   - Explainer videos (Veo).
   - The 23 s reel.
   - A narrated film.
   - A booklet album by stage.
   - Ready for the site: `assets/3d/<slug>` and an album.
4. **Where do frames render?** Ask now; it is confirmed again in Step 7.
   - In the cloud: slow, nothing needed on the user's side.
   - On the user's PC: fast, but needs Node.js and Microsoft Edge, and the user double-clicks a .cmd file.

**Then write the plan:**
- Project and slug.
- Inputs.
- The chosen outputs.
- The stage list (Steps 1-8 below, minus the ones not needed) with a rough time per stage.
- The project folder: `<PROJECTS>/<NN>-<slug>/` (structure in Step 8).

Ask "نبدأ؟". Create the folder and `progress.json` only after a yes.

## Step 1 — Project facts and pipeline
- **Library project:** read its pipeline.json. Show name, place, the key facts and the step count per stage.
- **Generic:**
  1. Give the BRF-00 prompt with the user's description filled in, or run it yourself from the brief they gave.
  2. Save the answer as `00-brief/facts.json`.
  3. Run `fill-pipeline.py` to get `00-brief/<slug>.pipeline.json`.
  4. Show the filled DNA. The user approves it or edits it.
- **Image with a brief:** also list the massing read from the image: footprint, floors and floor heights, facade zones left to right with widths, balconies, fins, crown, ground floor, roof.

Ask before going on.

## Step 2 — The model
**Path A: the user's GLB (~5-10 min)**
- **A SketchUp GLB:** `IMIN=8 node build.mjs in.glb <slug>-desktop.glb 0.015 1024` (old kit, not included here; `lib/prep-glb.mjs` below does the same job for any GLB). It does metalRough, dedup, phase classification, simplify, instance, webp and meshopt. Strip KHR_materials_specular and ior. Targets: desktop ≤ 4 MB, mobile ≤ 2 MB.
- **Any other GLB, e.g. Codex:** `node lib/prep-glb.mjs in.glb out <slug> [--add additions.glb] [--usage …] [--recolor …]`.
  - Missing parts (landscape, facade fins, domes, wings) go in an additions file built with af4ai-model.mjs. Compare with the project images and close the gaps.
  - To duplicate nodes, copy them by hand: create a new node with the same mesh, translation, rotation, scale and extras. gltf-transform `Node.clone` fails.

**Path B: from an image or the DNA (~1-1.5 h)**
1. Write `gen.mjs` with af4ai-model.mjs: a parameter block, then the geometry.
   - Groups: SITE, GF, TYP (a typical floor, as one component instanced N times), PLxx, ROOF, CROWN, LAND.
   - Units are metres. Axes: Y up, main facade +Z.
   - `HERO=1` writes the phase-tagged hero build with a trimmed site.
2. Check the output:
   - `ruby -c` on the .rb, plus a dry run against the mock SketchUp API.
   - Render the cover angle with view.html and put it side by side with the image. Iterate on proportions.

**Both paths:**
- Write the SketchUp .rb with glb2rb.mjs. The user checks the model in SketchUp: fix reversed faces, missing colours.
- Report size, triangle count and the phases found.

Ask before going on.

## Step 3 — Stages from the model
Phases come from material tags `S|T|O|F|R|L`:
- **S** site.
- **T** structure.
- **O** openings and glass.
- **F** facade and ornament.
- **R** roof and crown.
- **L** landscape.

Prep-glb takes them from `extras.usage`, then from the material name. Basements are dropped.

The build order maps to the stage bar:
- الموقع: S plus the survey points.
- الهيكل: T rising.
- الأدوار: slabs.
- الفتحات: O fading in.
- التشطيب: F rising and the tint cleared, then R.
- الاكتمال: L, and the camera pulls back.

Check it:
- Render each phase highlighted and send a contact sheet.
- Fix any wrong classification with `--usage`.
- Check the roof level and sentinels: cut sentinels must be 9999, not 99, or floors above 99 m disappear.

Ask before going on.

## Step 4 — The two display modes
**1. Empty mode, for video:** `hero-video.html`.
- No buttons, no stage bar, no text.
- Driven by `window.__p` (build progress), `__cam {az,el,d,h}`, `__abs {pos,tgt,fov,k}` and `__renderOnce()`.

**2. Hero with buttons, for HTML display:** `hero-buttons.html`, with the controls and the light renderer above.
- Set CFG: `desktop`, `mobile`, sizes, `roofFix`, `procTrees`, `camScale` (tall buildings ~1.75), `mobScale` (~1.1-1.45), `gndY` (−0.6 when there is sea).
- Set the camera keys `K` (az, el, d, h); shift az by π to end on the sea side.
- Use camera far 6000 for big sites, or the mobile view comes out blank.
- Regenerate poster.webp from the final state.
- Snapshot at p values 0.15, 0.4, 0.62 and 1, desktop 1600x1000 and mobile 390x844.

**Deliverables for this step:**
- A standalone single HTML from `standalone.mjs`.
- An artifact for preview, with the models as base64 `.b64.txt`.
- A web folder.
- For the site, a copy at `site/assets/3d/<slug>/index.html`. Add the doctype, `lang="ar" dir="rtl"` and the viewport meta in front. The project page then shows "عرض المشروع 3D" by itself.

Ask before going on.

## Step 5 — Explainer shots
1. **Base shots**
   - Path A: `aishots` renders the front, three-quarter, aerial and front-vertical views. First find the real main facade with a ring of azimuths.
   - Path B: use the view.html shots (street, three-quarter, aerial, corner 9:16).
   - Either way, write `cameras.json` with each absolute camera.
2. **AI render prompt:** photorealistic, keep the exact geometry, Image-to-Image strength 0.35-0.5 or ControlNet canny/depth, same aspect ratio.
   - The user renders and drops the results into `shots/ai-base-shots/` as 01.png…04.png.
3. **Align:** run `align.py` (SIFT similarity) and check the 50% overlays.
4. **Booklet images:** if the album is an output, walk the pipeline's EXT, INT and later stages using these renders as the references. The `af4ai-project-pipeline` skill does the step-by-step loop if it is installed.

Ask before going on.

## Step 6 — Explainer videos from the shots
Build the Veo prompts from the MOV steps of the pipeline:
- Start and end frames come from the Step 5 shots.
- The time-lapse ends on the hero view.

**For a seamless dissolve from model to reality:**
1. Render the last 3D frame with `__abs` set to the exact camera of the Veo first frame or the AI render.
2. Blend from about 85% of the 3D segment onwards.

The user generates the clips in Flow and drops them into `video/veo/`. Extract the frames (PNG at 24 fps).

Ask before going on.

## Step 7 — Build the video: two paths
Confirm the path with the user first.
- **Cloud (slow):** `node render-frames.mjs video.json`.
  - SwiftShader takes ~1-6 s per frame.
  - Run in FOREGROUND batches with `timeout 575`; the script resumes from existing frames, and background processes die when the session idles.
  - Two formats can run in parallel.
- **On the user's PC (fast):**
  1. Check first, with device_bash and the folder listing, that the project folder is connected.
  2. Ask the user to confirm that Node.js is installed. Edge ships with Windows.
  3. Write `video.json` and copy `render-frames.mjs`, `render-local.cmd` and the `site/` folder (video.html and the model) into `<project>/video/`.
  4. The user double-clicks `render-local.cmd`. Edge renders with the GPU, usually in a few minutes. Claude cannot start Windows apps.
  5. The user says "الفريمات خلصت".
  6. Composition runs in the device shell if it has ffmpeg, PIL and cv2 (it did on 19 Oct: node 22, ffmpeg, cv2, 2 cores, 3 GB). Otherwise, stage the frames and compose in the cloud.

**`video.json` fields:**
- `site`, `out`, `w`, `h`, `fps`, `dur`.
- `keys`: `[[u,{az,el,d,h}],…]`.
- `build`: `[p0, end]`.
- `abs`: `{pos, tgt, fov, from}`.

**The reel:** copy `reel_sharaa.py` and `compose_s.py`. Change:
- The paths.
- The 3D and Veo time windows.
- The photo order.
- The Arabic titles: phase titles, photo titles and the end card.
- The crops.

Run `preview` first: check frames at key times and send a contact sheet.

**Encode two versions:**
- Delivery: ~9.5 Mbps, under 30 MB.
- Master: ~20 Mbps, sent with SendUserFile.

**Narration, only if asked:**
- Use as few calls as possible; the Gemini free tier allows 3 per minute.
- Needs ffmpeg on Windows.
- Trim silences, atempo 1.05, loudnorm −14 LUFS.

Ask before going on.

## Step 8 — The final product: one folder with everything
```
<NN>-<slug>/
  README.md                 what's inside, how to view it, how to publish it
  progress.json
  00-brief/                 facts.json, <slug>.pipeline.json, brief.md, reference images
  model/                    <slug>.glb, <slug>-hero.glb, <slug>_sketchup.rb, source/ (gen.mjs or additions, prep command)
  hero/                     <slug>-hero.html (standalone, with buttons), web/ (index.html + glb), video.html (empty mode), poster.webp
  shots/                    refs/, ai-base-shots/ (01..04 + cameras.json), contact sheets
  album/                    00_Anchors_…, 01_BRF_…, … 10_MOV_…   (site album format)
  video/                    veo/, frames/, AF4AI-<slug>-reel-9x16.mp4 (delivery), -master.mp4, video.json
  site/                     assets/3d/<slug>/index.html, the album command
```
**Write README.md in Arabic.** It covers:
- The contents.
- How to open the hero: double-click.
- How to put it on the site:
  1. Copy `site/assets/3d/<slug>` into your site's `assets/3d/` folder.
  2. Add the album with your site's own tooling (if it has one).
  3. Deploy your site as usual.

**Delivery:**
- device_commit_files limits: 30 MB per file, 100 MB per call.
- If committing a large staged path returns HTTP 400, send the file with SendUserFile first, then commit it by fileUuid.
- Send the master video through SendUserFile only.

## Details kept from v1 (palace, villa 02, Yasmine 04)
**Old-kit sources:**
- `af4ai-3d\04-yasmine\source\`: gen.mjs, opt.mjs, standalone.mjs, draw2d.py, view.html, shots.mjs.
- Old pipeline-kit (not included): build.mjs, simp.mjs, video/aishots.mjs, timeline.mjs, render.mjs, compose.py, reel.py.

**Library data:**
- In pipeline.json, the locks also include the signature (the `SIGNATURE` value in facts.json).
- The reference sentences start "Using the attached image as the main architectural reference…".
- The booklet cover is the reference for facade character. When the data and the image disagree, the data wins. Yasmine's cover showed 7 floors, the DNA said 10, so 10 were built.

**build.mjs internals:**
- It renames materials to `P|name`.
- It clones meshes per phase with deep-cloned primitives, because Mesh.clone is shallow.
- It compacts vertices before a position-only simplify. Meshopt treats unreferenced coincident vertices as seams and refuses to simplify.
- The mobile build: `… <slug>-mobile.glb 0.06 512`.
- Phase classification from the world bounding box:
  - Thin, tall ornament goes to T (columns).
  - Anything at or above the roof level goes to R. Check ROOF_Y for each project.

**Path B outputs:**
- Use `node opt.mjs out/<name>-hero-raw.glb out/<name>-desktop.glb`: prune, weld, meshopt. Don't use dedup; it merges the phase materials. Yasmine came to about 600 KB and 90k triangles, one file for desktop and mobile.
- The .rb from gen.mjs maps three (x,y,z) to SketchUp (x,-z,y). Each box is its own group, the typical floor is a component definition, and materials are named `<Name>_<mat>`. The user pastes it into Extensions > Developer > Ruby Console. Yasmine had a dark roof face that needed Reverse Faces.
- Plans and sections are drawn by draw2d.py from prims.json, not from clipped renders: black poche cut, glass in blue, labels, dimensions, levels.
- Don't put a camera inside a neighbour block.

**Hero details:**
- `roofFix`: domes that lost their colour in the export get slate navy (0x2a2f47) at runtime.
- The web folder: index.html with three from a CDN and the real .glb files; the loader parses the ArrayBuffer directly.

**Video details:**
- The Path A film timeline: 24 fps, t 1.5-21 s. Around t 17.6-20.4 the camera blends to the 04-front-vertical camera (Yasmine: scale 1.002 after SIFT).
- Test 6-7 key frames before the full run.
- Film: `compose.py 16x9|9x16|4x5`; 4:5 is a crop of 9:16.

**Narration setup:**
- Needs ffmpeg on Windows (`winget install Gyan.FFmpeg`) and a full restart of the Claude app.
- The output lands in `~/flow-mcp-out/…`, which is outside the connected folders, so request access to it.

**Intake:** files over 30 MB come in through a folder the user adds with "+" > Add folder; request access to that one folder.

## Lessons (avoid repeating)
- view.html needs MeshoptDecoder for meshopt GLBs.
- A thatched or round roof built from one sphere reads as a floating ball; use stepped cylinders.
- The ground disc can cover the sea; use `CFG.gndY`.
- The heroshot port must match its server.
- A sed replacement with `&` corrupts JS; edit with Python.
- In hero_v2, declare `dirty` before `themeColors()` runs (TDZ).
- Keep the loader's InstancedMeshes when merging, or everything instanced disappears (villa).

## Time budget
- **User:**
  - Path A: model prep and export, 30-60 min.
  - SketchUp check: 5 min.
  - AI renders: ~15 min.
  - Veo clips: ~20 min.
- **Claude:**
  - Path B model: 1-1.5 h.
  - Hero and shots: ~20 min.
  - Frames: 10-60 min in the cloud, a few minutes on the user's PC.
  - Reel: ~5 min.

## Keep-awake
Optional (not included): a small `keep-awake.ps1` keeps Windows awake while Claude runs; a `start-keep-awake.vbs` launcher goes in shell:startup.
