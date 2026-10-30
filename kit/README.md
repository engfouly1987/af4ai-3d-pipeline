# AF4AI pipeline kit v2 (19 Oct 2026)

Everything the AF4AI 3D/project pipeline uses, in one folder. Claude stages what it needs; you double-click the .cmd files.

| Folder | What | Main files |
|---|---|---|
| pipeline/ | Generic 40-step project pipeline for ANY project + filler | generic.pipeline.json, fill-pipeline.py, make_generic.py |
| lib/ | Model tools | af4ai-model.mjs (model from DNA → GLB + hero GLB + SketchUp .rb), prep-glb.mjs (any GLB → phase-tagged hero GLB; --add/--drop/--usage/--recolor), glb2rb.mjs (GLB → SketchUp Ruby) |
| hero/ | The two display modes | hero-buttons.html (hero with stage bar, zoom, exit, explore; light renderer), hero-video.html (empty page for video frames), hero_v2.py (upgrade an older hero page), standalone.mjs (one offline HTML) |
| shots/ | Reference / AI base shots | view.html, shots.mjs |
| video/ | Frames + reel | render-frames.mjs (cloud or --local), render-local.cmd (your PC: Edge + GPU), align.py, reel_sharaa.py + compose_s.py (reel template) |

## Generic pipeline
1. Step BRF-00: paste the intake prompt in ChatGPT/Gemini with your project description → save the JSON answer as `facts.json`.
2. `python fill-pipeline.py generic.pipeline.json facts.json <slug>.pipeline.json` (add `--clean` for images without board text and signature).
3. The result has the same shape as the library pipelines: the site admin can upload it, and the Claude skill can walk it step by step.

## Video frames on your PC
Put `render-frames.mjs`, `render-local.cmd`, `video.json` and the project `site/` folder (with video.html + model) together, then double-click `render-local.cmd`. Needs Node.js and Microsoft Edge (already on Windows).
